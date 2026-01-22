
import React, { useState, useEffect, useMemo } from 'react';
import { Trip, User, Proposal, BookingLifecycleStatus, TripBookingState, BusOption, TrainOption, HotelOption, TravelMode } from '../types';
import ProposalModal from './ProposalModal';
import { M3Card } from './ui/M3Components';
import { getTravelOptions, getHotelOptions } from '../lib/mockBookingApis';

interface BookingsPaneProps {
  trip: Trip;
  user: User;
  onUpdateTrip: (updatedTrip: Trip) => void;
  onRemoveTraveler: (userId: string) => void;
  onNotifyChat: (text: string) => void;
}

const BookingsPane: React.FC<BookingsPaneProps> = ({ trip, user, onUpdateTrip, onNotifyChat }) => {
  const [activeSubTab, setActiveSubTab] = useState<'TRAVEL' | 'STAY'>('TRAVEL');
  const [showProposalModal, setShowProposalModal] = useState(false);

  const isInitiator = trip.ownerId === user.id;
  const bookingObj = trip.bookingStateObj!;

  // Load 10+ options for the current trip
  const travelOptions = useMemo(() => 
    getTravelOptions(trip.id, trip.fromCity || '', trip.toCity || '', trip.travelModes[0] || TravelMode.BUS), 
    [trip.id, trip.fromCity, trip.toCity, trip.travelModes]
  );
  
  const hotelOptions = useMemo(() => 
    getHotelOptions(trip.id, trip.location), 
    [trip.id, trip.location]
  );

  const updateBookingState = (updater: (prev: TripBookingState) => TripBookingState) => {
    const next = updater(bookingObj);
    onUpdateTrip({ ...trip, bookingStateObj: next });
  };

  const handleProposeFromList = (item: BusOption | TrainOption | HotelOption) => {
    const isTravel = activeSubTab === 'TRAVEL';
    const target = isTravel ? 'bus' : 'hotel';
    
    // Check if already proposed
    const existing = bookingObj[target].proposals.find(p => p.id === item.id);
    if (existing) return;

    const price = isTravel ? (item as BusOption).price : (item as HotelOption).totalPrice;
    const title = isTravel ? ((item as any).operator || (item as any).trainName) : (item as HotelOption).name;
    const provider = isTravel ? 'RedBus' : 'MakeMyTrip';
    const timeInfo = isTravel ? `(${(item as any).departTime}–${(item as any).arriveTime})` : '(3N)';

    const newProposal: Proposal = {
      id: item.id, // Link to original item ID to prevent dupes
      tripId: trip.id,
      userId: user.id,
      proposedByUserId: user.id,
      userName: user.name,
      userAvatar: user.avatarUrl,
      type: isTravel ? 'BUS' : 'HOTEL',
      voterIds: [user.id],
      title: title,
      provider: provider,
      pricePerPerson: price,
      departTime: (item as any).departTime,
      arriveTime: (item as any).arriveTime,
      notes: '',
      optionId: item.id,
      createdAt: new Date().toISOString(),
      messageText: `Proposed ${isTravel ? 'BUS' : 'HOTEL'}: ${title}`,
      votes: {}
    };

    updateBookingState(prev => ({
      ...prev,
      [target]: { ...prev[target], proposals: [...prev[target].proposals, newProposal] }
    }));

    const chatMsg = isTravel 
      ? `${user.name} proposed BUS: ${title} ${timeInfo} ₹${price}/person via ${provider}. Agree in Booking.`
      : `${user.name} proposed HOTEL: ${title} ${timeInfo} ₹${price}/person. Agree in Booking.`;
    
    onNotifyChat(chatMsg);
  };

  const toggleAgree = (proposalId: string) => {
    updateBookingState(prev => {
      const target = activeSubTab === 'TRAVEL' ? 'bus' : 'hotel';
      const updatedProposals = prev[target].proposals.map(p => {
        if (p.id === proposalId) {
          const hasAgreed = p.voterIds.includes(user.id);
          const newVoters = hasAgreed 
            ? p.voterIds.filter(id => id !== user.id)
            : [...p.voterIds, user.id];
          
          if (!hasAgreed) {
             setTimeout(() => onNotifyChat(`${user.name} agreed to ${p.userName}'s ${activeSubTab === 'TRAVEL' ? 'Bus' : 'Hotel'} proposal.`), 0);
          }

          return { ...p, voterIds: newVoters };
        }
        return p;
      });
      return { ...prev, [target]: { ...prev[target], proposals: updatedProposals } };
    });
  };

  const handleBlock = (proposalId: string) => {
    if (!isInitiator) return;
    const target = activeSubTab === 'TRAVEL' ? 'bus' : 'hotel';
    const proposal = bookingObj[target].proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    updateBookingState(prev => ({
      ...prev,
      [target]: { ...prev[target], lockedProposalId: proposalId }
    }));

    onNotifyChat(`Initiator blocked ${activeSubTab === 'TRAVEL' ? 'Bus' : 'Hotel'} option: ${proposal.title} ₹${proposal.pricePerPerson}. Selection locked.`);
  };

  const target = activeSubTab === 'TRAVEL' ? 'bus' : 'hotel';
  const lockedId = bookingObj[target].lockedProposalId;
  const activeProposals = bookingObj[target].proposals;
  const currentOptions = activeSubTab === 'TRAVEL' ? travelOptions : hotelOptions;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Mini Toggle */}
      <div className="px-6 py-4 flex gap-4 border-b border-gray-50 shrink-0">
        <button 
          onClick={() => setActiveSubTab('TRAVEL')}
          className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'TRAVEL' ? 'bg-[#0A3D91] text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}
        >
          Travel (Bus)
        </button>
        <button 
          onClick={() => setActiveSubTab('STAY')}
          className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'STAY' ? 'bg-[#0A3D91] text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}
        >
          Stay (Hotel)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-40 no-scrollbar">
        {/* PROPOSALS SECTION */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
              {lockedId ? 'Final Selection' : 'Tribe Decisions'}
            </h2>
            {activeProposals.length > 0 && !lockedId && (
               <span className="text-[8px] font-black text-[#0A3D91] bg-blue-50 px-2 py-1 rounded uppercase tracking-widest">{activeProposals.length} Proposals Live</span>
            )}
          </div>

          {lockedId && (
            <div className="mb-10 space-y-3">
               <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest">✅ Selection Locked</span>
               </div>
               <ProposalCard 
                 proposal={activeProposals.find(p => p.id === lockedId)!} 
                 isLocked 
                 isInitiator={isInitiator}
                 currentUserId={user.id}
                 onAgree={() => {}}
                 onBlock={() => {}}
               />
               <div className="h-px bg-gray-100 my-10" />
            </div>
          )}

          <div className="space-y-4">
            {activeProposals.filter(p => p.id !== lockedId).map(p => (
              <ProposalCard 
                key={p.id} 
                proposal={p} 
                isLocked={!!lockedId}
                isInitiator={isInitiator}
                currentUserId={user.id}
                onAgree={() => toggleAgree(p.id)}
                onBlock={() => handleBlock(p.id)}
              />
            ))}
          </div>
        </section>

        {/* OPTIONS LIST (SEARCH RESULTS) */}
        <section className="space-y-6 border-t border-gray-100 pt-10">
          <div className="flex flex-col">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
              {activeSubTab === 'TRAVEL' ? 'Bus Inventory' : 'Hotel Inventory'}
            </h2>
            <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-1">
              {lockedId ? 'Proposals closed' : `Search results for ${trip.location}`}
            </p>
          </div>

          <div className="space-y-3">
            {currentOptions.map((opt: any) => {
              const proposal = activeProposals.find(p => p.id === opt.id);
              const isProposedByMe = proposal?.userId === user.id;
              const isProposedByOthers = proposal && !isProposedByMe;
              const isDisabled = !!lockedId || isProposedByMe;

              return (
                <div key={opt.id} className={`flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[2rem] transition-all hover:shadow-md ${lockedId ? 'opacity-40 grayscale' : ''}`}>
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[12px] font-black text-[#0F172A] uppercase truncate">{opt.operator || opt.trainName || opt.name}</h4>
                      {opt.rating && <span className="text-[8px] font-black text-amber-500 bg-amber-50 px-1 py-0.5 rounded">★{opt.rating}</span>}
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                      {activeSubTab === 'TRAVEL' ? `${opt.departTime}–${opt.arriveTime} • ${opt.seatType}` : `${opt.area} • ${opt.pricePerNight}/night`}
                    </p>
                    {isProposedByOthers && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <img src={proposal.userAvatar} className="w-3 h-3 rounded-full" alt="" />
                        <span className="text-[7px] font-black text-[#0A3D91] uppercase tracking-widest italic">Proposed by {proposal.userName}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[12px] font-black text-[#0A3D91]">₹{(opt.price || opt.totalPrice).toLocaleString()}</span>
                    <button 
                      disabled={isDisabled || isProposedByOthers}
                      onClick={() => handleProposeFromList(opt)}
                      className={`h-9 px-4 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                        isProposedByMe 
                          ? 'bg-green-50 text-green-600 border border-green-200' 
                          : isProposedByOthers 
                          ? 'bg-gray-50 text-gray-400 border border-gray-100'
                          : 'bg-blue-50 text-[#0A3D91] hover:bg-[#0A3D91] hover:text-white active:scale-95'
                      } ${lockedId ? 'pointer-events-none' : ''}`}
                    >
                      {isProposedByMe ? 'PROPOSED ✅' : isProposedByOthers ? `PROPOSED (${proposal.userName})` : 'PROPOSE'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {lockedId && (
             <div className="py-10 text-center bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] italic">Selection locked by initiator</p>
             </div>
          )}
        </section>
      </div>
    </div>
  );
};

const ProposalCard: React.FC<{
  proposal: Proposal;
  isLocked: boolean;
  isInitiator: boolean;
  currentUserId: string;
  onAgree: () => void;
  onBlock: () => void;
}> = ({ proposal, isLocked, isInitiator, currentUserId, onAgree, onBlock }) => {
  const hasAgreed = proposal.voterIds.includes(currentUserId);

  return (
    <M3Card variant="outlined" className={`p-5 transition-all ${isLocked && !proposal.voterIds.includes(currentUserId) ? 'opacity-50 grayscale scale-[0.98]' : 'shadow-lg border-blue-100'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
           <img src={proposal.userAvatar} className="w-6 h-6 rounded-full border border-gray-100" alt="" />
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-900 uppercase tracking-tighter leading-none">{proposal.userName}</span>
              <span className="text-[7px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Proposed by</span>
           </div>
        </div>
        <div className="text-right">
           <p className="text-[13px] font-black text-[#0A3D91] leading-none">₹{proposal.pricePerPerson.toLocaleString()}</p>
           <p className="text-[7px] text-gray-400 font-bold uppercase mt-1">Per Person</p>
        </div>
      </div>

      <div className={`rounded-2xl p-4 mb-4 border transition-colors ${isLocked ? 'bg-green-50 border-green-100' : 'bg-blue-50/50 border-blue-50'}`}>
         <h4 className="text-[12px] font-black text-[#0F172A] uppercase leading-tight mb-1">{proposal.title}</h4>
         <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
            {proposal.provider} {proposal.departTime && `• ${proposal.departTime} → ${proposal.arriveTime}`}
         </p>
      </div>

      {!isLocked ? (
        <div className="flex items-center justify-between gap-4 pt-2">
           <div className="flex items-center -space-x-2">
              {proposal.voterIds.slice(0, 3).map(id => (
                <img key={id} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} className="w-5 h-5 rounded-full border-2 border-white bg-gray-200" alt="" />
              ))}
              <span className="ml-8 text-[8px] font-black text-[#0A3D91] uppercase tracking-widest">
                 {proposal.voterIds.length} AGREED
              </span>
           </div>
           
           <div className="flex gap-2">
              <button 
                onClick={onAgree}
                className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${hasAgreed ? 'bg-[#0A3D91] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                {hasAgreed ? 'Agreed' : 'Agree'}
              </button>
              {isInitiator && (
                <button 
                  onClick={onBlock}
                  className="px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                >
                  Block
                </button>
              )}
           </div>
        </div>
      ) : (
        <div className="flex justify-between items-center opacity-60">
           <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
              Route Finalized
           </span>
        </div>
      )}
    </M3Card>
  );
};

export default BookingsPane;
