import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, ASSISTANT_ID, ASSISTANT_NAME } from '../lib/mockDb';
import { User, Proposal, ChatMessage, TravelMode, BookingLifecycleStatus, ParticipationState, Trip, AssistantPickItem } from '../types';
import { M3Button, M3Card } from '../components/ui/M3Components';
import PaymentModal from '../components/PaymentModal';
import { getTravelOptions, getHotelOptions } from '../lib/mockBookingApis';
import FlightSearch from './FlightSearch';

interface TripRoomProps {
  tripId: string;
  user: User;
  onBack: () => void;
}

const TripRoom: React.FC<TripRoomProps> = ({ tripId, user, onBack }) => {
  const [tab, setTab] = useState<'chat' | 'booking'>('booking');
  const [bookingTab, setBookingTab] = useState<'travel' | 'flight' | 'stay'>('flight');
  const [msg, setMsg] = useState('');
  const [showPay, setShowPay] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [trip, setTrip] = useState(db.getTripById(tripId, user.id));
  const [chat, setChat] = useState(db.getChatMessages(tripId));
  const [selections, setSelections] = useState(db.getTripSelections(tripId));

  useEffect(() => {
    const interval = setInterval(() => {
      setTrip(db.getTripById(tripId, user.id));
      setChat(db.getChatMessages(tripId));
      setSelections(db.getTripSelections(tripId));
    }, 1500);
    return () => clearInterval(interval);
  }, [tripId, user.id]);

  const isInitiator = trip?.ownerId === user.id;
  const booking = trip?.bookingStateObj || { bus: { proposals: [], lockedProposalId: null, votes: {} }, flight: { proposals: [], lockedProposalId: null, votes: {} }, hotel: { proposals: [], lockedProposalId: null, votes: {} }, lifecycleStatus: BookingLifecycleStatus.PLANNING, paymentEnabled: false };
  
  const lockedBusProp = booking.bus.proposals.find(p => p.id === booking.bus.lockedProposalId);
  const lockedFlightProp = booking.flight.proposals.find(p => p.id === booking.flight.lockedProposalId);
  const lockedHotelProp = booking.hotel.proposals.find(p => p.id === booking.hotel.lockedProposalId);
  
  const totalPayable = (lockedBusProp?.pricePerPerson || 0) + (lockedFlightProp?.pricePerPerson || 0) + (lockedHotelProp?.pricePerPerson || 0);

  const busLocked = !!booking.bus.lockedProposalId;
  const flightLocked = !!booking.flight.lockedProposalId;
  const hotelLocked = !!booking.hotel.lockedProposalId;
  
  const bothLocked = (busLocked || flightLocked) && hotelLocked;
  const isApprovedMember = trip?.userParticipation === ParticipationState.APPROVED_UNPAID || trip?.userParticipation === ParticipationState.APPROVED_PAID || isInitiator;
  const isPaid = trip?.userParticipation === ParticipationState.APPROVED_PAID;
  const paymentsEligible = bothLocked && isApprovedMember && !isPaid;

  useEffect(() => {
    db.resetUnreadCount(tripId);
  }, [tripId]);

  useEffect(() => {
    const welcomeKey = `assistant_seeded_${tripId}`;
    const picksKey = `assistant_picks_seeded_${tripId}`;
    
    if (tab === 'chat') {
       if (localStorage.getItem(welcomeKey) !== 'true') {
          db.addChatMessage(tripId, ASSISTANT_ID, ASSISTANT_NAME, `Welcome to the tribe 👋 I’m ${ASSISTANT_NAME}. I’ll help you lock travel & stay.`);
          localStorage.setItem(welcomeKey, 'true');
       }
       if (localStorage.getItem(picksKey) !== 'true') {
          const payload = {
            buses: {
              topRated: { id: "b-tr", name: "SeaBird Express", rating: 4.7, reviews: "2,130", departTime: "22:30", arriveTime: "07:10", duration: "8h 40m", price: 1450, label: "Best Rated" },
              mostBooked: { id: "b-mb", name: "VRL Night Rider", rating: 4.4, reviews: "1,540", departTime: "21:45", arriveTime: "06:40", duration: "8h 55m", price: 1250, bookings: "5,800+", label: "Most Booked" }
            },
            hotels: {
              topRated: { id: "h-tr", name: "Casa Candolim Boutique", rating: 4.8, reviews: "1,020", area: "Candolim", pricePerNight: 2600, label: "Top Rated" },
              mostBooked: { id: "h-mb", name: "Baga Bay Stay", rating: 4.3, reviews: "1,890", area: "Baga", pricePerNight: 1950, bookings: "9,200+", label: "Most Booked" }
            }
          };
          db.addChatMessage(tripId, ASSISTANT_ID, ASSISTANT_NAME, "I've analyzed your trip. Here are some recommendations:", undefined, "assistant_picklist", payload);
          localStorage.setItem(picksKey, 'true');
       }
       setChat(db.getChatMessages(tripId));
    }
  }, [tab, tripId]);

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

  return (
    <div className="fixed inset-0 z-[110] bg-white flex flex-col page-transition">
      <header className="bg-white h-auto shrink-0 flex flex-col px-4 pt-8 pb-4 z-20">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-[#0A3D91] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="text-center flex-1">
            <h1 className="text-sm font-black tracking-tight text-[#0F172A] uppercase italic">Live Hub</h1>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               <p className="text-[8px] font-black text-green-600 uppercase tracking-widest">Active Thread</p>
            </div>
          </div>
          <div className="shrink-0 flex items-center justify-end">
             {isPaid ? (
                <div className="bg-[#E9FBF3] text-[#1CB974] px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm border border-[#1CB974]/20">
                   PAID ✅
                </div>
             ) : paymentsEligible ? (
                <button onClick={() => setShowPay(true)} className="bg-green-600 text-white px-6 h-11 flex items-center rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                  Pay Now
                </button>
             ) : <div className="w-10"></div>}
          </div>
        </div>
        
        <div className="flex bg-[#F8FAFF] p-1.5 rounded-[2rem] max-w-sm mx-auto w-full border border-gray-100 shadow-inner">
          <button onClick={() => setTab('chat')} className={`flex-1 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'chat' ? 'bg-white shadow-md text-[#0A3D91]' : 'text-gray-400'}`}>Chat</button>
          <button onClick={() => setTab('booking')} className={`flex-1 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'booking' ? 'bg-white shadow-md text-[#0A3D91]' : 'text-gray-400'}`}>Booking</button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col relative border-t border-gray-50">
        {tab === 'chat' ? (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-24">
              {chat.map(m => (
                <div key={m.id} className={`flex flex-col ${m.userId === user.id ? 'items-end' : m.userId === 'system' || m.userId === ASSISTANT_ID ? 'items-center' : 'items-start'}`}>
                  {m.userId === 'system' ? (
                    <div className="bg-gray-100/50 text-gray-400 text-[8px] font-black uppercase px-4 py-2 rounded-full tracking-widest my-1">{m.text}</div>
                  ) : (
                    <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${m.userId === user.id ? 'bg-[#0A3D91] text-white rounded-tr-none' : 'bg-[#F8FAFF] rounded-tl-none border border-gray-100'}`}>
                      {m.userId !== user.id && <p className="text-[8px] font-black text-[#0A3D91] uppercase mb-1 tracking-widest">{m.userName}</p>}
                      <p className="text-[12px] font-bold leading-relaxed">{m.text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-50 flex gap-3 absolute bottom-0 left-0 right-0 z-10">
              <input value={msg} onChange={e => setMsg(e.target.value)} className="flex-1 bg-[#F8FAFF] border border-gray-100 px-5 py-3 rounded-full text-[12px] font-bold outline-none focus:bg-white focus:border-[#0A3D91] shadow-inner" placeholder="Message tribe..." />
              <button type="submit" className="w-11 h-11 bg-[#0A3D91] text-white rounded-full flex items-center justify-center shadow-md active:scale-95 shrink-0"><svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9-7-9-7v14z"/></svg></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="px-4 py-4 shrink-0 flex justify-center">
              <div className="flex items-center gap-2 p-1.5 bg-[#F8FAFF] rounded-[2rem] w-full max-w-sm border border-gray-100 shadow-inner">
                <button onClick={() => setBookingTab('travel')} className={`flex-1 py-2.5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${bookingTab === 'travel' ? 'bg-white text-gray-900 border border-gray-100 shadow-sm' : 'text-gray-400'}`}>Travel</button>
                <button onClick={() => setBookingTab('flight')} className={`flex-1 py-2.5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${bookingTab === 'flight' ? 'bg-white text-[#0A3D91] border-2 border-gray-900 shadow-md' : 'text-gray-400'}`}>Flight</button>
                <button onClick={() => setBookingTab('stay')} className={`flex-1 py-2.5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${bookingTab === 'stay' ? 'bg-white text-gray-900 border border-gray-100 shadow-sm' : 'text-gray-400'}`}>Stay</button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {bookingTab === 'flight' ? (
                <div className="absolute inset-0">
                  {flightLocked ? (
                    <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-6 bg-white overflow-y-auto">
                      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-inner border border-green-100">
                         <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-[#0F172A] uppercase italic tracking-tight">Flight Selection Locked</h3>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-2">The tribe has decided on: {lockedFlightProp?.title}</p>
                      </div>
                    </div>
                  ) : (
                    <FlightSearch isEmbedded onPropose={(f) => db.proposeOption(tripId, 'FLIGHT', user.id, f)} />
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 overflow-y-auto p-4 space-y-6 no-scrollbar pb-32">
                  {bookingTab === 'travel' ? (
                    <section className="space-y-4">
                      <h2 className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase text-center">Transport Selection</h2>
                      {!busLocked && travelOptions.map(opt => (
                        <div key={opt.id} className="p-5 bg-white border border-gray-100 rounded-[1.5rem] flex justify-between items-center shadow-sm hover:border-[#0A3D91]/20 transition-all text-left">
                           <div>
                             <p className="text-[12px] font-black text-gray-900 uppercase">{opt.operator}</p>
                             <p className="text-[10px] text-gray-400 font-bold mt-1 tracking-tight">{opt.departTime} - {opt.arriveTime}</p>
                           </div>
                           <div className="text-right">
                             <p className="text-sm font-black text-[#0A3D91]">₹{opt.price}</p>
                             <button onClick={() => db.proposeOption(tripId, 'BUS', user.id, opt)} className="mt-2 bg-blue-50 text-[#0A3D91] px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest active:scale-95 transition-all">Propose</button>
                           </div>
                        </div>
                      ))}
                      {busLocked && <div className="p-10 text-center bg-green-50 rounded-[2rem] text-[11px] font-black text-green-600 uppercase tracking-widest italic">Bus selection locked ✅</div>}
                    </section>
                  ) : (
                    <section className="space-y-4">
                      <h2 className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase text-center">Basecamp Options</h2>
                      {!hotelLocked && hotelOptions.map(opt => (
                        <div key={opt.id} className="p-5 bg-white border border-gray-100 rounded-[1.5rem] flex justify-between items-center shadow-sm hover:border-[#0A3D91]/20 transition-all text-left">
                           <div>
                             <p className="text-[12px] font-black text-gray-900 uppercase">{opt.name}</p>
                             <p className="text-[10px] text-gray-400 font-bold mt-1 tracking-tight">{opt.area} • {opt.rating}★</p>
                           </div>
                           <div className="text-right">
                             <p className="text-sm font-black text-[#0A3D91]">₹{opt.totalPrice}</p>
                             <button onClick={() => db.proposeOption(tripId, 'HOTEL', user.id, opt)} className="mt-2 bg-blue-50 text-[#0A3D91] px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest active:scale-95 transition-all">Propose</button>
                           </div>
                        </div>
                      ))}
                      {hotelLocked && <div className="p-10 text-center bg-green-50 rounded-[2rem] text-[11px] font-black text-green-600 uppercase tracking-widest italic">Stay selection locked ✅</div>}
                    </section>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showPay && <PaymentModal isOpen={showPay} onClose={() => setShowPay(false)} onConfirm={() => { db.markPaid(tripId, user.id, totalPayable); setShowPay(false); }} amount={totalPayable} itemLabel="Locked Expedition Pack" />}
    </div>
  );
};

export default TripRoom;