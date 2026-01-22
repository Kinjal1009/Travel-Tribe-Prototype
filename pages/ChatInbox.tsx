
import React from 'react';
import { Trip, User, ParticipationState } from '../types';
import { M3Card } from '../components/ui/M3Components';
import { db } from '../lib/mockDb';

interface ChatInboxProps {
  user: User;
  allTrips: Trip[];
  onSelectTrip: (trip: Trip) => void;
  onShowMessage: (msg: string) => void;
}

const ChatInbox: React.FC<ChatInboxProps> = ({ user, allTrips, onSelectTrip, onShowMessage }) => {
  // Include trips where user is Owner, Approved, or has Requested to join
  const tripsWithChat = allTrips.filter(trip => {
    if (trip.ownerId === user.id) return true;
    const participation = trip.userParticipation;
    return (
      participation === ParticipationState.APPROVED_PAID || 
      participation === ParticipationState.APPROVED_UNPAID ||
      participation === ParticipationState.REQUESTED
    );
  });

  const getStatusLabel = (trip: Trip) => {
    if (trip.ownerId === user.id) return { label: 'Initiator', color: 'text-[#0A3D91]' };
    const participation = trip.userParticipation;
    switch (participation) {
      case ParticipationState.APPROVED_PAID:
        return { label: 'Confirmed', color: 'text-green-600' };
      case ParticipationState.APPROVED_UNPAID:
        return { label: 'Approved', color: 'text-blue-500' };
      case ParticipationState.REQUESTED:
        return { label: 'Awaiting Approval', color: 'text-amber-600' };
      default: 
        return { label: 'Member', color: 'text-gray-400' };
    }
  };

  const handleTripTap = (trip: Trip) => {
    const isOwner = trip.ownerId === user.id;
    const participation = trip.userParticipation;
    const isApproved = participation === ParticipationState.APPROVED_PAID || participation === ParticipationState.APPROVED_UNPAID;

    if (isOwner || isApproved) {
      onSelectTrip(trip);
    } else if (participation === ParticipationState.REQUESTED) {
      onShowMessage("Chat will unlock once you're approved for this trip. Current status: Awaiting approval.");
    } else {
      onShowMessage("You’re not part of this trip yet.");
    }
  };

  return (
    <div className="pt-24 pb-32 px-4 max-w-2xl mx-auto w-full page-transition">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic">Chat Inbox</h1>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1">Direct lines to your approved tribes</p>
      </div>

      <div className="space-y-4">
        {tripsWithChat.length > 0 ? (
          tripsWithChat.map(trip => {
            const status = getStatusLabel(trip);
            const isBlocked = trip.ownerId !== user.id && trip.userParticipation === ParticipationState.REQUESTED;
            const tripImage = (trip as any).manualImage || `https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&q=80&w=400`;
            const unreadCount = db.getUnreadCount(trip.id);
            const hasUnread = unreadCount > 0;
            
            return (
              <M3Card 
                key={trip.id} 
                onClick={() => handleTripTap(trip)}
                className={`p-5 flex gap-5 border transition-all group relative overflow-hidden ${
                    hasUnread 
                      ? 'border-[#0A3D91]/20 bg-blue-50/10 shadow-lg' 
                      : 'border-gray-100 bg-white hover:border-blue-200 shadow-sm'
                  } ${isBlocked ? 'opacity-70' : ''}`}
              >
                {/* Subtle Unread Left Accent */}
                {hasUnread && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0A3D91]" />
                )}

                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-gray-100 relative">
                  <img src={tripImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={trip.title} />
                  {isBlocked && (
                    <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${status.color}`}>
                      {status.label}
                    </span>
                    <div className="flex items-center gap-2">
                        {!isBlocked && <span className={`text-[8px] font-bold ${hasUnread ? 'text-[#0A3D91]' : 'text-gray-300'}`}>Active now</span>}
                        {hasUnread && (
                          <div className="bg-[#0A3D91] text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </div>
                        )}
                    </div>
                  </div>
                  <h4 className={`text-sm tracking-tight truncate group-hover:text-[#0A3D91] transition-colors ${
                      hasUnread ? 'font-black text-black' : 'font-bold text-[#0F172A]'
                    } ${isBlocked ? 'text-gray-400' : ''}`}>
                    {trip.title}
                  </h4>
                  <p className={`text-[10px] truncate mt-0.5 ${
                      hasUnread ? 'text-[#0A3D91] font-bold' : 'text-gray-400 font-medium'
                    }`}>
                    {isBlocked ? 'Unlock chat after approval...' : (hasUnread ? `New messages from your tribe...` : 'Tap to discuss with your tribe...')}
                  </p>
                </div>
              </M3Card>
            );
          })
        ) : (
          <div className="text-center py-32 space-y-4 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No active chat threads</p>
             <p className="text-[11px] text-gray-400 font-medium max-w-xs mx-auto">Get approved for an expedition to unlock private discussions with your tribe.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInbox;
