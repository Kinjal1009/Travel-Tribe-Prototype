
import React from 'react';
import { Trip, TripBookingState, HotelOption, User, BookingLock, TripMembership, PaymentStatus, BookingLifecycleStatus } from '../types';

interface HotelBookingPanelProps {
  trip: Trip;
  user: User;
  bookingState: TripBookingState;
  bookingLock: BookingLock;
  options: HotelOption[];
  onPropose: (optId: string) => void;
  onVote: (vote: "YES" | "NO") => void;
  onPay: () => void;
  isInitiator: boolean;
  membership?: TripMembership;
}

const HotelBookingPanel: React.FC<HotelBookingPanelProps> = ({ 
  trip, user, bookingState, bookingLock, options, onPropose, onVote, onPay, isInitiator, membership 
}) => {
  const hotelState = bookingState.hotel;
  const lifecycle = bookingState.lifecycleStatus;
  const isLocked = lifecycle !== BookingLifecycleStatus.PLANNING;
  const isPaid = membership?.paymentStatusHotel === PaymentStatus.PAID;
  const isBooked = lifecycle === BookingLifecycleStatus.CONFIRMED;

  const proposedOpt = options.find(o => o.id === (isLocked ? hotelState.lockedOptionId : hotelState.proposedOptionId));

  const yesVotes = Object.values(hotelState.votes).filter(v => v === "YES").length;
  const totalApprovals = trip.coTravelers.length || 1;

  if (isBooked) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="bg-green-50 border border-green-100 rounded-[2rem] p-8 relative">
           <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">ROOM RESERVED</span>
              <span className="bg-green-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase">PAID</span>
           </div>
           {proposedOpt && (
              <>
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h4 className="text-xl font-black text-[#0F172A] uppercase leading-tight">{proposedOpt.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{proposedOpt.area} • 4 Nights</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] text-gray-400 font-black uppercase">Booking ID</p>
                        <p className="text-sm font-black text-[#0A3D91] tracking-widest">{hotelState.bookingId || 'MMT-7890'}</p>
                    </div>
                </div>
                <div className="pt-4 border-t border-dashed border-green-200">
                    <p className="text-[8px] text-green-700 font-black uppercase tracking-tighter">Premium AC Suite (Confirmed)</p>
                </div>
              </>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {isLocked ? (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-8 relative">
            <div className="flex justify-between items-center mb-6">
               <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">LOCKED PLAN</span>
               <span className="bg-amber-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase">Awaiting Payment</span>
            </div>
            {proposedOpt && (
              <>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-black text-[#0F172A] uppercase">{proposedOpt.name}</span>
                  <span className="text-sm font-black text-[#0A3D91]">₹{proposedOpt.totalPrice}</span>
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-4">{proposedOpt.area} • {proposedOpt.rating}★ RATING</p>
              </>
            )}
          </div>

          {isPaid ? (
            <div className="w-full bg-green-50 text-green-600 py-6 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest border border-green-100">
              HOTEL PAYMENT VERIFIED
            </div>
          ) : (
            <button 
              onClick={onPay}
              className="w-full bg-[#0A3D91] text-white py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-[#2563EB] transition-all active:scale-95"
            >
              PAY HOTEL (MOCK) - ₹{proposedOpt?.totalPrice}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {hotelState.proposedOptionId ? (
            <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-8">
              <div className="flex justify-between mb-6">
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Active Proposal</div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{yesVotes}/{totalApprovals} AGREED</div>
              </div>
              
              {proposedOpt && (
                 <div className="bg-white rounded-2xl p-6 mb-6 border border-blue-100 shadow-sm">
                    <div className="flex justify-between mb-1">
                       <span className="text-xs font-black text-[#0F172A] uppercase">{proposedOpt.name}</span>
                       <span className="text-xs font-black text-[#0A3D91]">₹{proposedOpt.totalPrice}</span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{proposedOpt.area} • 4 Nights</p>
                 </div>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={() => onVote("YES")}
                  className={`flex-1 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${hotelState.votes[user.id] === "YES" ? 'bg-[#0A3D91] text-white shadow-md' : 'bg-white text-gray-400 border border-blue-100 hover:bg-blue-100'}`}
                >
                  Agree
                </button>
                <button 
                  onClick={() => onVote("NO")}
                  className={`flex-1 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${hotelState.votes[user.id] === "NO" ? 'bg-red-600 text-white shadow-md' : 'bg-white text-gray-400 border border-blue-100 hover:bg-blue-100'}`}
                >
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {options.map(opt => (
                <div key={opt.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-200 transition-all group shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-xs font-black text-[#0F172A] uppercase">{opt.name}</div>
                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1">{opt.area} • {opt.rating}★</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-[#0A3D91]">₹{opt.pricePerNight}</div>
                      {/* Hide PROPOSE if lifecycle is not open */}
                      {!isLocked && (
                        <button 
                          onClick={() => onPropose(opt.id)}
                          className="mt-2 bg-blue-50 text-[#0A3D91] px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#0A3D91] hover:text-white transition-all shadow-sm active:scale-95"
                        >
                          Propose
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HotelBookingPanel;
