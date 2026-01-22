
import React from 'react';
import { Trip, Currency, User } from '../types';
import { getDisplayPrice } from '../lib/currency';
import TripCreatorBadge from './TripCreatorBadge';
import { TripImage } from './TripImage';
import { calculateDuration } from '../lib/dateUtils';

interface TripCardProps {
  trip: Trip;
  user?: User | null;
  vibeScore?: number;
  onClick: () => void;
  currency: Currency;
}

const TripCard: React.FC<TripCardProps> = ({ trip, user, vibeScore, onClick, currency }) => {
  if (!trip) return null;
  
  const isFull = (trip.joinedCount || 0) >= (trip.maxTravelers || 0);
  const { label, formatted } = getDisplayPrice(trip, currency);
  
  const isWomenOnly = trip.accessPolicy === "WOMEN_ONLY";
  const isMaleUser = user?.gender === 'Male';
  const isRestricted = isWomenOnly && isMaleUser;

  // Compute route label: Only Trip From → Trip To
  const primaryDest = trip.routeStops?.[0] || trip.location;
  const extraStops = trip.routeStops?.length > 1 ? trip.routeStops.length - 1 : 0;
  const routeDisplay = `${trip.startPoint || ''} → ${primaryDest || ''}`;

  // Trust Score V1 display
  const groupTrust = trip.groupTrustScore || 5.0;

  // Derive duration
  const duration = calculateDuration(trip.startDate, trip.endDate);

  return (
    <div 
      onClick={onClick}
      className={`group flex flex-col h-full bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 overflow-hidden hover:shadow-2xl transition-all active:scale-[0.98] ${isFull ? 'opacity-90' : 'cursor-pointer shadow-sm'} ${isRestricted ? 'opacity-60 grayscale-[0.3] !cursor-not-allowed' : ''}`}
    >
      {/* Image Section */}
      <div className="relative h-32 md:h-48 overflow-hidden shrink-0">
        <TripImage trip={trip} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        {isFull && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-10">
            <span className="bg-red-600 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">TRIP FULL</span>
          </div>
        )}

        {isWomenOnly && (
          <div className="absolute top-2 left-2 flex flex-col items-start gap-0.5 z-10">
            <span className="bg-rose-600 text-white text-[7px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shadow-lg">
              WOMEN ONLY
            </span>
            {isRestricted && (
              <span className="bg-black/60 text-white text-[6px] font-bold uppercase tracking-tighter px-1 rounded">Eligibility Restricted</span>
            )}
          </div>
        )}
        
        {/* Requirement: Always show vibeMatchPercent badge if provided (0-100) */}
        {vibeScore !== undefined && (
          <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-white/95 backdrop-blur-sm px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-lg z-20">
             <span className="text-[8px] md:text-[10px] font-black text-[#0A3D91]">{vibeScore}% Vibe</span>
          </div>
        )}

        <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-10">
          <span className="bg-[#0A3D91] text-white text-[7px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
            {trip.travelModes?.[0] || 'BUS'}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 md:p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5 md:space-y-3">
          <div className="flex items-center justify-between">
            <TripCreatorBadge creator={trip.creator} organizerId={trip.organizerId} compact />
          </div>

          <h3 className="text-xs md:text-lg font-black text-[#0F172A] tracking-tight leading-tight line-clamp-1 group-hover:text-[#0A3D91] transition-colors">
            {trip.title}
          </h3>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 overflow-hidden">
               <span className="text-[8px] md:text-[10px] font-bold text-[#0A3D91] uppercase tracking-widest truncate">{routeDisplay}</span>
               {extraStops > 0 && (
                 <span className="bg-blue-50 text-[#0A3D91] text-[6px] md:text-[8px] font-black px-1 rounded whitespace-nowrap">+{extraStops} STOPS</span>
               )}
            </div>
            <div className="flex flex-wrap items-center gap-1 md:gap-2 opacity-60">
              <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{trip.location}</span>
              <span className="text-gray-200 text-[8px]">•</span>
              <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{duration ? `${duration}D` : 'UNDEFINED DAYS'}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 md:mt-6 pt-2 md:pt-4 border-t border-gray-100 flex flex-col gap-1">
          {/* Trust Score moved above price section */}
          <div className="flex items-center gap-1 mb-1">
             <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 9.293a1 1 0 01-1.414 1.414L9 10.586 7.707 9.293a1 1 0 01-1.414 1.414l2 2a1 1 0 01-1.414 0l4-4z" /></svg>
             <span className="text-[8px] font-black text-green-600 uppercase tracking-tighter italic">{groupTrust}/10 Safety Score</span>
          </div>
          
          <div className="flex items-center justify-between text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-300">
            <span>{label}</span>
            <span>{trip.joinedCount}/{trip.maxTravelers} joined</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs md:text-base font-black text-[#0A3D91] leading-tight">
              {formatted}
            </div>
            {isRestricted && (
               <span className="text-[7px] font-black text-rose-600 uppercase tracking-widest border border-rose-100 bg-rose-50 px-2 py-0.5 rounded">Not eligible</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripCard;
