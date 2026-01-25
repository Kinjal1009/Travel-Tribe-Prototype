import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, ASSISTANT_ID, ASSISTANT_NAME } from '../lib/mockDb';
import { User, Proposal, ChatMessage, TravelMode, BookingLifecycleStatus, ParticipationState, Trip, AssistantPickItem } from '../types';
import { M3Button, M3Card } from '../components/ui/M3Components';
import PaymentModal from '../components/PaymentModal';
import { getTravelOptions, getHotelOptions } from '../lib/mockBookingApis';

interface TripRoomProps {
  tripId: string;
  user: User;
  onBack: () => void;
}

const TripRoom: React.FC<TripRoomProps> = ({ tripId, user, onBack }) => {
  const [tab, setTab] = useState<'chat' | 'booking'>('chat');
  const [bookingTab, setBookingTab] = useState<'travel' | 'stay'>('travel');
  const [msg, setMsg] = useState('');
  const [showPay, setShowPay] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [trip, setTrip] = useState(db.getTripById(tripId, user.id));
  const [chat, setChat] = useState(db.getChatMessages(tripId));
  const [selections, setSelections] = useState(db.getTripSelections(tripId));

  // Polling for updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTrip(db.getTripById(tripId, user.id));
      setChat(db.getChatMessages(tripId));
      setSelections(db.getTripSelections(tripId));
    }, 1500);
    return () => clearInterval(interval);
  }, [tripId, user.id]);

  // Requirement: Derived variables for header CTA
  const isInitiator = trip?.ownerId === user.id;
  const booking = trip?.bookingStateObj || { bus: { proposals: [], lockedProposalId: null, votes: {} }, flight: { proposals: [], lockedProposalId: null, votes: {} }, hotel: { proposals: [], lockedProposalId: null, votes: {} }, lifecycleStatus: BookingLifecycleStatus.PLANNING, paymentEnabled: false };
  
  const lockedBusProp = booking.bus.proposals.find(p => p.id === booking.bus.lockedProposalId);
  const lockedHotelProp = booking.hotel.proposals.find(p => p.id === booking.hotel.lockedProposalId);
  const totalPayable = (lockedBusProp?.pricePerPerson || 0) + (lockedHotelProp?.pricePerPerson || 0);

  const busLocked = !!booking.bus.lockedProposalId;
  const hotelLocked = !!booking.hotel.lockedProposalId;
  const bothLocked = busLocked && hotelLocked;
  const isApprovedMember = trip?.userParticipation === ParticipationState.APPROVED_UNPAID || trip?.userParticipation === ParticipationState.APPROVED_PAID || isInitiator;
  const isPaid = trip?.userParticipation === ParticipationState.APPROVED_PAID;
  const paymentsEligible = bothLocked && isApprovedMember && !isPaid;

  // Requirement: Debug requirement (small developer-only console log)
  useEffect(() => {
    if (tab === 'chat' && trip?.bookingStateObj) {
      const b = trip.bookingStateObj;
      const isApproved = trip.userParticipation !== ParticipationState.NOT_JOINED;
      const isPaid = trip.userParticipation === ParticipationState.APPROVED_PAID;
      
      console.log(`[Payment Debug] 
        Locked Bus ID: ${b.bus.lockedProposalId}, 
        Locked Hotel ID: ${b.hotel.lockedProposalId}, 
        Payments Open: ${b.paymentEnabled}, 
        Is Approved: ${isApproved}, 
        Is Paid: ${isPaid},
        Total: ₹${totalPayable}`);
    }
  }, [tab, trip?.id, trip?.bookingStateObj, trip?.userParticipation, totalPayable]);

  useEffect(() => {
    db.resetUnreadCount(tripId);
  }, [tripId]);

  // Virtual Assistant Seeding Logic
  useEffect(() => {
    const welcomeKey = `assistant_seeded_${tripId}`;
    const picksKey = `assistant_picks_seeded_${tripId}`;
    
    if (tab === 'chat') {
       if (localStorage.getItem(welcomeKey) !== 'true') {
          db.addChatMessage(tripId, ASSISTANT_ID, ASSISTANT_NAME, `Welcome to the trip group 👋 I’m ${ASSISTANT_NAME}. I’ll help you lock travel & stay faster. I’ve shortlisted the most booked + best rated + value options for this route. You can tap ‘Agree’ to move faster.`);
          db.addChatMessage(tripId, ASSISTANT_ID, ASSISTANT_NAME, "Based on your trip route and dates, here are my top picks. Open the Booking tab to view and agree.");
          localStorage.setItem(welcomeKey, 'true');
       }

       if (localStorage.getItem(picksKey) !== 'true') {
          const payload = {
            buses: {
              topRated: { id: "b-tr", name: "SeaBird Express", rating: 4.7, reviews: "2,130", departTime: "22:30", arriveTime: "07:10", duration: "8h 40m", price: 1450, label: "Best rated overall" },
              cheapest: { id: "b-ch", name: "Konkan Saver", rating: 4.1, reviews: "640", departTime: "23:15", arriveTime: "08:30", duration: "9h 15m", price: 990, label: "Lowest price" },
              mostBooked: { id: "b-mb", name: "VRL Night Rider", rating: 4.4, reviews: "1,540", departTime: "21:45", arriveTime: "06:40", duration: "8h 55m", price: 1250, bookings: "5,800+", label: "Most booked" },
              partnerPick: { id: "b-pp", name: "Travel Tribe Premium", rating: 4.9, reviews: "15,000+", departTime: "20:00", arriveTime: "05:00", duration: "9h 00m", price: 1100, label: "Partner Exclusive", originalPrice: 1800 }
            },
            hotels: {
              topRated: { id: "h-tr", name: "Casa Candolim Boutique", rating: 4.8, reviews: "1,020", area: "Candolim", pricePerNight: 2600, label: "Best rated overall" },
              cheapest: { id: "h-ch", name: "Calangute Budget Inn", rating: 4.0, reviews: "410", area: "Calangute", pricePerNight: 1300, label: "Lowest price" },
              mostBooked: { id: "h-mb", name: "Baga Bay Stay", rating: 4.3, reviews: "1,890", area: "Baga", pricePerNight: 1950, bookings: "9,200+", label: "Most booked" },
              partnerPick: { id: "h-pp", name: "Tribe Basecamp Resort", rating: 4.9, reviews: "500+", area: "Private Beach Front", pricePerNight: 2200, label: "Partner Exclusive", originalPrice: 4500 }
            }
          };
          db.addChatMessage(tripId, ASSISTANT_ID, ASSISTANT_NAME, "I've analyzed your trip. Here are the best options to lock in now:", undefined, "assistant_picklist", payload);
          localStorage.setItem(picksKey, 'true');
       }
       setChat(db.getChatMessages(tripId));
    }
  }, [tab, tripId, trip?.location]);

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

  const handleAgreeFromAssistant = (category: 'bus' | 'hotel', item: AssistantPickItem) => {
    db.setTripSelection(tripId, category, item);
    const categoryLabel = category.toUpperCase();
    db.addChatMessage(tripId, 'system', 'System', `✅ ${user.firstName} agreed to ${categoryLabel}: ${item.name} (${item.label})`);
    const target = category === 'bus' ? 'bus' : 'hotel';
    const existingProp = trip.bookingStateObj?.[target].proposals.find(p => p.optionId === item.id);
    if (existingProp) {
        db.voteOnProposal(tripId, category.toUpperCase() as 'BUS' | 'HOTEL', existingProp.id, user.id, 'YES');
    } else {
        db.proposeOption(tripId, category.toUpperCase() as 'BUS' | 'HOTEL', user.id, item);
    }
  };

  // Tribe payment status list
  const approvedMembers = trip.participants.filter(p => p.status === 'approved');
  const paidCount = approvedMembers.filter(p => p.paid).length;
  const paidTravelers = approvedMembers.filter(p => p.paid).map(p => db.getUser(p.userId)).filter(Boolean) as User[];
  const unpaidTravelers = approvedMembers.filter(p => !p.paid).map(p => db.getUser(p.userId)).filter(Boolean) as User[];

  return (
    <div className="fixed inset-0 z-[110] bg-[#F8FAFF] flex flex-col">
      <header className="bg-white border-b border-gray-100 h-28 shrink-0 flex flex-col justify-center px-4 shadow-sm z-20">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-[#0A3D91] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="text-center overflow-hidden flex-1">
            <h1 className="text-xs font-black uppercase tracking-tighter truncate max-w-[150px] mx-auto">{trip.title}</h1>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               <p className="text-[7px] font-black text-green-600 uppercase tracking-widest">Live Hub</p>
            </div>
            
            {/* Mandatory Debug Label - Header */}
            <div className="text-[6px] font-mono text-gray-300 uppercase mt-0.5 opacity-50">
              DEBUG: app={isApprovedMember ? 'T' : 'F'} bl={busLocked ? 'T' : 'F'} hl={hotelLocked ? 'T' : 'F'} pd={isPaid ? 'T' : 'F'}
            </div>
          </div>
          
          {/* Requirement Location B: Top-right Sticky CTA */}
          <div className="shrink-0 flex items-center justify-end w-28">
             {isPaid ? (
                <div className="bg-green-50 border border-green-100 text-green-600 px-4 h-11 flex items-center rounded-xl text-[9px] font-black uppercase tracking-widest">
                   PAID ✅
                </div>
             ) : paymentsEligible ? (
                <button 
                  onClick={() => setShowPay(true)}
                  className="bg-green-600 text-white px-6 h-11 flex items-center rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-900/20 active:scale-95 transition-all"
                >
                  PAY NOW
                </button>
             ) : <div className="w-10"></div>}
          </div>
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
                const isPaymentsOpenMessage = m.text === "Booking Phase complete. Payments are now OPEN.";

                if (m.type === "assistant_picklist" && m.payload) {
                   return (
                     <div key={m.id} className="w-full flex flex-col items-center space-y-2 pb-1 animate-in fade-in duration-500">
                        <div className="w-full flex items-center justify-center gap-1.5 mb-0.5 opacity-70">
                           <div className="w-3.5 h-3.5 bg-[#0A3D91] rounded-full flex items-center justify-center text-white text-[5px] font-black uppercase shadow-sm">VA</div>
                           <span className="text-[6px] font-black text-[#0A3D91] uppercase tracking-[0.15em]">Recommended Picks</span>
                        </div>
                        <div className="w-full space-y-4 flex flex-col items-center">
                           <div className="w-full flex flex-col items-center">
                              <h3 className="text-[6px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">🚌 Bus Selections</h3>
                              <div className="w-full flex gap-2 overflow-x-auto no-scrollbar px-4 snap-x">
                                 {Object.values(m.payload.buses).map((item: any, i) => (
                                    <AssistantPickCard key={i} item={item} isTravel isAgreed={selections.bus?.id === item.id} onAgree={() => handleAgreeFromAssistant('bus', item)} isPartner={item.label.includes('Partner')} />
                                 ))}
                              </div>
                           </div>
                           <div className="w-full flex flex-col items-center">
                              <h3 className="text-[6px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">🏨 Hotel Selections</h3>
                              <div className="w-full flex gap-2 overflow-x-auto no-scrollbar px-4 snap-x">
                                 {Object.values(m.payload.hotels).map((item: any, i) => (
                                    <AssistantPickCard key={i} item={item} isTravel={false} isAgreed={selections.hotel?.id === item.id} onAgree={() => handleAgreeFromAssistant('hotel', item)} isPartner={item.label.includes('Partner')} />
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                   );
                }

                return (
                  <div key={m.id} className={`flex flex-col ${m.userId === user.id ? 'items-end' : (isSystem || isAssistant) ? 'items-center' : 'items-start'}`}>
                    {isSystem ? (
                      <div className="w-full flex flex-col items-center gap-3">
                         <div className="bg-[#0A3D91]/5 border border-[#0A3D91]/10 text-[#0A3D91] text-[8px] font-black uppercase px-4 py-2 rounded-full tracking-widest text-center">
                           {m.text}
                         </div>
                         {m.proposal && (
                            <CompactProposalCard proposal={m.proposal} trip={trip} currentUserId={user.id} onAgree={() => db.voteOnProposal(tripId, m.proposal!.type as 'BUS' | 'HOTEL', m.proposal!.id, user.id, 'YES')} onDisagree={() => db.voteOnProposal(tripId, m.proposal!.type as 'BUS' | 'HOTEL', m.proposal!.id, user.id, 'NO')} />
                         )}
                         {/* Requirement: Compact Payment Info Card shown in chat after both locks */}
                         {isPaymentsOpenMessage && bothLocked && isApprovedMember && (
                            <div className="w-full max-w-[280px] p-6 bg-white border border-blue-100 rounded-[2rem] shadow-xl flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-700">
                               <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                                  <h4 className="text-[10px] font-black text-[#0A3D91] uppercase tracking-widest">Trip Payment</h4>
                                  <div className="flex items-center gap-1.5">
                                     <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                     <span className="text-[7px] font-black text-green-600 uppercase">Live</span>
                                  </div>
                               </div>
                               
                               <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[9px] font-bold text-gray-500 uppercase tracking-tight">
                                     <span>Bus Transport</span>
                                     <span className="text-[#0A3D91]">₹{(lockedBusProp?.pricePerPerson || 0).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[9px] font-bold text-gray-500 uppercase tracking-tight">
                                     <span>Stay Booking</span>
                                     <span className="text-[#0A3D91]">₹{(lockedHotelProp?.pricePerPerson || 0).toLocaleString()}</span>
                                  </div>
                                  <div className="pt-2 mt-2 border-t border-gray-50 flex justify-between items-center">
                                     <span className="text-[10px] font-black text-gray-900 uppercase">Total Due</span>
                                     <span className="text-sm font-black text-[#0A3D91]">₹{totalPayable.toLocaleString()}</span>
                                  </div>
                               </div>

                               <M3Button 
                                  disabled={isPaid}
                                  fullWidth 
                                  className="!h-12 !rounded-xl" 
                                  onClick={() => setShowPay(true)}
                               >
                                  {isPaid ? 'PAID ✅' : 'PAY NOW'}
                               </M3Button>

                               <div className="text-center pt-1 border-t border-gray-50">
                                  <p className="text-[8px] font-black text-green-600 uppercase tracking-[0.2em]">Paid: {paidCount} / {approvedMembers.length}</p>
                                  <div className="flex justify-center gap-1 mt-2">
                                     {paidTravelers.map(t => (
                                        <img key={t.id} src={t.avatarUrl} className="w-4 h-4 rounded-full border border-green-200" title={t.firstName} alt="" />
                                     ))}
                                  </div>
                               </div>
                            </div>
                         )}
                      </div>
                    ) : isAssistant ? (
                      <div className="w-full flex flex-col items-start gap-1.5 mb-3">
                         <div className="flex items-center gap-1.5">
                           <div className="w-6 h-6 bg-[#0A3D91] rounded-full flex items-center justify-center text-white shadow-md">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 11V9a2 2 0 00-2-2m2 4v4a2 2 0 104 0v-1m-4-3H9m2 0h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           </div>
                           <span className="text-[8px] font-black text-[#0A3D91] uppercase tracking-widest">{ASSISTANT_NAME}</span>
                         </div>
                         <div className="bg-[#F1F5F9] p-3 rounded-2xl rounded-tl-none border border-gray-100 max-w-[85%] shadow-sm">
                            <p className="text-[11px] font-semibold text-gray-700 leading-relaxed">{m.text}</p>
                         </div>
                      </div>
                    ) : (
                      <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${m.userId === user.id ? 'bg-[#0A3D91] text-white rounded-tr-none' : 'bg-white rounded-tl-none border border-gray-100'}`}>
                        {m.userId !== user.id && <p className="text-[7px] font-black text-[#0A3D91] uppercase mb-0.5 tracking-widest">{m.userName}</p>}
                        <p className="text-[11px] font-semibold leading-relaxed">{m.text}</p>
                        <p className={`text-[6px] mt-1.5 opacity-40 font-black text-right ${m.userId === user.id ? 'text-white' : 'text-gray-400'}`}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 absolute bottom-0 left-0 right-0 z-10">
              <input value={msg} onChange={e => setMsg(e.target.value)} className="flex-1 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-full text-[11px] font-bold outline-none focus:border-[#0A3D91] shadow-inner" placeholder="Message tribe..." />
              <button type="submit" className="w-9 h-9 bg-[#0A3D91] text-white rounded-full flex items-center justify-center shadow-md active:scale-95 shrink-0"><svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9-7-9-7v14z"/></svg></button>
            </form>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white no-scrollbar pb-32">
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl max-w-[200px]">
              <button onClick={() => setBookingTab('travel')} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${bookingTab === 'travel' ? 'bg-white text-[#D84E55] shadow-sm' : 'text-gray-400'}`}>Travel</button>
              <button onClick={() => setBookingTab('stay')} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${bookingTab === 'stay' ? 'bg-white text-[#0B74E5] shadow-sm' : 'text-gray-400'}`}>Stay</button>
            </div>

            {bookingTab === 'travel' ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transport Routes</h2>
                  <span className="text-[8px] font-black text-[#D84E55] bg-red-50 px-2 py-0.5 rounded uppercase">redBus</span>
                </div>
                {booking.bus.proposals.map(p => (
                   <PluginProposalCard key={p.id} proposal={p} isLocked={busLocked} isInitiator={isInitiator} currentUserId={user.id} onVote={(v) => db.voteOnProposal(tripId, 'BUS', p.id, user.id, v)} onLock={() => db.lockProposal(tripId, 'BUS', p.id)} color="#D84E55" />
                ))}
                {!busLocked && travelOptions.map(opt => {
                   const isProposed = booking.bus.proposals.some(p => p.optionId === opt.id);
                   return (
                    <div key={opt.id} className={`p-5 bg-white border-l-4 border-l-[#D84E55] border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm ${isProposed ? 'opacity-50' : ''}`}>
                        <div>
                        <p className="text-[10px] font-black text-gray-900 uppercase">{trip.startPoint} → {trip.location}</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-1">{opt.operator} • {opt.seatType}</p>
                        <p className="text-[8px] font-black uppercase mt-1 text-[#D84E55]">{opt.departTime} - {opt.arriveTime}</p>
                        </div>
                        <div className="text-right">
                        <p className="text-xs font-black text-gray-900">₹{opt.price}</p>
                        <button disabled={isProposed} onClick={() => db.proposeOption(tripId, 'BUS', user.id, opt)} className="mt-2 text-[8px] font-black uppercase text-[#D84E55] border border-[#D84E55] px-3 py-1.5 rounded-lg hover:bg-[#D84E55] hover:text-white transition-all">
                            {isProposed ? 'Proposed' : 'Propose'}
                        </button>
                        </div>
                    </div>
                   );
                })}
              </section>
            ) : (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Basecamp Selection</h2>
                  <span className="text-[8px] font-black text-[#0B74E5] bg-blue-50 px-2 py-0.5 rounded uppercase">MakeMyTrip</span>
                </div>
                {booking.hotel.proposals.map(p => (
                   <PluginProposalCard key={p.id} proposal={p} isLocked={hotelLocked} isInitiator={isInitiator} currentUserId={user.id} onVote={(v) => db.voteOnProposal(tripId, 'HOTEL', p.id, user.id, v)} onLock={() => db.lockProposal(tripId, 'HOTEL', p.id)} color="#0B74E5" />
                ))}
                {!hotelLocked && hotelOptions.map(opt => {
                   const isProposed = booking.hotel.proposals.some(p => p.optionId === opt.id);
                   return (
                    <div key={opt.id} className={`p-5 bg-white border-l-4 border-l-[#0B74E5] border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm ${isProposed ? 'opacity-50' : ''}`}>
                        <div>
                        <p className="text-[10px] font-black text-gray-900 uppercase truncate max-w-[150px]">{opt.name}</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-1">{opt.area} • {opt.rating}★ Rating</p>
                        <p className="text-[8px] font-black uppercase mt-1 text-[#0B74E5]">₹{opt.pricePerNight}/night</p>
                        </div>
                        <div className="text-right">
                        <p className="text-xs font-black text-gray-900">₹{opt.totalPrice}</p>
                        <button disabled={isProposed} onClick={() => db.proposeOption(tripId, 'HOTEL', user.id, opt)} className="mt-2 text-[8px] font-black uppercase text-[#0B74E5] border border-[#0B74E5] px-3 py-1.5 rounded-lg hover:bg-[#0B74E5] hover:text-white transition-all">
                            {isProposed ? 'Proposed' : 'Propose'}
                        </button>
                        </div>
                    </div>
                   );
                })}
              </section>
            )}

            <div className="pt-6 border-t border-gray-100 space-y-6">
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expedition Funding</h3>
                    <span className="text-[10px] font-black text-green-600 uppercase">Paid: {paidCount} / {approvedMembers.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {paidTravelers.map(t => (
                      <div key={t.id} className="flex items-center gap-1.5 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
                         <div className="w-3 h-3 rounded-full overflow-hidden border border-green-200">
                           <img src={t.avatarUrl} className="w-full h-full object-cover" alt="" />
                         </div>
                         <span className="text-[8px] font-black text-green-700 uppercase">{t.firstName} (Confirmed)</span>
                      </div>
                    ))}
                    {unpaidTravelers.map(t => (
                      <div key={t.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full opacity-60">
                         <div className="w-3 h-3 rounded-full overflow-hidden border border-gray-200">
                           <img src={t.avatarUrl} className="w-full h-full object-cover" alt="" />
                         </div>
                         <span className="text-[8px] font-black text-gray-500 uppercase">{t.firstName} (Pending)</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {showPay && (
        <PaymentModal 
          isOpen={showPay} 
          onClose={() => setShowPay(false)} 
          onConfirm={() => { db.markPaid(tripId, user.id, totalPayable); setShowPay(false); }} 
          amount={totalPayable} 
          itemLabel="Locked Expedition Pack" 
        />
      )}
    </div>
  );
};

const AssistantPickCard: React.FC<{item: AssistantPickItem, isTravel: boolean, isAgreed: boolean, onAgree: () => void, isPartner: boolean}> = ({ item, isTravel, isAgreed, onAgree, isPartner }) => {
   const color = isTravel ? 'text-[#D84E55]' : 'text-[#0B74E5]';
   const accentBg = isTravel ? 'bg-[#D84E55]/5' : 'bg-[#0B74E5]/5';
   const price = (item.price || item.pricePerNight) || 0;
   const originalPrice = isPartner ? (item.originalPrice || Math.round(price * 1.5)) : null;
   const partnerLabel = isPartner ? 'TRAVEL TRIBE PARTNER' : (isTravel ? 'REDBUS' : 'MAKEMYTRIP');
   const partnerStyle = isPartner ? 'text-[#0A3D91] bg-blue-50/50 border-blue-100' : 'text-gray-400 bg-gray-50 border-gray-100';
   return (
      <div className={`w-[180px] shrink-0 bg-white border rounded-[1.25rem] shadow-sm p-2.5 animate-in slide-in-from-right-4 duration-300 snap-center ${isPartner ? 'border-blue-200 ring-2 ring-blue-50' : 'border-gray-100'}`}>
         <div className="flex flex-col gap-1 items-start mb-1.5">
            <span className={`text-[6px] font-black uppercase px-1.5 py-0.5 rounded border border-gray-50 ${color} ${accentBg}`}>{item.label}</span>
            <div className="w-full flex items-center justify-between">
              <span className={`text-[5.5px] font-black uppercase px-1.5 py-0.5 rounded border ${partnerStyle}`}>{partnerLabel}</span>
              <div className="flex items-center gap-0.5 text-amber-500 font-black text-[6.5px]">★ {item.rating}</div>
            </div>
         </div>
         <h4 className="text-[8.5px] font-black text-[#0F172A] uppercase leading-tight truncate">{item.name}</h4>
         <p className="text-[6.5px] text-gray-400 font-bold uppercase tracking-tight mt-0.5 truncate opacity-80">{isTravel ? `${item.departTime} → ${item.arriveTime}` : `${item.area}`}</p>
         <div className="mt-1.5 flex justify-between items-end border-t border-gray-50 pt-1.5">
            <div>
               <div className="flex items-center gap-1">
                  {originalPrice && <span className="text-[7.5px] text-gray-300 line-through font-bold">₹{originalPrice.toLocaleString()}</span>}
                  <span className={`text-[10px] font-black ${isPartner ? 'text-green-600' : 'text-[#0A3D91]'}`}>₹{price.toLocaleString()}</span>
               </div>
            </div>
            {item.bookings && ( <div className="text-right"> <p className="text-[6px] font-bold text-gray-400 uppercase leading-none">{item.bookings}</p> </div> )}
         </div>
         <button disabled={isAgreed} onClick={onAgree} className={`w-full block mt-2 py-1 rounded-lg text-[6.5px] font-black uppercase tracking-[0.1em] transition-all ${isAgreed ? 'bg-green-50 text-green-600' : 'bg-gray-900 text-white shadow-sm active:scale-95'}`}>{isAgreed ? 'Agreed ✅' : 'Agree'}</button>
      </div>
   );
};

const CompactProposalCard: React.FC<{proposal: Proposal, trip: any, currentUserId: string, onAgree: () => void, onDisagree: () => void}> = ({ proposal, trip, currentUserId, onAgree, onDisagree }) => {
  const hasAgreed = proposal.voterIds.includes(currentUserId);
  const color = proposal.type === 'BUS' ? '#D84E55' : '#0B74E5';
  return (
    <div className="w-[85vw] max-w-[280px] bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden p-5 animate-in zoom-in-95 duration-500">
       <div className="flex justify-between mb-4">
          <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded" style={{ backgroundColor: `${color}10`, color }}>{proposal.provider}</span>
          <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">{proposal.voterIds.length}/{trip.joinedCount} AGREED</span>
       </div>
       <h4 className="text-[10px] font-black text-gray-900 uppercase leading-tight mb-1">{proposal.title}</h4>
       <p className="text-[9px] font-black leading-none mb-4" style={{ color }}>₹{proposal.pricePerPerson.toLocaleString()}</p>
       <div className="flex gap-2">
          <button onClick={onAgree} className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${hasAgreed ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>{hasAgreed ? 'Agreed' : 'Agree'}</button>
          {!hasAgreed && <button onClick={onDisagree} className="flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest bg-white border border-gray-100 text-gray-400">Disagree</button>}
       </div>
    </div>
  );
};

const PluginProposalCard: React.FC<{proposal: Proposal, isLocked: boolean, isInitiator: boolean, currentUserId: string, onVote: (v: 'YES' | 'NO') => void, onLock: () => void, color: string}> = ({ proposal, isLocked, isInitiator, currentUserId, onVote, onLock, color }) => {
  const hasAgreed = proposal.voterIds.includes(currentUserId);
  return (
    <M3Card variant="outlined" className={`p-5 border-l-4 transition-all ${isLocked ? 'opacity-40 grayscale' : 'shadow-md'}`} style={{ borderLeftColor: color }}>
       <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Proposed by {proposal.userName}</p>
            <h4 className="text-xs font-black text-gray-900 uppercase italic mt-1">{proposal.title}</h4>
          </div>
          <div className="text-right"><p className="text-xs font-black" style={{ color }}>₹{proposal.pricePerPerson.toLocaleString()}</p></div>
       </div>
       {!isLocked ? (
          <div className="flex justify-between items-center gap-2">
             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{proposal.voterIds.length} AGREED</span>
             <div className="flex gap-2">
                <button onClick={() => onVote('YES')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest ${hasAgreed ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-400'}`}>{hasAgreed ? 'Agreed' : 'Agree'}</button>
                {isInitiator && <button onClick={onLock} className="px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest bg-green-50 text-green-600 border border-green-200">Lock {proposal.type}</button>}
             </div>
          </div>
       ) : <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Selection Finalized ✅</span>}
    </M3Card>
  );
};

export default TripRoom;
