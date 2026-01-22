
import React, { useState, useMemo } from 'react';
import { Trip, User, CoTraveler } from '../types';
import { M3Card, M3Button } from '../components/ui/M3Components';
import { db } from '../lib/mockDb';

interface RateTribeProps {
  trip: Trip;
  user: User;
  onBack: () => void;
  onSuccess: (msg: string) => void;
}

const TAG_OPTIONS = ['Respectful', 'Friendly', 'Calm', 'Punctual', 'Good communicator'];
const ORGANIZER_TAGS = ['On time', 'Clear plan', 'Supportive', 'Expert knowledge', 'Professional'];

// Common high-contrast color for labels and text
const PRIMARY_TEXT_COLOR = '#0B1F3A';
const PLACEHOLDER_COLOR = 'rgba(11, 31, 58, 0.45)';

const RateTribe: React.FC<RateTribeProps> = ({ trip, user, onBack, onSuccess }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [submitted, setSubmitted] = useState(false);
  
  // Filter co-travellers excluding self and the organizer (who gets rated separately in Step 2)
  const coTravelersToRate = useMemo(() => 
    trip.coTravelers.filter(ct => ct.id !== user.id && !ct.isOrganizer), 
  [trip.coTravelers, user.id]);

  // Initial state for co-travellers
  const [ratings, setRatings] = useState<Record<string, { stars: number; tags: string[]; comment: string }>>(
    coTravelersToRate.reduce((acc, ct) => ({
      ...acc,
      [ct.id]: { stars: 0, tags: [], comment: '' }
    }), {} as Record<string, { stars: number; tags: string[]; comment: string }>)
  );

  // Organizer Rating State
  const [orgRating, setOrgRating] = useState({
    stars: 0,
    tags: [] as string[],
    comment: ''
  });

  const handleStarClick = (travelerId: string, stars: number) => {
    setRatings(prev => ({
      ...prev,
      [travelerId]: { ...prev[travelerId], stars }
    }));
  };

  const handleTagToggle = (travelerId: string, tag: string) => {
    setRatings(prev => {
      const currentTags = prev[travelerId].tags;
      const newTags = currentTags.includes(tag)
        ? currentTags.filter(t => t !== tag)
        : [...currentTags, tag];
      return {
        ...prev,
        [travelerId]: { ...prev[travelerId], tags: newTags }
      };
    });
  };

  const handleOrgTagToggle = (tag: string) => {
    setOrgRating(prev => {
      const currentTags = prev.tags;
      const newTags = currentTags.includes(tag)
        ? currentTags.filter(t => t !== tag)
        : [...currentTags, tag];
      return { ...prev, tags: newTags };
    });
  };

  const handleCommentChange = (travelerId: string, comment: string) => {
    setRatings(prev => ({
      ...prev,
      [travelerId]: { ...prev[travelerId], comment }
    }));
  };

  const isStep1Complete = useMemo(() => 
    coTravelersToRate.every(ct => ratings[ct.id].stars > 0), 
  [coTravelersToRate, ratings]);

  const isStep2Complete = useMemo(() => orgRating.stars > 0, [orgRating.stars]);

  const handleNext = () => {
    if (step === 1 && isStep1Complete) setStep(2);
  };

  const handleSubmit = () => {
    if (!isStep2Complete) return;

    // 1. Save Co-traveller ratings to "ratings" table (Simplified for demo)
    const formattedRatings = (Object.entries(ratings) as [string, { stars: number; tags: string[]; comment: string }][]).map(([id, data]) => {
      const traveler = trip.coTravelers.find(ct => ct.id === id);
      return {
        user: traveler?.name,
        stars: data.stars,
        tags: data.tags,
        comment: data.comment
      };
    });
    db.submitTripRatings(trip.id, formattedRatings);

    // 2. Save Organizer rating to "organizerRatings" table
    db.saveOrganizerRating({
        tripId: trip.id,
        organizerId: trip.organizerId,
        organizerType: trip.organizerType,
        raterUserId: user.id,
        stars: orgRating.stars,
        tags: orgRating.tags,
        comment: orgRating.comment
    });

    onSuccess("Thanks for rating! Your feedback helps keep Travel Tribe safe and reliable.");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#F8FAFF] page-transition">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 shadow-xl border border-green-100 animate-in zoom-in duration-500">
           <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase mb-4">Ratings Submitted 🙌</h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto font-medium leading-relaxed mb-12">
          Your feedback is anonymous and helps us verify travelers and organizers.
        </p>
        <M3Button variant="filled" className="!h-16 !px-12 shadow-2xl" onClick={onBack}>Back to Trips</M3Button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-40 px-4 max-w-3xl mx-auto w-full page-transition">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 text-gray-400 hover:text-[#0A3D91]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic leading-none">Rate Your Tribe Experience</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
            Phase {step} of 2: {step === 1 ? 'Co-Travellers' : 'Organizer'}
          </p>
        </div>
      </div>

      <div className="space-y-10">
        {step === 1 ? (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">How were your tribe mates?</h3>
            {coTravelersToRate.map(ct => (
              <M3Card key={ct.id} variant="outlined" className="p-8 space-y-8 bg-white">
                <div className="flex items-center gap-5">
                  <img src={ct.avatar} className="w-16 h-16 rounded-[1.5rem] shadow-md border border-gray-100" alt={ct.name} />
                  <div>
                    <h3 className="text-xl font-black text-[#0F172A] tracking-tight uppercase">{ct.name}</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tribe Member</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label 
                    className="text-[11px] uppercase tracking-widest block" 
                    style={{ color: PRIMARY_TEXT_COLOR, fontWeight: 600, opacity: 1 }}
                  >
                    Expedition Conduct
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => {
                      const isSelected = ratings[ct.id].stars >= star;
                      return (
                        <button
                          key={star}
                          onClick={() => handleStarClick(ct.id, star)}
                          className={`flex-1 h-14 rounded-2xl flex items-center justify-center transition-all border ${
                            isSelected 
                              ? 'bg-[#0A3D91] border-[#0A3D91] text-white shadow-lg' 
                              : 'bg-white border-gray-200 text-gray-300 hover:border-blue-200 hover:text-blue-400'
                          }`}
                        >
                          <svg className="w-6 h-6" fill={isSelected ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isSelected ? "0" : "2"} viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <label 
                    className="text-[11px] uppercase tracking-widest block" 
                    style={{ color: PRIMARY_TEXT_COLOR, fontWeight: 600, opacity: 1 }}
                  >
                    Characteristic Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TAG_OPTIONS.map(tag => {
                      const isSelected = ratings[ct.id].tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => handleTagToggle(ct.id, tag)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                            isSelected 
                              ? 'bg-[#0A3D91] border-[#0A3D91] text-white shadow-md' 
                              : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                          }`}
                          style={{ color: isSelected ? 'white' : PRIMARY_TEXT_COLOR, opacity: 1 }}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label 
                    className="text-[11px] uppercase tracking-widest block" 
                    style={{ color: PRIMARY_TEXT_COLOR, fontWeight: 600, opacity: 1 }}
                  >
                    Notes (Optional)
                  </label>
                  <textarea 
                    rows={2} 
                    placeholder="Share your experience..." 
                    style={{ color: PRIMARY_TEXT_COLOR, fontWeight: 600 }}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs outline-none focus:border-[#0A3D91] resize-none placeholder:text-[rgba(11,31,58,0.45)]"
                    value={ratings[ct.id].comment}
                    onChange={(e) => handleCommentChange(ct.id, e.target.value)}
                  />
                </div>
              </M3Card>
            ))}
            <M3Button variant="filled" fullWidth className="!h-20 !rounded-[2.5rem] shadow-2xl opacity-100" disabled={!isStep1Complete} onClick={handleNext}>
              {isStep1Complete ? 'Continue to Organizer Rating' : 'Please rate all tribe mates'}
            </M3Button>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Rate the trip organization</h3>
            <M3Card variant="outlined" className="p-8 space-y-8 bg-white border-2 border-blue-100">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-blue-50 flex items-center justify-center text-3xl shadow-inner">
                        {trip.organizerType === 'organizer' ? '🏢' : '👤'}
                    </div>
                    <div>
                        <h3 className="text-xl font-black tracking-tight uppercase italic" style={{ color: PRIMARY_TEXT_COLOR }}>{trip.organizerDisplayName}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: PRIMARY_TEXT_COLOR, opacity: 0.7 }}>Trip Organizer ({trip.organizerType})</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <label 
                      className="text-[11px] uppercase tracking-widest block" 
                      style={{ color: PRIMARY_TEXT_COLOR, fontWeight: 600, opacity: 1 }}
                    >
                      Planning & Coordination
                    </label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => {
                          const isSelected = orgRating.stars >= star;
                          return (
                            <button
                                key={star}
                                onClick={() => setOrgRating(prev => ({ ...prev, stars: star }))}
                                className={`flex-1 h-14 rounded-2xl flex items-center justify-center transition-all border ${
                                    isSelected 
                                      ? 'bg-[#0A3D91] border-[#0A3D91] text-white shadow-lg' 
                                      : 'bg-white border-gray-200 text-gray-300 hover:bg-blue-50 hover:border-blue-300'
                                }`}
                            >
                                <svg className="w-6 h-6" fill={isSelected ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isSelected ? "0" : "2"} viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </button>
                          );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <label 
                      className="text-[11px] uppercase tracking-widest block" 
                      style={{ color: PRIMARY_TEXT_COLOR, fontWeight: 600, opacity: 1 }}
                    >
                      Quick Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {ORGANIZER_TAGS.map(tag => {
                        const isSelected = orgRating.tags.includes(tag);
                        return (
                            <button
                                key={tag}
                                onClick={() => handleOrgTagToggle(tag)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                    isSelected 
                                    ? 'bg-[#0A3D91] border-[#0A3D91] text-white' 
                                    : 'bg-blue-50/50 border-blue-100 hover:border-blue-200 hover:bg-blue-50'
                                }`}
                                style={{ color: isSelected ? 'white' : PRIMARY_TEXT_COLOR, opacity: 1 }}
                            >
                                {tag}
                            </button>
                        );
                        })}
                    </div>
                </div>

                <div className="space-y-2">
                    <label 
                      className="text-[11px] uppercase tracking-widest block" 
                      style={{ color: PRIMARY_TEXT_COLOR, fontWeight: 600, opacity: 1 }}
                    >
                      Feedback for {trip.organizerDisplayName}
                    </label>
                    <textarea 
                        rows={3} 
                        placeholder="How was the trip planning & coordination?" 
                        style={{ color: PRIMARY_TEXT_COLOR, fontWeight: 600 }}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs outline-none focus:border-[#0A3D91] resize-none placeholder:text-[rgba(11,31,58,0.45)]"
                        value={orgRating.comment}
                        onChange={(e) => setOrgRating(prev => ({ ...prev, comment: e.target.value }))}
                    />
                </div>
            </M3Card>

            <div className="flex gap-4">
              <M3Button variant="tonal" className="flex-1 opacity-100" onClick={() => setStep(1)}>Back</M3Button>
              <M3Button variant="filled" className="flex-[2] !h-20 !rounded-[2.5rem] shadow-2xl opacity-100" disabled={!isStep2Complete} onClick={handleSubmit}>
                {isStep2Complete ? 'Submit All Ratings' : 'Rate the Organizer to finish'}
              </M3Button>
            </div>
          </div>
        )}

        <div className="bg-[#0A3D91]/5 p-6 rounded-[2rem] border border-[#0A3D91]/10 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed italic" style={{ color: PRIMARY_TEXT_COLOR }}>
            "Your feedback helps keep the Travel Tribe ecosystem safe. Individual ratings are aggregated."
          </p>
        </div>
      </div>
    </div>
  );
};

export default RateTribe;
