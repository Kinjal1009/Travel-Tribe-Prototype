
import React from 'react';
import { Trip } from '../types';
import { LOCATION_IMAGE_MAP } from '../lib/mockData';
import { formatDateRangeDDMMYYYY } from '../lib/dateUtils';

interface ActiveTripCardProps {
  trip: Trip;
  onSOS: (trip: Trip) => void;
  onDropOut: (trip: Trip) => void;
  onClick: (trip: Trip) => void;
}

const ActiveTripCard: React.FC<ActiveTripCardProps> = ({ trip, onSOS, onDropOut, onClick }) => {
  const images = LOCATION_IMAGE_MAP[trip.location] || LOCATION_IMAGE_MAP['Generic'];
  const tripImage = (trip as any).manualImage || images[0];

  return (
    <div className="bg-white rounded-[3rem] overflow-hidden border border-[#0A3D91]/10 shadow-2xl group transition-all hover:border-[#0A3D91]/30">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 h-72 md:h-auto overflow-hidden relative cursor-pointer" onClick={() => onClick(trip)}>
          <img src={tripImage} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent md:hidden" />
          <div className="absolute top-6 left-6">
             <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg border border-red-400">Live Trip</span>
          </div>
        </div>
        
        <div className="flex-1 p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4 cursor-pointer" onClick={() => onClick(trip)}>
            <div className="flex items-center gap-3">
              <span className="text-[#0A3D91] text-[10px] font-black uppercase tracking-[0.2em]">{trip.tripType} • {trip.travelModes.join(' / ')}</span>
            </div>
            <h3 className="text-4xl font-black text-[#0F172A] group-hover:text-[#0A3D91] transition-colors tracking-tighter leading-none">{trip.title}</h3>
            
            {trip.womenOnly && (
              <p className="text-rose-600 text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A6,6 0 0,0 6,8C6,11.09 8.35,13.62 11,13.96V17H9V19H11V22H13V19H15V17H13V13.96C15.65,13.62 18,11.09 18,8A6,6 0 0,0 12,2M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4Z"/>
                </svg>
                WOMEN ONLY TRIP
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-gray-500 text-xs font-black uppercase tracking-widest">
              <span>{trip.location}</span>
              <span className="text-gray-200">•</span>
              <span>{formatDateRangeDDMMYYYY(trip.startDate, trip.endDate)}</span>
              <span className="text-gray-200">•</span>
              <span className="text-[#0A3D91] font-black">{trip.joinedCount}/{trip.maxTravelers} GUESTS</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-5 w-full md:w-auto">
            <button 
              onClick={(e) => { e.stopPropagation(); onSOS(trip); }}
              className="w-full md:w-40 h-20 md:h-20 bg-red-600 hover:bg-red-700 text-white font-black rounded-[2rem] shadow-2xl shadow-red-900/30 flex items-center justify-center gap-3 transition-all active:scale-95 group/sos"
            >
              <div className="w-3 h-3 bg-white rounded-full animate-ping shadow-[0_0_15px_white]" />
              <span className="tracking-[0.3em] uppercase text-2xl">SOS</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDropOut(trip); }}
              className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-red-500 transition-colors mr-4"
            >
              Drop-out of trip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveTripCard;
