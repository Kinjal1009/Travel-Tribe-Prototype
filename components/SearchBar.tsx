
import React, { useState } from 'react';
import { INDIAN_CITIES } from '../lib/mockData';
import { SearchFilters, TripType } from '../types';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    startFrom: '',
    budget: 'Any',
    tripType: 'Any'
  });

  return (
    <div className="bg-white p-4 md:p-6 rounded-[2rem] max-w-5xl mx-auto -mt-10 md:-mt-12 relative z-10 border border-gray-100 shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="space-y-1">
          <label className="text-[9px] uppercase tracking-[0.2em] text-[#0A3D91] ml-2 font-black">Destination</label>
          <select 
            value={filters.location}
            onChange={(e) => setFilters({...filters, location: e.target.value})}
            className="w-full bg-gray-50 text-[#0F172A] border border-gray-100 p-3 rounded-xl appearance-none cursor-pointer focus:border-[#0A3D91] focus:bg-white outline-none font-bold text-xs"
          >
            <option value="">Where to go?</option>
            {INDIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] uppercase tracking-[0.2em] text-[#0A3D91] ml-2 font-black">Starting from</label>
          <select 
            value={filters.startFrom}
            onChange={(e) => setFilters({...filters, startFrom: e.target.value})}
            className="w-full bg-gray-50 text-[#0F172A] border border-gray-100 p-3 rounded-xl appearance-none cursor-pointer focus:border-[#0A3D91] focus:bg-white outline-none font-bold text-xs"
          >
            <option value="">Origin</option>
            {INDIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="text-[9px] uppercase tracking-[0.2em] text-[#0A3D91] ml-2 font-black">Organizer Type</label>
          <select 
            className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-[10px] font-black outline-none cursor-pointer text-[#0A3D91]"
            value={filters.tripType}
            onChange={(e) => setFilters({...filters, tripType: e.target.value as any})}
          >
            <option value="Any">Organizer Type</option>
            <option value={TripType.INDIVIDUAL}>Individual Host</option>
            <option value={TripType.ORGANIZER}>Travel Organizer</option>
          </select>
        </div>

        <button 
          onClick={() => onSearch(filters)}
          className="h-12 bg-[#0A3D91] text-white hover:bg-blue-800 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95"
        >
          Find Trips
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
