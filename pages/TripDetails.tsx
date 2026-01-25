import React, { useState, useMemo, useEffect } from 'react';
import { Trip, User, Currency, VibeProfile, KycStatus, ParticipationState, SocialProfiles, CoTraveler, TripRating } from '../types';
import { M3Button, M3Card } from '../components/ui/M3Components';
import { getDisplayPrice } from '../lib/currency';
import { computeVibeMatch } from '../lib/vibeEngine';
import { formatDateRangeDDMMYYYY, parseTripDate, calculateDuration } from '../lib/dateUtils';
import { TripImage } from '../components/TripImage';
import TripCreatorBadge from '../components/TripCreatorBadge';
import OptInModal from '../components/OptInModal';
import RatingModal from '../components/RatingModal';
import { db } from '../lib/mockDb';
import PaymentModal from '../components/PaymentModal';

interface TripDetailsProps {
  trip: Trip;
  allTrips: Trip[];
  currentUser: User | null;
  onJoin: (socials: SocialProfiles, hasVideo: boolean) => void;
  onKycCta: () => void;
  currency: Currency;
  userVibe: VibeProfile | null;
  onVibeStart: () => void;
  onBack: () => void;
  onSelectTripRoom: () => void;
}

const StatTile = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex flex-col justify-center gap-0.5">
    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</span>
    <span className="text-[11px] font-black text-[#0A3D91] uppercase tracking-tight truncate">{value}</span>
  </div>
);

const TripDetails: React.FC<TripDetailsProps> = ({ 
  trip, currentUser, onJoin, onKycCta, currency, userVibe, onBack, onSelectTripRoom, onVibeStart
}) => {
  const [showOptIn, setShowOptIn] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [selectedTravelerForRating, setSelectedTravelerForRating] = useState<CoTraveler | null>(null);
  const [myRatingsForTrip, setMyRatingsForTrip] = useState<TripRating[]>([]);
  
  const vibeMatch = useMemo(() => userVibe ? computeVibeMatch(userVibe, trip.coTravelers) : null, [userVibe, trip.coTravelers]);
  const groupTrustScore = trip.groupTrustScore || 5.0;

  useEffect(() => {
    if (currentUser) {
      setMyRatingsForTrip(db.getTripRatingsByRater(trip.id, currentUser.id));
    }
  }, [trip.id, currentUser]);

  const isTripOver = useMemo(() => {
    const endDate = parseTripDate(trip.endDate);
    if (!endDate) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now > endDate;
  }, [trip.endDate]);

  const isKycVerified = currentUser?.kycStatus === KycStatus.VERIFIED;
  const isRestrictedByGender = trip.womenOnly && currentUser?.gender === 'Male';
  const participation = trip.userParticipation || ParticipationState.NOT_JOINED;
  const isApproved = participation === ParticipationState.APPROVED_PAID || participation === ParticipationState.APPROVED_UNPAID || trip.ownerId === currentUser?.id;
  const isPaid = participation === ParticipationState.APPROVED_PAID;
  const isPending = participation === ParticipationState.REQUESTED;
  const isFull = trip.joinedCount >= trip.maxTravelers;

  // Requirement: Single derived boolean used for payments
  const booking = trip.bookingStateObj;
  const busLocked = !!booking?.bus?.lockedProposalId;
  const hotelLocked = !!booking?.hotel?.lockedProposalId;
  const paymentsEligible = busLocked && hotelLocked && isApproved && !isPaid;

  // Requirement: Amount calculation from locked proposals
  const totalPayable = useMemo(() => {
    if (!booking) return 0;
    const busProp = booking.bus.proposals.find(p => p.id === booking.bus.lockedProposalId);
    const hotelProp = booking.hotel.proposals.find(p => p.id === booking.hotel.lockedProposalId);
    return (busProp?.pricePerPerson || 0) + (hotelProp?.pricePerPerson || 0);
  }, [booking]);

  const displayMembers = useMemo(() => {
    const list = [...(trip.coTravelers || [])];
    const countToShow = Math.max(trip.joinedCount, list.length, 1);
    const result: CoTraveler[] = [];

    for (let i = 0; i < countToShow; i++) {
      if (list[i]) {
        result.push(list[i]);
      } else {
        const isOrgPlaceholder = i === 0 && !list.some(m => m.isOrganizer);
        result.push({
          id: `placeholder-${i}`,
          name: isOrgPlaceholder ? trip.creator.name : 'Tribe Member',
          avatar: isOrgPlaceholder ? (trip.creator.avatarUrl || trip.creator.companyLogoUrl || '') : '',
          isOrganizer: isOrgPlaceholder,
          trustScore: isOrgPlaceholder ? 88 : 60,
          trustTier: 'Medium',
          vibeProfile: {} as any,
          trustSignals: {} as any
        });
      }
    }
    return result;
  }, [trip.coTravelers, trip.joinedCount, trip.creator]);

  const otherTravelersToRate = useMemo(() => {
    if (!isApproved || !currentUser) return [];
    return trip.coTravelers.filter(ct => ct.id !== currentUser.id);
  }, [trip.coTravelers, isApproved, currentUser]);

  const handleCtaClick = () => {
    if (isRestrictedByGender || isFull) return;
    if (!currentUser) {
      onJoin({} as SocialProfiles, false); 
      return;
    }
    if (isApproved) {
        onSelectTripRoom();
        return;
    }
    if (isPending) return;
    if (!isKycVerified) {
        onKycCta();
        return;
    }
    setShowOptIn(true);
  };

  const handleRatingSubmit = (ratingData: any) => {
    if (!currentUser || !selectedTravelerForRating) return;
    db.saveTripRating({
      tripId: trip.id,
      raterUserId: currentUser.id,
      ratedUserId: selectedTravelerForRating.id,
      ...ratingData
    });
    setMyRatingsForTrip(db.getTripRatingsByRater(trip.id, currentUser.id));
  };

  const getCtaText = () => {
    if (isRestrictedByGender) return 'Not Eligible (Women Only)';
    if (!currentUser) return 'Sign In to Join';
    if (isApproved) return 'Enter Tribe Hub';
    if (isPending) return 'Request Pending';
    if (!isKycVerified) return 'Verify Identity to Join';
    if (isFull) return 'Expedition Full';
    return 'Opt-in to Tribe';
  };

  const { label, formatted } = getDisplayPrice(trip, currency);
  const duration = calculateDuration(trip.startDate, trip.endDate);

  return (
    <div className="pb-40 bg-[#F8FAFF] min-h-screen w-full page-transition">
      <div className="relative h-[45vh] md:h-[55vh] overflow-hidden">
        <TripImage trip={trip} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <button onClick={onBack} className="absolute top-8 left-8 w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white z-50 hover:bg-white/20 transition-all">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="absolute bottom-12 left-8 right-8 max-w-7xl mx-auto">
           <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">{trip.tripType} Expedition</span>
              {trip.womenOnly && <span className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">WOMEN ONLY</span>}
           </div>
           <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-none mb-4 uppercase italic">{trip.title}</h1>
           <p className="text-blue-100 font-black uppercase tracking-[0.2em] text-[11px]">{trip.location} • {formatDateRangeDDMMYYYY(trip.startDate, trip.endDate)}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-12 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {isTripOver && isApproved && otherTravelersToRate.length > 0 && (
            <M3Card variant="elevated" className="p-8 md:p-12 space-y-8 bg-[#0A3D91] text-white">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Post-Expedition Hub</h3>
                  <h2 className="text-3xl font-black mt-2 tracking-tighter italic uppercase">Rate your co-travelers</h2>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Progress</p>
                  <p className="text-xl font-black italic">{myRatingsForTrip.length} / {otherTravelersToRate.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherTravelersToRate.map(ct => {
                  const existingRating = myRatingsForTrip.find(r => r.ratedUserId === ct.id);
                  return (
                    <div key={ct.id} className="flex items-center justify-between p-5 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 group hover:bg-white/20 transition-all">
                      <div className="flex items-center gap-4">
                        <img src={ct.avatar} className="w-12 h-12 rounded-2xl border border-white/20" alt="" />
                        <span className="text-sm font-black uppercase tracking-tight">{ct.name.split(' ')[0]}</span>
                      </div>
                      <button 
                        onClick={() => setSelectedTravelerForRating(ct)}
                        className={`h-10 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          existingRating ? 'bg-white text-[#0A3D91]' : 'bg-[#0A3D91] text-white border border-white/20 shadow-xl'
                        }`}
                      >
                        {existingRating ? 'Edit Rating' : 'Rate'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </M3Card>
          )}

          <M3Card className="p-8 md:p-12 space-y-10 bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-100">
               <TripCreatorBadge creator={trip.creator} organizerId={trip.organizerId} />
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 max-w-xl">
                  <StatTile label="Origin" value={trip.startPoint} />
                  <StatTile label="Duration" value={duration ? `${duration} Days` : 'Undefined Days'} />
                  <StatTile label="Tribe" value={`${trip.joinedCount}/${trip.maxTravelers}`} />
                  <StatTile label="Status" value={isTripOver ? 'COMPLETED' : (trip.status === 'ACTIVE' ? 'LIVE' : (trip.bookingState || 'PLANNING'))} />
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Confirmed Tribe Members</h3>
               <div className="flex flex-wrap gap-8">
                  {displayMembers.map((ct, i) => {
                    const showIdentity = isApproved || ct.isOrganizer;
                    return (
                      <div key={ct.id || i} className="flex flex-col items-center gap-2 group">
                         <div className="relative">
                            <img 
                              src={showIdentity ? ct.avatar : `https://api.dicebear.com/7.x/initials/svg?seed=T${i}`} 
                              className={`w-14 h-14 rounded-2xl transition-all ${!showIdentity ? 'grayscale blur-[3px] opacity-40' : ''}`} 
                              alt="" 
                            />
                         </div>
                         <div className="text-center flex flex-col items-center">
                            <span className="text-[9px] font-black uppercase text-gray-900 leading-none">
                              {showIdentity ? ct.name.split(' ')[0] : 'Member'}
                            </span>
                            {showIdentity && (
                              <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                {ct.isOrganizer ? 'Host' : 'Verified Member'}
                              </span>
                            )}
                         </div>
                      </div>
                    );
                  })}
               </div>
               {!isApproved && (
                  <p className="text-[9px] text-[#0A3D91] font-black uppercase tracking-widest bg-blue-50/50 p-6 rounded-[2rem] text-center italic border border-blue-50">
                    "Traveler names and profiles unlock after your opt-in is approved."
                  </p>
               )}
            </div>

            <div className="space-y-6">
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Expedition Blueprint</h3>
               <div className="space-y-12">
                  {trip.itinerary.map(day => (
                    <div key={day.day} className="flex gap-8 group">
                       <div className="w-12 h-12 bg-gray-50 text-[#0A3D91] border border-gray-100 rounded-2xl flex items-center justify-center font-black shrink-0 group-hover:bg-[#0A3D91] group-hover:text-white transition-all">{day.day}</div>
                       <div className="pt-1">
                          <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">{day.title}</h4>
                          <p className="text-xs text-gray-400 mt-2 leading-relaxed max-w-xl">{day.summary}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </M3Card>
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            <M3Card variant="outlined" className="p-8 space-y-8 shadow-2xl bg-white rounded-[3rem]">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-4xl font-black text-[#0A3D91] tracking-tighter">₹{trip.pricePerPersonInr.toLocaleString()}</p>
              </div>

              <div className="space-y-3">
                <div className="p-5 bg-blue-50/50 rounded-3xl flex items-center justify-between border border-blue-50" 
                  onClick={onVibeStart}
                  style={{ cursor: 'pointer' }}
                >
                   <div>
                     <p className="text-[9px] font-black text-[#0A3D91] uppercase tracking-widest">Tribe Affinity</p>
                     <p className="text-2xl font-black text-[#0A3D91]">{vibeMatch ?? '--'}% Match</p>
                   </div>
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#0A3D91] shadow-sm border border-blue-50">★</div>
                </div>
                <div className="p-5 bg-green-50/50 rounded-3xl flex items-center justify-between border border-green-50">
                   <div>
                     <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">Trust & Safety</p>
                     <p className="text-2xl font-black text-green-600">Group: {groupTrustScore}/10</p>
                   </div>
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-sm border border-green-50">
                     <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 4.91a2.5 2.5 0 012.5 2.5c0 .64-.24 1.22-.63 1.67l-.02.02.01.01c-.45.54-1.11.89-1.86.89-.75 0-1.41-.35-1.86-.89l.01-.01-.02-.02A2.483 2.483 0 019.5 9.41a2.5 2.5 0 012.5-2.5zm0 10.09c-2.07 0-3.89-1.07-4.94-2.69.03-1.63 3.29-2.52 4.94-2.52 1.64 0 4.91.89 4.94 2.52-1.05 1.62-2.87 2.69-4.94 2.69z"/></svg>
                   </div>
                </div>
              </div>

              {!isTripOver && (
                <div className="space-y-4">
                  <M3Button 
                    fullWidth 
                    className={`!h-20 !rounded-[2rem] ${isRestrictedByGender || isFull ? 'opacity-50 grayscale' : ''}`} 
                    onClick={handleCtaClick}
                    disabled={isRestrictedByGender || isFull}
                  >
                    {getCtaText()}
                  </M3Button>

                  {/* Requirement Location A: Pay Now Section */}
                  {currentUser && (
                    <div className="pt-2 flex flex-col items-center gap-2">
                       {isPaid ? (
                          <M3Button variant="tonal" fullWidth disabled className="!h-16 !rounded-2xl !bg-green-50 !text-green-600 shadow-none border-0">
                             PAID ✅
                          </M3Button>
                       ) : paymentsEligible ? (
                          <M3Button variant="filled" fullWidth className="!h-16 !rounded-2xl !bg-green-600 hover:!bg-green-700 shadow-xl shadow-green-900/20" onClick={() => setShowPay(true)}>
                             PAY NOW ₹{totalPayable.toLocaleString()}
                          </M3Button>
                       ) : isApproved ? (
                          <p className="text-[8px] font-black text-gray-400 uppercase text-center tracking-widest italic px-4">
                             Payment unlocks after bus + hotel are locked.
                          </p>
                       ) : participation === ParticipationState.REQUESTED ? (
                          <p className="text-[8px] font-black text-gray-400 uppercase text-center tracking-widest italic px-4">
                             Approval required before payment.
                          </p>
                       ) : null}
                       
                       {/* Mandatory Debug Label */}
                       <div className="text-[7px] font-mono text-gray-300 uppercase mt-1">
                         DEBUG: approved={isApproved ? 'T' : 'F'} busLocked={busLocked ? 'T' : 'F'} hotelLocked={hotelLocked ? 'T' : 'F'} hasPaid={isPaid ? 'T' : 'F'} total={totalPayable}
                       </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-center gap-2">
                 <div className={`w-1.5 h-1.5 rounded-full ${isTripOver ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`} />
                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                  {isTripOver ? 'Expedition Archive Protocol' : 'Safety Shield Protocol Active'}
                 </p>
              </div>
            </M3Card>
            
            <M3Card variant="filled" className="p-8 bg-gray-900 text-white rounded-[3rem]">
               <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-6">Host Commitment</h3>
               <div className="flex gap-4 items-start">
                  <img src={trip.creator.avatarUrl || trip.creator.companyLogoUrl} className="w-12 h-12 rounded-2xl border-2 border-white/20" alt="" />
                  <div>
                    <p className="text-sm font-black italic">"{trip.creator.name} ensures a premium, high-vibe experience for all verified travelers."</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest mt-4 opacity-40">Verified Host Protocol Active</p>
                  </div>
               </div>
            </M3Card>
          </div>
        </div>
      </div>

      <OptInModal isOpen={showOptIn} onClose={() => setShowOptIn(false)} onSubmit={(s, v) => { onJoin(s, v); setShowOptIn(false); }} />
      {selectedTravelerForRating && (
        <RatingModal 
          isOpen={!!selectedTravelerForRating} 
          onClose={() => setSelectedTravelerForRating(null)} 
          traveler={selectedTravelerForRating}
          initialRating={myRatingsForTrip.find(r => r.ratedUserId === selectedTravelerForRating.id)}
          onSubmit={handleRatingSubmit}
        />
      )}
      {showPay && (
        <PaymentModal 
          isOpen={showPay} 
          onClose={() => setShowPay(false)} 
          onConfirm={() => { db.markPaid(trip.id, currentUser!.id, totalPayable); setShowPay(false); }} 
          amount={totalPayable} 
          itemLabel="Locked Expedition Pack" 
        />
      )}
    </div>
  );
};

export default TripDetails;