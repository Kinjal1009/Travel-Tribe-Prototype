import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, ASSISTANT_ID, ASSISTANT_NAME } from '../lib/mockDb';
import { User, Proposal, ChatMessage, TravelMode, BookingLifecycleStatus, ParticipationState, Trip, AssistantPickItem, FlightOption, Flight } from '../types';
import { M3Button, M3Card } from '../components/ui/M3Components';
import PaymentModal from '../components/PaymentModal';
import { getTravelOptions, getHotelOptions, getFlightOptions } from '../lib/mockBookingApis';
import FlightSearch from './FlightSearch';

interface TripRoomProps {
  tripId: string;
  user: User;
  onBack: () => void;
}

const TripRoom: React.FC<TripRoomProps> = ({ tripId, user, onBack }) => {
  const [tab, setTab] = useState<'chat' | 'booking'>('chat');
  const [bookingTab, setBookingTab] = useState<'travel' | 'stay' | 'flight'>('travel');
  const [msg, setMsg] = useState('');
  const [showPay, setShowPay] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [trip, setTrip] = useState(db.getTripById(tripId, user.id));
  const [chat, setChat] = useState(db.getChatMessages(tripId));
  const [selections, setSelections] = useState(db.getTripSelections(tripId));

  useEffect(() => {
    db.resetUnreadCount(tripId);
  }, [tripId]);

  useEffect(() => {
    if (tab === 'chat') {
       const welcomeKey = `assistant_seeded_${tripId}`;
       if (localStorage.getItem(welcomeKey) !== 'true') {
          db.addChatMessage(tripId, ASSISTANT_ID, ASSISTANT_NAME, `Welcome to the tribe 👋 I’m ${ASSISTANT_NAME}. I’ll help you lock travel & stay. We can choose Bus, Train or Flight for this route.`);
          localStorage.setItem(welcomeKey, 'true');
       }
       setChat(db.getChatMessages(tripId));
    }
  }, [tab, tripId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrip(db.getTripById(tripId, user.id));
      setChat(db.getChatMessages(tripId));
      setSelections(db.getTripSelections(tripId));
    }, 2000);
    return () => clearInterval(interval);
  }, [tripId, user.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chat, tab]);

  const travelOptions = useMemo(() => getTravelOptions(tripId, trip?.startPoint || 'Origin', trip?.location || 'Destination', TravelMode.BUS), [tripId, trip?.location, trip?.startPoint]);
  const hotelOptions = useMemo(() => getHotelOptions(tripId, trip?.location || 'Destination'), [tripId, trip?.location]);

  if (!trip) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    db.addChatMessage(tripId, user.id, user.name, msg);
    setMsg('');
  };

  const handleProposeFlightFromAI = (f: Flight) => {
    const flightPrice = f.price;
    const flightTitle = `${f.airline} ${f.flight_number ? `(${f.flight_number})` : ''}`;
    
    db.proposeOption(tripId, 'FLIGHT', user.id, { 
      id: `ai-flight-${Date.now()}`, 
      title: flightTitle, 
      price: flightPrice, 
      departTime: f.departure_time || f.departure, 
      arriveTime: f.arrival_time || f.arrival 
    });
    
    db.addChatMessage(tripId, user.id, user.name, `Tribe, I found an amazing flight deal via AI: ${flightTitle} for ₹${flightPrice.toLocaleString()}. Please review in Booking!`);
    setTab('chat'); // Switch back to chat to see the announcement
  };

  const isInitiator = trip.ownerId === user.id;
  const booking = trip.bookingStateObj || { bus: { proposals: [], lockedProposalId: null, votes: {} }, hotel: { proposals: [], lockedProposalId: null, votes: {} }, flight: { proposals: [], lockedProposalId: null, votes: {} }, lifecycleStatus: BookingLifecycleStatus.PLANNING, paymentEnabled: false };
  const busLocked = !!booking.bus.lockedProposalId;
  const hotelLocked = !!booking.hotel.lockedProposalId;
  const flightLocked = booking.flight ? !!booking.flight.lockedProposalId : false;
  
  const canPay = booking.paymentEnabled && trip.userParticipation === ParticipationState.APPROVED_UNPAID;

  return (
    <div className="fixed inset-0 z-[110] bg-[#F8FAFF] flex flex-col">
      <header className="bg-white border-b border-gray-100 h-28 shrink-0 flex flex-col justify-center px-4 shadow-sm z-20">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-[#0A3D91] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="text-center overflow-hidden">
            <h1 className="text-xs font-black tracking-tighter truncate max-w-[200px]">The Ultimate Vibe Match</h1>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               <p className="text-[7px] font-black text-green-600 uppercase tracking-widest">Live Hub</p>
            </div>
          </div>
          <div className="w-10"></div>
        </div>
        <div className="flex bg-gray-50 p-1 rounded-2xl max-w-xs mx-auto w-full border border-gray-100">
          <button onClick={() => setTab('chat')} className={`flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tab === 'chat' ? 'bg-white shadow-md text-[#0A3D91]' : 'text-gray-400'}`}>Chat</button>
          <button onClick={() => setTab('booking')} className={`flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tab === 'booking' ? 'bg-white shadow-md text-[#0A3D91]' : 'text-gray-400'}`}>Booking</button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col relative">
        {tab === 'chat' ? (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-24">
              {chat.map(m => {
                const isAssistant = m.userId === ASSISTANT_ID;
                const isSystem = m.userId === 'system';
                return (
                  <div key={m.id} className={`flex flex-col ${m.userId === user.id ? 'items-end' : (isSystem || isAssistant) ? 'items-center' : 'items-start'}`}>
                    {isSystem ? (
                      <div className="bg-[#0A3D91]/5 border border-[#0A3D91]/10 text-[#0A3D91] text-[8px] font-black uppercase px-4 py-2 rounded-full tracking-widest text-center my-2">
                        {m.text}
                      </div>
                    ) : (
                      <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${m.userId === user.id ? 'bg-[#0A3D91] text-white rounded-tr-none' : 'bg-white rounded-tl-none border border-gray-100'}`}>
                        {m.userId !== user.id && <p className="text-[7px] font-black text-[#0A3D91] uppercase mb-0.5 tracking-widest">{m.userName}</p>}
                        <p className="text-[11px] font-semibold leading-relaxed">{m.text}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 absolute bottom-0 left-0 right-0 z-10">
              <input value={msg} onChange={e => setMsg(e.target.value)} className="flex-1 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-full text-[11px] font-bold outline-none shadow-inner" placeholder="Message tribe..." />
              <button type="submit" className="w-9 h-9 bg-[#0A3D91] text-white rounded-full flex items-center justify-center shadow-md"><svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9-7-9-7v14z"/></svg></button>
            </form>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white no-scrollbar pb-32">
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl overflow-x-auto no-scrollbar">
              <button onClick={() => setBookingTab('travel')} className={`shrink-0 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${bookingTab === 'travel' ? 'bg-white text-[#D84E55] shadow-sm' : 'text-gray-400'}`}>Bus</button>
              <button onClick={() => setBookingTab('flight')} className={`shrink-0 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${bookingTab === 'flight' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>Flight</button>
              <button onClick={() => setBookingTab('stay')} className={`shrink-0 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${bookingTab === 'stay' ? 'bg-white text-[#0B74E5] shadow-sm' : 'text-gray-400'}`}>Stay</button>
            </div>

            {bookingTab === 'travel' && (
              <section className="space-y-4">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bus Options</h2>
                {!busLocked && travelOptions.map(opt => (
                  <div key={opt.id} className="p-5 bg-white border-l-4 border-l-[#D84E55] border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm">
                     <div>
                       <p className="text-[10px] font-black text-gray-900 uppercase">{opt.operator}</p>
                       <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{opt.departTime} - {opt.arriveTime}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-xs font-black text-gray-900">₹{opt.price}</p>
                       <button onClick={() => db.proposeOption(tripId, 'BUS', user.id, opt)} className="mt-2 text-[8px] font-black uppercase text-[#D84E55] border border-[#D84E55] px-3 py-1.5 rounded-lg">Propose</button>
                     </div>
                  </div>
                ))}
                {busLocked && <div className="p-10 text-center bg-gray-50 rounded-3xl text-[10px] font-black uppercase tracking-widest text-green-600">Bus Selection Locked ✅</div>}
              </section>
            )}

            {bookingTab === 'flight' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                   <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Flight Concierge</h2>
                   {flightLocked && <span className="text-[8px] font-black text-green-600 uppercase">Selection Locked ✅</span>}
                </div>
                
                {!flightLocked ? (
                  <FlightSearch 
                    isEmbedded 
                    onPropose={handleProposeFlightFromAI} 
                  />
                ) : (
                  <div className="p-10 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Flight arrangements finalized by tribe.</p>
                  </div>
                )}
                
                {booking.flight.proposals.length > 0 && (
                   <div className="mt-6 space-y-3">
                      <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Active Proposals:</p>
                      {booking.flight.proposals.map(p => (
                         <div key={p.id} className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex justify-between items-center">
                            <div>
                               <p className="text-[10px] font-black text-[#0A3D91] uppercase">{p.title}</p>
                               <p className="text-[8px] text-gray-400 font-bold uppercase">{p.departTime} → {p.arriveTime}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-xs font-black text-[#0A3D91]">₹{p.pricePerPerson.toLocaleString()}</p>
                               <div className="flex items-center gap-1 mt-1 justify-end">
                                  <span className="text-[7px] font-black text-blue-400 uppercase">{p.voterIds.length} AGREED</span>
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
              </section>
            )}

            {bookingTab === 'stay' && (
              <section className="space-y-4">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hotel Options</h2>
                {!hotelLocked && hotelOptions.map(opt => (
                  <div key={opt.id} className="p-5 bg-white border-l-4 border-l-[#0B74E5] border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm">
                     <div>
                       <p className="text-[10px] font-black text-gray-900 uppercase">{opt.name}</p>
                       <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{opt.area} • {opt.rating}★</p>
                     </div>
                     <div className="text-right">
                       <p className="text-xs font-black text-gray-900">₹{opt.totalPrice}</p>
                       <button onClick={() => db.proposeOption(tripId, 'HOTEL', user.id, opt)} className="mt-2 text-[8px] font-black uppercase text-[#0B74E5] border border-[#0B74E5] px-3 py-1.5 rounded-lg">Propose</button>
                     </div>
                  </div>
                ))}
                {hotelLocked && <div className="p-10 text-center bg-gray-50 rounded-3xl text-[10px] font-black uppercase tracking-widest text-green-600">Stay Selection Locked ✅</div>}
              </section>
            )}

            {bookingTab !== 'flight' && (
              <div className="pt-6 border-t border-gray-100">
                {trip.userParticipation === ParticipationState.APPROVED_PAID ? (
                    <div className="w-full py-6 bg-green-600 rounded-2xl text-center text-white text-[10px] font-black uppercase tracking-widest">Payment Confirmed ✅</div>
                ) : (
                    <M3Button disabled={!canPay} fullWidth className="!h-16 !rounded-2xl" onClick={() => setShowPay(true)}>{canPay ? `Pay For Expedition (₹${trip.estimatedBudget.toLocaleString()})` : 'Awaiting Selection Locks'}</M3Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showPay && <PaymentModal isOpen={showPay} onClose={() => setShowPay(false)} onConfirm={() => { db.markPaid(tripId, user.id); setShowPay(false); }} amount={trip.estimatedBudget} itemLabel="Tribe Expedition Pack" />}
    </div>
  );
};

export default TripRoom;