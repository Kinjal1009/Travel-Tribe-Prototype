import React, { useState, useEffect, useMemo } from 'react';
import { User, Trip, TripType, TravelMode, KycStatus, ItineraryDay, BookingLifecycleStatus, ParticipationState, TripStatus, CoTraveler, OrganizerProfileStats } from '../types';
import { INDIAN_CITIES, LOCATION_IMAGE_MAP, getAutoItinerary, SEED_VERSION } from '../lib/mockData';
import { M3Button, M3Card, M3DatePicker } from '../components/ui/M3Components';
import { checkTripOverlap, formatDateDDMMYYYY, parseTripDate, isValidDDMMYYYY, toISODate, getNextDayISO, getRelativeDate } from '../lib/dateUtils';
import { db } from '../lib/mockDb';

interface InitiateTripProps {
  user: User;
  allTrips: Trip[];
  onTripCreated: (trip: Trip) => void;
  onNavigate: (page: string, params?: any) => void;
}

const InitiateTrip: React.FC<InitiateTripProps> = ({ user, allTrips, onTripCreated, onNavigate }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [newStop, setNewStop] = useState('');
  
  const isOrganizer = user.userRole === 'ORGANIZER';
  const organizerStats = useMemo(() => db.getOrganizerStats(user.id), [user.id]);
  
  const [formData, setFormData] = useState({
    tripName: '',
    tripType: isOrganizer ? TripType.ORGANIZER : TripType.INDIVIDUAL,
    companyName: user.organizerName || '',
    createdByName: user.name,
    profilePicUrl: user.avatarUrl,
    startPoint: '',
    routeStops: [] as string[],
    startDate: '', // Internal: YYYY-MM-DD (ISO)
    endDate: '',   // Internal: YYYY-MM-DD (ISO)
    travelMode: '' as TravelMode | '', // Required toggle
    womenOnly: false,
    maxGroupSize: 10,
    budgetAmountInr: 5000,
    itineraryDays: [] as ItineraryDay[],
  });

  const isVerified = user.kycStatus === KycStatus.VERIFIED;
  const todayISO = new Date().toISOString().split('T')[0];

  // Sync itinerary days with date range
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = parseTripDate(formData.startDate);
      const end = parseTripDate(formData.endDate);
      
      if (start && end) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays > 0 && diffDays < 31) {
          if (formData.itineraryDays.length !== diffDays) {
            const auto = getAutoItinerary(formData.routeStops[0] || 'Destination', diffDays);
            setFormData(prev => ({ 
              ...prev, 
              itineraryDays: auto 
            }));
          }
        }
      }
    }
    setError(null);
  }, [formData.startDate, formData.endDate, formData.routeStops]);

  const addStop = () => {
    if (newStop.trim() && !formData.routeStops.includes(newStop.trim())) {
      setFormData({ ...formData, routeStops: [...formData.routeStops, newStop.trim()] });
      setNewStop('');
    }
  };

  const removeStop = (stop: string) => {
    setFormData({ ...formData, routeStops: formData.routeStops.filter(s => s !== stop) });
  };

  const updateItineraryDay = (index: number, field: keyof ItineraryDay, value: string) => {
    const updated = [...formData.itineraryDays];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, itineraryDays: updated });
  };

  const validateForm = () => {
    if (step === 1) {
      if (!formData.tripName.trim()) return "Trip headline is required.";
    }
    if (step === 2) {
      if (!formData.startPoint) return "Starting point is required.";
      if (formData.routeStops.length === 0) return "At least one target destination is required.";
      if (!formData.travelMode) return "Travel mode selection is required.";
      
      if (!formData.startDate) return "Departure date is required.";
      if (!formData.endDate) return "Return date is required.";
      
      const start = parseTripDate(formData.startDate);
      const end = parseTripDate(formData.endDate);
      if (start && end && end <= start) return "Return date must be after departure date.";
      
      const overlap = checkTripOverlap(user, 'NEW_TRIP', formData.startDate, formData.endDate, allTrips);
      if (overlap) return `Conflict: You are already on "${overlap.title}" during this period.`;
    }
    if (step === 3) {
      if (!formData.budgetAmountInr || formData.budgetAmountInr < 1000) return "Valid numeric budget is required (Min ₹1,000).";
      if (formData.maxGroupSize < 2) return "Group size must be at least 2.";
    }
    if (step === 4) {
      const missing = formData.itineraryDays.some(d => !d.title.trim() || !d.summary.trim());
      if (missing) return "Please provide a headline and plan for all days.";
    }
    return null;
  };

  const handleNextOrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (step < 4) {
      setStep(step + 1);
      window.scrollTo(0, 0);
      return;
    }

    // Final Publication
    try {
      const mainLocation = formData.routeStops[0] || 'Generic';
      const images = LOCATION_IMAGE_MAP[mainLocation] || LOCATION_IMAGE_MAP['Generic'];

      const creatorCoTraveler: CoTraveler = {
        id: user.id,
        name: user.name,
        avatar: user.avatarUrl,
        vibeProfile: user.vibeProfile || { 
          pace: 'Balanced', 
          budget: 'Talk it out calmly', 
          food: 'Comfortable after a little time', 
          social: 'Depends on the day', 
          comfort: 'Medium' 
        },
        trustSignals: user.historySignals ? {
          verifiedId: user.kycVerified,
          pastTripsCompleted: user.historySignals.pastTripsCompleted,
          dropOffs: user.historySignals.pastDropoffs,
          avgRating: user.historySignals.avgRating,
          commToneScore: user.historySignals.priorForumToneScore
        } : { verifiedId: true, pastTripsCompleted: 0, dropOffs: 0, avgRating: 5, commToneScore: 20 },
        trustScore: user.trustScore,
        trustTier: user.trustTier,
        isOrganizer: true
      };

      const newTrip: Trip = {
        id: `trip-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: formData.tripName,
        location: mainLocation,
        locationsCovered: formData.routeStops,
        startPoint: formData.startPoint,
        routeStops: formData.routeStops,
        endPoint: '', 
        fromCity: formData.startPoint,
        toCity: formData.routeStops[0] || '', 
        startDate: formData.startDate,
        endDate: formData.endDate,
        numberOfDays: formData.itineraryDays.length,
        travelModes: [formData.travelMode as TravelMode],
        tripType: formData.tripType,
        womenOnly: formData.womenOnly,
        accessPolicy: formData.womenOnly ? "WOMEN_ONLY" : "OPEN",
        featuredScore: 0,
        bookingsVelocity: 0,
        joinedCount: 1,
        maxTravelers: formData.maxGroupSize,
        capacity: formData.maxGroupSize,
        imageUrl: images[0],
        itinerary: formData.itineraryDays,
        pricePerPersonInr: Number(formData.budgetAmountInr),
        estimatedBudget: Number(formData.budgetAmountInr),
        coTravelers: [creatorCoTraveler], 
        ownerId: user.id,
        createdByUserId: user.id,
        creator: {
          type: isOrganizer ? 'organizer' : 'individual',
          name: isOrganizer ? (user.organizerName || 'Travel Agency') : user.name,
          avatarUrl: !isOrganizer ? user.avatarUrl : undefined,
          companyLogoUrl: isOrganizer ? `https://api.dicebear.com/7.x/initials/svg?seed=${user.organizerName || 'TA'}&backgroundColor=0A3D91` : undefined,
        },
        participants: [{ userId: user.id, status: 'approved', paid: true, joinedAt: new Date().toISOString().split('T')[0] }],
        visibilityRules: { requiresKyc: true, requiresApproval: !isOrganizer },
        bookingState: BookingLifecycleStatus.PLANNING,
        userParticipation: ParticipationState.APPROVED_PAID,
        bookingStateObj: { 
          bus: { proposals: [], lockedProposalId: null, votes: {} }, 
          hotel: { proposals: [], lockedProposalId: null, votes: {} }, 
          flight: { proposals: [], lockedProposalId: null, votes: {} },
          lifecycleStatus: BookingLifecycleStatus.PLANNING, 
          paymentEnabled: false 
        },
        status: 'OPEN',
        organizerId: user.id,
        organizerType: isOrganizer ? 'organizer' : 'individual',
        organizerDisplayName: isOrganizer ? (user.organizerName || 'Travel Agency') : user.name
      };

      onTripCreated(newTrip);
    } catch (err: any) {
      console.error("Publication failed:", err);
      setError("Failed to publish trip. Check all fields and try again.");
    }
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen pt-24 px-6 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
           <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Identity Check Required</h2>
        <p className="text-gray-500 mb-10 max-w-xs font-medium">Hosts must have a verified badge to initiate expeditions. It only takes 2 minutes.</p>
        <M3Button onClick={() => onNavigate('profile')}>Verify Profile Now</M3Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-40 px-6 max-w-4xl mx-auto w-full page-transition">
      <div className="flex items-center gap-4 mb-10">
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Create Trip</h1>
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[10px] font-black text-[#0A3D91] bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Step {step}/4</span>
      </div>

      <form onSubmit={handleNextOrSubmit} className="space-y-8">
        {error && (
          <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] text-[10px] text-red-700 font-black uppercase tracking-widest animate-in shake-in">
            {error}
          </div>
        )}

        {step === 1 && (
          <M3Card variant="outlined" className="p-8 space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0A3D91]">STEP 1: TRIP OVERVIEW</h3>
            <div className="space-y-4">
               <div className="flex items-center justify-between bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xs ${isOrganizer ? 'bg-[#0A3D91]' : 'bg-blue-400'}`}>
                        {isOrganizer ? 'ORG' : 'IND'}
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-[#0A3D91] uppercase tracking-widest">Publishing capacity</p>
                        <p className="text-sm font-bold text-gray-900 leading-tight">
                            {isOrganizer ? `Organizer: ${user.organizerName}` : `Individual Host: ${user.name}`}
                        </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-[#0A3D91] uppercase tracking-widest mb-1">Host Rating</p>
                    {organizerStats ? (
                        <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-sm font-black text-[#0A3D91]">⭐ {organizerStats.avgStars}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">({organizerStats.ratingCount} ratings)</span>
                        </div>
                    ) : (
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">New Organizer</span>
                    )}
                  </div>
               </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Trip Headline</label>
                <input required placeholder="e.g. Hampi Ruins & Hidden Boulders" className="w-full h-16 bg-gray-50 rounded-2xl px-6 font-bold outline-none border border-transparent focus:border-[#0A3D91] transition-all" value={formData.tripName} onChange={e => setFormData({...formData, tripName: e.target.value})} />
              </div>
              <div className="flex items-center gap-4 px-4 pt-2">
                 <label className="text-xs font-bold text-gray-600 uppercase tracking-widest cursor-pointer flex items-center gap-3">
                    <input type="checkbox" checked={formData.womenOnly} onChange={e => setFormData({...formData, womenOnly: e.target.checked})} className="w-6 h-6 rounded-lg accent-[#0A3D91] cursor-pointer" />
                    Women-only Trip
                 </label>
              </div>
            </div>
          </M3Card>
        )}

        {step === 2 && (
          <M3Card variant="outlined" className="p-8 space-y-8 !overflow-visible">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0A3D91]">STEP 2: ROUTE & DATES</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Origin City</label>
                <select required value={formData.startPoint} onChange={e => setFormData({...formData, startPoint: e.target.value})} className="w-full h-16 bg-gray-50 rounded-2xl px-6 font-bold outline-none appearance-none border border-gray-100">
                  <option value="">Choose Origin</option>
                  {INDIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Destinations Covered</label>
              <div className="flex gap-2">
                <select value={newStop} onChange={e => setNewStop(e.target.value)} className="flex-1 h-16 bg-gray-50 rounded-2xl px-6 font-bold outline-none appearance-none border border-gray-100">
                  <option value="">Add destination...</option>
                  {INDIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
                <M3Button variant="tonal" onClick={addStop} className="!h-16 !px-8">Add</M3Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {formData.routeStops.map(stop => (
                  <span key={stop} className="bg-blue-50 text-[#0A3D91] px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-3 border border-blue-100 animate-in zoom-in-50">
                    {stop}
                    <button onClick={() => removeStop(stop)} type="button" className="text-[#0A3D91]/40 hover:text-red-500 transition-colors">✕</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Travel Mode Toggle */}
            <div className="space-y-2 pt-2">
              <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Preferred Travel Mode (Required)</label>
              <div className="flex gap-3">
                {[TravelMode.BUS, TravelMode.TRAIN, TravelMode.FLIGHT].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFormData({ ...formData, travelMode: mode })}
                    className={`flex-1 h-16 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all active:scale-[0.98] ${
                      formData.travelMode === mode 
                        ? 'bg-[#0A3D91] border-[#0A3D91] text-white shadow-xl shadow-blue-900/10' 
                        : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Departure (DD/MM/YYYY)</label>
                <M3DatePicker
                  required
                  name="DepartureDate"
                  className="w-full h-16 bg-gray-50 rounded-2xl px-6 font-bold outline-none border border-gray-100"
                  value={formData.startDate}
                  minDate={todayISO}
                  onChange={val => {
                    const newEndDate = (formData.endDate && formData.endDate <= val) ? '' : formData.endDate;
                    setFormData({ ...formData, startDate: val, endDate: newEndDate });
                  }}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Return (DD/MM/YYYY)</label>
                <M3DatePicker
                  required
                  name="ReturnDate"
                  disabled={!formData.startDate}
                  className="w-full h-16 bg-gray-50 rounded-2xl px-6 font-bold outline-none border border-gray-100"
                  value={formData.endDate}
                  minDate={formData.startDate ? getNextDayISO(formData.startDate) : todayISO}
                  onChange={val => setFormData({ ...formData, endDate: val })}
                  placeholder="DD/MM/YYYY"
                />
              </div>
            </div>
          </M3Card>
        )}

        {step === 3 && (
          <M3Card variant="outlined" className="p-8 space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0A3D91]">STEP 3: GROUP DETAILS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Capacity (People)</label>
                <input required type="number" min="2" max="50" className="w-full h-16 bg-gray-50 rounded-2xl px-6 font-bold outline-none border border-gray-100" value={formData.maxGroupSize} onChange={e => setFormData({...formData, maxGroupSize: parseInt(e.target.value) || 0})} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Estimated Budget (INR)</label>
                <input required type="number" step="500" min="1000" className="w-full h-16 bg-gray-50 rounded-2xl px-6 font-bold outline-none border border-transparent focus:border-[#0A3D91] transition-all text-[#0A3D91]" value={formData.budgetAmountInr} onChange={e => setFormData({...formData, budgetAmountInr: parseInt(e.target.value) || 0})} />
              </div>
            </div>
          </M3Card>
        )}

        {step === 4 && (
          <div className="space-y-8">
            <M3Card variant="outlined" className="p-8 space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0A3D91]">STEP 4: ITINERARY PLAN</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest -mt-4">Define the mission for each day</p>
              
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                {formData.itineraryDays.map((day, idx) => (
                  <div key={idx} className="p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-4 group transition-all hover:bg-white hover:shadow-xl hover:border-blue-100">
                    <div className="flex items-center justify-between">
                       <span className="w-10 h-10 bg-[#0A3D91] text-white rounded-xl flex items-center justify-center font-black text-xs">D{day.day}</span>
                       <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">Required Plan</span>
                    </div>
                    <div className="space-y-3">
                      <input 
                        required
                        placeholder="Day Title (e.g. Midnight Trek)" 
                        className="w-full bg-transparent border-b border-gray-200 py-2 font-black uppercase tracking-tight text-sm text-[#0F172A] focus:border-[#0A3D91] outline-none"
                        value={day.title}
                        onChange={(e) => updateItineraryDay(idx, 'title', e.target.value)}
                      />
                      <textarea 
                        required
                        rows={2}
                        placeholder="What's the tribe doing?" 
                        className="w-full bg-transparent text-xs font-bold text-gray-500 outline-none resize-none leading-relaxed"
                        value={day.summary}
                        onChange={(e) => updateItineraryDay(idx, 'summary', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </M3Card>

            <M3Card variant="filled" className="p-8 bg-gray-900 text-white rounded-[3rem] shadow-2xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-6">Execution Summary</h3>
              <div className="space-y-2">
                <p className="text-xl font-black italic uppercase tracking-tight truncate">{formData.tripName || 'Untitled Expedition'}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                  {formData.startPoint} → {formData.routeStops.join(' → ')}
                </p>
                <div className="pt-4 border-t border-white/10 mt-4 flex justify-between items-end">
                   <div>
                      <p className="text-[8px] font-black uppercase opacity-40">Timeline</p>
                      <p className="text-xs font-bold">{formatDateDDMMYYYY(formData.startDate)} to {formatDateDDMMYYYY(formData.endDate)}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black uppercase opacity-40">Tribe Price</p>
                      <p className="text-xl font-black text-blue-400">₹{formData.budgetAmountInr.toLocaleString()}</p>
                   </div>
                </div>
              </div>
            </M3Card>
          </div>
        )}

        <div className="flex gap-6 pt-4">
          {step > 1 && (
            <button 
              type="button" 
              onClick={() => setStep(step - 1)}
              className="flex-1 h-16 rounded-[2rem] bg-gray-100 text-gray-500 font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all active:scale-95"
            >
              Back
            </button>
          )}
          <M3Button type="submit" className="flex-[2] !h-16 shadow-2xl shadow-blue-900/30">
             {step === 4 ? 'Publish Expedition' : 'Continue'}
          </M3Button>
        </div>
      </form>
    </div>
  );
};

export default InitiateTrip;