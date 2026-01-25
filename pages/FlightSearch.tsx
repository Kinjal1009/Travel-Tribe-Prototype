import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Flight, FlightSearchResponse } from '../types';
import { M3Button, M3Card } from '../components/ui/M3Components';

const MCP_SERVER_URL = 'https://google-flights-mcp-production-865a.up.railway.app/';

const AIRPORTS: Record<string, string> = {
  'Mumbai': 'BOM', 'Bombay': 'BOM',
  'Delhi': 'DEL', 'New Delhi': 'DEL',
  'Bangalore': 'BLR', 'Bengaluru': 'BLR',
  'Hyderabad': 'HYD',
  'Chennai': 'MAA', 'Madras': 'MAA',
  'Kolkata': 'CCU', 'Calcutta': 'CCU',
  'Goa': 'GOI',
  'Pune': 'PNQ',
  'Ahmedabad': 'AMD',
  'Kochi': 'COK', 'Cochin': 'COK',
  'Trivandrum': 'TRV',
  'New York': 'JFK',
  'Los Angeles': 'LAX',
  'London': 'LHR',
  'Dubai': 'DXB',
  'Singapore': 'SIN',
  'Dehradun': 'DED',
  'Rishikesh': 'DED'
};

interface Message {
  role: 'user' | 'assistant';
  content: string | React.ReactNode;
}

interface SearchParams {
  origin: string | null;
  destination: string | null;
  date: string | null;
}

interface FlightSearchProps {
  onBack?: () => void;
  isEmbedded?: boolean;
}

const FlightSearch: React.FC<FlightSearchProps> = ({ onBack, isEmbedded = false }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Namaste! I'm your AI Bot. I'll help you find the best flights for this expedition. Where are you flying from?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    origin: null,
    destination: null,
    date: null
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const callMCPServer = async (origin: string, destination: string, date: string): Promise<FlightSearchResponse | null> => {
    try {
      const response = await fetch(`${MCP_SERVER_URL}execute-tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'search_flights',
          parameters: {
            origin: origin,
            destination: destination,
            departure_date: date
          }
        })
      });
      if (!response.ok) throw new Error(`MCP Server error: ${response.status}`);
      return await response.json();
    } catch (e) {
      console.error('Failed to fetch flights:', e);
      return null;
    }
  };

  const handleSendMessage = async (text: string = input) => {
    const query = text.trim();
    if (!query) return;
    
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setInput('');
    setIsThinking(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      const contextPrompt = `You are an expert flight assistant named AI Bot. 
Current Gathered Information:
- Origin: ${searchParams.origin || 'Not provided'}
- Destination: ${searchParams.destination || 'Not provided'}
- Travel Date: ${searchParams.date || 'Not provided'}

User Message: "${query}"

Today's Date: ${today}
(Reference: Tomorrow is ${tomorrow}, Next Week is ${nextWeek})

Airports/Cities Reference: ${JSON.stringify(AIRPORTS)}

Your Task:
1. Extract any new information (Origin, Destination, or Date) from the user's message.
2. Resolve city names to 3-letter IATA codes using the reference.
3. Generate a friendly, professional response.
4. ALWAYS respond with a JSON block.

RESPONSE FORMAT (JSON ONLY):
{
  "updatedParams": {
    "origin": "CODE or null",
    "destination": "CODE or null",
    "date": "YYYY-MM-DD or null"
  },
  "message": "Your conversational response here"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contextPrompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');
      const newParams: SearchParams = {
        origin: result.updatedParams?.origin || searchParams.origin,
        destination: result.updatedParams?.destination || searchParams.destination,
        date: result.updatedParams?.date || searchParams.date
      };

      setSearchParams(newParams);
      setMessages(prev => [...prev, { role: 'assistant', content: result.message }]);

      if (newParams.origin && newParams.destination && newParams.date) {
        setIsThinking(true);
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Searching for the best tribe fares from ${newParams.origin} to ${newParams.destination} on ${newParams.date}...` 
        }]);

        const flightData = await callMCPServer(newParams.origin, newParams.destination, newParams.date);

        if (flightData && flightData.success && flightData.flights && flightData.flights.length > 0) {
          const sortedFlights = [...flightData.flights].sort((a, b) => a.price - b.price);

          const flightCards = (
            <div className="space-y-3 mt-2">
              <p className="text-gray-400 text-[8px] font-black uppercase tracking-widest mb-2">Matches for your tribe:</p>
              {sortedFlights.slice(0, 5).map((flight, idx) => (
                <M3Card key={idx} className="p-4 border border-gray-100 transition-all hover:border-[#0A3D91]/20 relative overflow-hidden shadow-sm">

                  <div className="flex justify-between items-start mb-3">
                    <span className="font-black text-[#0A3D91] text-[10px] uppercase tracking-widest">{flight.airline}</span>
                    <span className="text-[7px] text-gray-400 font-black uppercase tracking-widest">{flight.stops === 0 ? 'Non-stop' : `${flight.stops} stops`}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-gray-400 text-[8px] font-black uppercase tracking-widest">
                    <div className="flex flex-col">
                      <span className="text-[#0F172A] text-sm font-black">{flight.departure_time || flight.departure}</span>
                      <span className="text-gray-400">{newParams.origin}</span>
                    </div>
                    <div className="flex-grow relative flex items-center">
                      <div className="h-px bg-gray-100 w-full" />
                      <div className="absolute left-1/2 -translate-x-1/2 bg-white px-1.5 text-[10px]">
                        ✈️
                      </div>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[#0F172A] text-sm font-black">{flight.arrival_time || flight.arrival}</span>
                      <span className="text-gray-400">{newParams.destination}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-50">
                    <span className="font-black text-gray-900 text-lg">₹{flight.price.toLocaleString()} {flight === flightData.flights[0] ? '⭐' : ''}</span>
                    <M3Button variant={idx === 0 ? 'filled' : 'tonal'} className="!h-9 !px-6 text-[9px]" onClick={() => window.open(flight.extensions?.[0] || 'https://www.google.com/travel/flights', '_blank')}>
                      BOOK NOW
                    </M3Button>
                  </div>
                </M3Card>
              ))}
            </div>
          );
          setMessages(prev => [...prev, { role: 'assistant', content: flightCards }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: `Apologies, I couldn't find active routes for those details. Try searching for a major hub or a different date?` }]);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "My connection to the traffic control tower was interrupted. Try that again?" }]);
    } finally {
      setIsThinking(false);
    }
  };

  const containerClasses = isEmbedded 
    ? "h-[500px] flex flex-col bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-inner relative"
    : "fixed inset-0 z-[110] bg-[#F8FAFF] flex flex-col page-transition";

  return (
    <div className={containerClasses}>
      {/* Header - Only for Full Screen */}
      {!isEmbedded && (
        <header className="bg-white border-b border-gray-100 h-24 shrink-0 flex flex-col justify-center px-4 shadow-sm z-20">
          <div className="flex items-center justify-between mb-2">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-[#0A3D91] transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div className="text-center">
              <h1 className="text-xs font-black tracking-tighter">AI Booking Bot</h1>
            </div>
            <div className="w-10"></div>
          </div>

          <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar py-1">
            {['origin', 'destination', 'date'].map((key) => {
              const val = (searchParams as any)[key];
              const labels: any = { origin: 'From', destination: 'To', date: 'Date' };
              return (
                <div key={key} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all shrink-0 ${val ? 'bg-blue-50 border-[#0A3D91] text-[#0A3D91]' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                  {val || labels[key]}
                </div>
              );
            })}
          </div>
        </header>
      )}

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className={`flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar ${isEmbedded ? 'pb-24' : 'pb-32'}`}
      >
        {isEmbedded && (
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="h-px bg-gray-100 flex-1" />
            <span className="text-[7px] font-black text-gray-300 uppercase tracking-widest">AI Flight Concierge</span>
            <div className="h-px bg-gray-100 flex-1" />
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
            {m.role === 'assistant' && (
              <span className="text-[7px] font-black text-[#0A3D91] uppercase mb-1 ml-2 tracking-widest">AI Bot</span>
            )}
            <div className={`max-w-[90%] p-3.5 rounded-[1.25rem] shadow-sm text-[10px] font-semibold leading-relaxed ${
              m.role === 'user' 
                ? 'bg-[#0A3D91] text-white rounded-tr-none' 
                : 'bg-gray-50 border border-gray-100 text-[#0F172A] rounded-tl-none'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex items-start">
            <div className="bg-gray-50 border border-gray-100 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
              <div className="w-1 h-1 bg-[#0A3D91] rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-[#0A3D91] rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1 h-1 bg-[#0A3D91] rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Action Tray & Input */}
      <div className={`${isEmbedded ? 'absolute' : 'fixed'} bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 space-y-3 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]`}>
        {!isThinking && messages.length < 4 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['Fly from Delhi', 'Best fare next week', 'Indigo only'].map((s) => (
              <button 
                key={s} 
                onClick={() => handleSendMessage(s)}
                className="text-[8px] font-black uppercase tracking-widest px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-gray-400 hover:text-[#0A3D91] hover:bg-blue-50 transition-all shrink-0"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex gap-2"
        >
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI for flights..."
            className="flex-1 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-full text-[10px] font-bold outline-none shadow-inner focus:bg-white focus:border-[#0A3D91] transition-all"
          />
          <button 
            type="submit"
            disabled={isThinking || !input.trim()}
            className="w-9 h-9 bg-[#0A3D91] text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default FlightSearch;
