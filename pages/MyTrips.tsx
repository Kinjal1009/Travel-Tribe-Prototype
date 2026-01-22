
import React, { useMemo, useState } from 'react';
import { Trip, User, BookingLifecycleStatus, ParticipationState } from '../types';
import { M3Card, M3Button } from '../components/ui/M3Components';
import { formatDateDDMMYYYY, parseTripDate, formatDateRangeDDMMYYYY } from '../lib/dateUtils';
import { computeVibeMatch } from '../lib/vibeEngine';
import ActiveTripCard from '../components/ActiveTripCard';

interface MyTripsProps {
  user: User | null;
  activeTrips: Trip[];
  approvedTrips: Trip[];
  pendingTrips: Trip[];
  initiatedTrips: Trip[];
  onSelectTrip: (trip: Trip) => void;
  onExplore: () => void;
  onInitiate: () => void;
  onSOS: (trip: Trip) => void;
  onRateTrip?: (trip: Trip) => void;
}

type TripTab = 'Active Trips' | 'Upcoming Trips' | 'Past Trips' | 'All Trips';

const MyTrips: React.FC<MyTripsProps> = ({ 
  user, activeTrips, approvedTrips, pendingTrips, initiatedTrips, onSelectTrip, onExplore, onInitiate, onSOS, onRateTrip
}) => {
  const sortByDate = (a: Trip, b: Trip) => {
    const da = parseTripDate(a.startDate)?.getTime() || 0;
    const db = parseTripDate(b.startDate)?.getTime() || 0;
    return da - db;
  };

  const getTripSpecificStatus = (trip: Trip): string => {
    const isOwner = trip.ownerId === user?.id;
    const booking = trip.bookingStateObj;

    if (trip.status === 'COMPLETED') return 'COMPLETED';

    if (isOwner) {
      if (trip.bookingState === BookingLifecycleStatus.CONFIRMED) return 'OWNER_CONFIRMED';
      return 'OWNER_PLANNING';
    }

    const needsPay = booking?.bus.lockedProposalId && booking?.hotel.lockedProposalId && !trip.participants.find(p => p.userId === user?.id)?.paid;
    if (needsPay) return 'APPROVED_ACTION_PENDING';
    
    const isApproved = trip.userParticipation === ParticipationState.APPROVED_UNPAID || trip.userParticipation === ParticipationState.APPROVED_PAID;
    if (isApproved && !needsPay && (trip.bookingState as any) !== BookingLifecycleStatus.CONFIRMED) return 'APPROVED_ENTER_CHAT';
    
    if ((trip.bookingState as any) === BookingLifecycleStatus.CONFIRMED) return 'CONFIRMED';
    
    return 'AWAITING_APPROVAL';
  };

  // Grouping logic based on new tab definitions
  const groupedData = useMemo(() => {
    const all = [...initiatedTrips, ...activeTrips, ...approvedTrips, ...pendingTrips].reduce((acc: Trip[], current) => {
      if (!acc.find(t => t.id === current.id)) acc.push(current);
      return acc;
    }, []).sort(sortByDate);

    const activeList = all.filter(t => {
      const isApproved = t.userParticipation === ParticipationState.APPROVED_PAID || t.userParticipation === ParticipationState.APPROVED_UNPAID || t.ownerId === user?.id;
      const statusMatch = (['CONFIRMED', 'ACTIVE', 'LIVE', 'IN_PROGRESS', 'ONGOING', 'PLANNING'] as string[]).includes(t.status) || (t.bookingState && ['PLANNING', 'CONFIRMED'].includes(t.bookingState));
      return isApproved && statusMatch && t.status !== 'COMPLETED';
    });

    const upcomingList = all.filter(t => {
      const statusMatch = (['OPEN', 'PENDING', 'APPROVED', 'FULL', 'CREATED', 'DRAFT', 'AWAITING_APPROVAL', 'AWAITING_PROPOSAL', 'PROPOSAL_GIVEN', 'PAYMENT_PENDING'] as string[]).includes(t.status) || (t.userParticipation === ParticipationState.REQUESTED);
      const isNotStarted = parseTripDate(t.startDate) ? (parseTripDate(t.startDate)!.getTime() > new Date().getTime()) : true;
      return statusMatch && isNotStarted && t.status !== 'COMPLETED' && !activeList.find(at => at.id === t.id);
    });

    const pastList = all.filter(t => (['COMPLETED', 'TRIP_OVER', 'WAITING_FOR_RATINGS'] as string[]).includes(t.status));

    return { 
      activeList, 
      upcomingList, 
      pastList, 
      all,
      counts: {
        'Active Trips': activeList.length,
        'Upcoming Trips': upcomingList.length,
        'Past Trips': pastList.length,
        'All Trips': all.length
      }
    };
  }, [initiatedTrips, activeTrips, approvedTrips, pendingTrips, user]);

  // Default Tab Logic
  const initialTab: TripTab = useMemo(() => {
    if (groupedData.activeList.length > 0) return 'Active Trips';
    if (groupedData.upcomingList.length > 0) return 'Upcoming Trips';
    return 'All Trips';
  }, [groupedData.activeList.length, groupedData.upcomingList.length]);

  const [activeTab, setActiveTab] = useState<TripTab>(initialTab);

  const tabs: TripTab[] = ['Active Trips', 'Upcoming Trips', 'Past Trips', 'All Trips'];

  const renderList = (trips: Trip[]) => {
    if (trips.length === 0) {
      return <p className="text-center py-20 text-gray-400 font-bold uppercase text-[10px] tracking-widest">No trips here yet.</p>;
    }

    return (
      <div className="space-y-8">
        {trips.map(t => {
          if (t.status === 'ACTIVE' || (t.status === 'COMPLETED' && !t.ratingsSubmitted)) {
            if (t.status === 'COMPLETED') {
              return (
                <M3Card key={t.id} variant="elevated" className="p-8 bg-blue-50 border-2 border-blue-100 shadow-xl group">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                           <span className="text-amber-600 text-[10px] font-black uppercase tracking-widest bg-white px-2 py-1 rounded border border-amber-100">🟡 Trip Completed — Ratings Pending</span>
                        </div>
                        <h4 className="text-2xl font-black text-[#0A3D91] tracking-tighter uppercase italic">{t.title}</h4>
                        <p className="text-xs text-gray-500 font-medium">Help improve future trips by sharing your experience.</p>
                      </div>
                      <M3Button variant="filled" className="!h-16 !px-10 shadow-lg shadow-blue-900/20" onClick={() => onRateTrip?.(t)}>
                        Rate This Trip
                      </M3Button>
                   </div>
                </M3Card>
              );
            }
            return (
              <ActiveTripCard 
                key={t.id} 
                trip={t} 
                onSOS={() => onSOS(t)} 
                onDropOut={() => {}} 
                onClick={() => onSelectTrip(t)} 
              />
            );
          }

          if (t.status === 'COMPLETED' && t.ratingsSubmitted) {
            return (
              <M3Card key={t.id} className="p-6 border border-gray-100 bg-white opacity-70">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Completed</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">{formatDateRangeDDMMYYYY(t.startDate, t.endDate)}</span>
                      </div>
                      <h4 className="text-xl font-black text-[#0F172A] tracking-tighter uppercase italic truncate leading-none">{t.title}</h4>
                  </div>
                  <span className="text-[9px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1.5 rounded-full border border-green-100">Feedback Submitted ✅</span>
                </div>
              </M3Card>
            );
          }

          return (
            <TimelineItem 
              key={t.id} 
              trip={t} 
              statusKey={getTripSpecificStatus(t)} 
              onClick={() => onSelectTrip(t)} 
              userVibe={user?.vibeProfile || null}
            />
          );
        })}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Active Trips': return renderList(groupedData.activeList);
      case 'Upcoming Trips': return renderList(groupedData.upcomingList);
      case 'Past Trips': return renderList(groupedData.pastList);
      case 'All Trips': return renderList(groupedData.all);
      default: return null;
    }
  };

  return (
    <div className="pt-20 pb-32 w-full page-transition">
      <div className="px-4 max-w-4xl mx-auto space-y-8">
        <div className="mb-2">
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic">My Trips</h1>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1">Your expedition timeline</p>
        </div>

        {/* Tab Bar */}
        <div className="sticky top-16 z-30 bg-[#F8FAFF] py-2 -mx-4 px-4 overflow-hidden border-b border-gray-100">
           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 snap-x">
             {tabs.map(tab => {
               const isActive = activeTab === tab;
               const count = groupedData.counts[tab];
               return (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`shrink-0 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all snap-start ${
                     isActive 
                       ? 'bg-[#0A3D91] text-white shadow-lg' 
                       : 'bg-white text-gray-400 border border-gray-100 hover:border-blue-100'
                   }`}
                 >
                   {tab} ({count})
                 </button>
               );
             })}
           </div>
        </div>

        {/* Tab Content */}
        <div className="pt-4 min-h-[50vh]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

const TimelineItem: React.FC<{trip: Trip, statusKey: string, onClick: () => void, userVibe: any}> = ({ trip, statusKey, onClick, userVibe }) => {
  const tripImage = (trip as any).manualImage || `https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&q=80&w=400`;
  
  const labels: Record<string, {text: string, color: string, sub: string}> = {
    APPROVED_ENTER_CHAT: { text: 'Approved — Enter Chat', color: 'text-blue-600', sub: 'Discussion open' },
    OWNER_PLANNING: { text: 'Created by you — Awaiting proposals', color: 'text-[#0A3D91]', sub: 'Host mode' },
    OWNER_CONFIRMED: { text: 'Created by you — Confirmed (Paid)', color: 'text-green-600', sub: 'Ready for departure' },
    APPROVED_ACTION_PENDING: { text: 'Approved — Agree & Pay pending', color: 'text-amber-600', sub: 'Action required' },
    CONFIRMED: { text: 'Confirmed (Paid)', color: 'text-green-600', sub: 'Pack your bags' },
    AWAITING_APPROVAL: { text: 'Awaiting Approval', color: 'text-gray-400', sub: 'Host reviewing' },
    COMPLETED: { text: 'Expedition Completed', color: 'text-gray-500', sub: 'Archive' }
  };

  const label = labels[statusKey] || { text: 'Status Unknown', color: 'text-gray-400', sub: '' };
  const vibeScore = userVibe ? computeVibeMatch(userVibe, trip.coTravelers) : 0;
  const groupTrust = trip.groupTrustScore || 5.0;

  return (
    <M3Card onClick={onClick} className="p-6 flex flex-col md:flex-row gap-6 border border-gray-100 group hover:border-[#0A3D91]/20 transition-all">
      <div className="relative w-full md:w-32 h-32 md:h-32 shrink-0 rounded-[2rem] overflow-hidden border border-gray-50 shadow-inner">
        <img src={tripImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={trip.title} />
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
           <span className="text-[8px] font-black text-[#0A3D91]">{vibeScore}% Vibe</span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${label.color}`}>{label.text}</span>
        </div>
        
        <h4 className="text-xl font-black tracking-tight text-[#0F172A] line-clamp-1 leading-tight group-hover:text-[#0A3D91] transition-colors uppercase italic">{trip.title}</h4>
        
        <div className="flex items-center gap-3 mt-3">
           <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
              <img src={trip.creator.avatarUrl || trip.creator.companyLogoUrl} className="w-4 h-4 rounded-full" alt="" />
              <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{trip.creator.name}</span>
           </div>
           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            {formatDateDDMMYYYY(trip.startDate)}
           </span>
        </div>
      </div>

      <div className="flex flex-col justify-center items-end gap-2 pr-2">
        <div className="flex items-center gap-1.5 text-green-600">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
           <span className="text-[10px] font-black tracking-widest">{groupTrust}/10 Safety</span>
        </div>
        <div className="bg-blue-50 p-2 rounded-full text-[#0A3D91] group-hover:translate-x-1 transition-transform">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
        </div>
      </div>
    </M3Card>
  );
};

export default MyTrips;
