import React, { useMemo } from 'react';
import { SearchFilters, Trip, User, VibeProfile, Currency } from '../types';
import { M3Button, M3Card } from '../components/ui/M3Components';
import { computeVibeMatch } from '../lib/vibeEngine';
import SearchBar from '../components/SearchBar';
import { formatDateRangeDDMMYYYY } from '../lib/dateUtils';
import TripCard from '../components/TripCard';

interface HomeProps {
  user: User | null;
  allTrips: Trip[];
  activeTrip: Trip | null;
  onSearch: (filters: SearchFilters) => void;
  onSelectTrip: (trip: Trip) => void;
  onSeeAll: () => void;
  onSOS: (trip: Trip) => void;
  userVibe: VibeProfile | null;
  currency: Currency;
  searchAttemptedWithoutVibe?: boolean;
  onVibeStart?: () => void;
}

const Home: React.FC<HomeProps> = ({ 
  user, allTrips, activeTrip, onSearch, onSelectTrip, onSeeAll, onSOS, userVibe, currency, searchAttemptedWithoutVibe, onVibeStart
}) => {
  
  const featuredTrips = useMemo(() => {
    let filtered = allTrips.filter(t => t.isFeatured);
    if (filtered.length === 0) {
      filtered = [...allTrips]
        .sort((a, b) => (b.featuredScore || 0) - (a.featuredScore || 0))
        .slice(0, 4);
    }
    return filtered.slice(0, 4);
  }, [allTrips]);

  return (
    <div className="pb-20 bg-white w-full">
      {activeTrip && (
        <section className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-center relative z-40">
          <div 
            onClick={() => onSelectTrip(activeTrip)}
            className="w-full max-w-7xl flex items-center justify-between gap-4 cursor-pointer group"
          >
            <button 
              onClick={(e) => { e.stopPropagation(); onSOS(activeTrip); }}
              className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg border-2 border-transparent"
            >
              SOS
            </button>
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-[#0A3D91] uppercase tracking-[0.2em] whitespace-nowrap">Active Trip</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
               </div>
               <h3 className="text-sm font-black text-[#0F172A] truncate mt-1 group-hover:text-[#0A3D91]">{activeTrip.title}</h3>
               <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 truncate">
                {activeTrip.location} • {formatDateRangeDDMMYYYY(activeTrip.startDate, activeTrip.endDate)}
               </p>
            </div>
            <div className="shrink-0 text-gray-300 group-hover:text-[#0A3D91] transition-all group-hover:translate-x-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
            </div>
          </div>
        </section>
      )}

      <section className="relative pt-24 pb-32 md:pb-40 px-6 bg-[#001A40] text-white overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover opacity-60"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#001A40]/90 via-[#001A40]/80 to-[#001A40]" />
        </div>
        
        <div className="max-w-6xl w-full text-center relative z-10">
          <div className="space-y-6">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-none">
              Travel with people you actually vibe with.
            </h1>
            <h2 className="text-sm md:text-base text-blue-100/70 font-medium max-w-xl mx-auto">
              Verified travelers. Real compatibility. Safer group trips.
            </h2>

            <div className="flex flex-wrap justify-center gap-4 pt-8">
              <M3Button variant="filled" className="!h-16 !px-10 shadow-2xl" onClick={onSeeAll}>EXPLORE EXPEDITIONS</M3Button>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <SearchBar onSearch={onSearch} />
        
        <div className="mt-20 space-y-20">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic">Featured Expeditions</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Handpicked high-vibe trips</p>
              </div>
              <M3Button variant="text" onClick={onSeeAll}>See all tribes →</M3Button>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredTrips.map(trip => (
                <TripCard 
                  key={trip.id} 
                  trip={trip} 
                  user={user}
                  vibeScore={userVibe ? computeVibeMatch(userVibe, trip.coTravelers) || 0 : undefined}
                  onClick={() => onSelectTrip(trip)} 
                  currency={currency} 
                />
              ))}
            </div>
          </div>

          <div className="space-y-12 pb-20">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic">How Travel Tribe Works</h2>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">The path to your next great expedition</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Discover Your Vibe', desc: 'Take the quick vibe check to define how you travel. We’ll match you with groups that share your rhythm.', icon: '✨' },
                { title: 'Travel with Confidence', desc: 'Every member is identity-verified. See collective group trust scores before you even apply to join.', icon: '🛡️' },
                { title: 'Plan as a Tribe', desc: 'Unlock private chats to propose routes and vote on stays. Lock the plan together before paying a rupee.', icon: '🤝' }
              ].map((step, i) => (
                <M3Card key={i} variant="outlined" className="p-8 space-y-4 bg-gray-50/50 hover:bg-white transition-colors group">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-black text-[#0F172A] tracking-tight uppercase leading-tight">{step.title}</h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">{step.desc}</p>
                </M3Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;