
import React, { useState, useEffect } from 'react';
import { M3Button } from './ui/M3Components';
import { TripRating, CoTraveler } from '../types';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: Omit<TripRating, 'id' | 'tripId' | 'raterUserId' | 'ratedUserId' | 'createdAt'>) => void;
  traveler: CoTraveler;
  initialRating?: TripRating;
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, onSubmit, traveler, initialRating }) => {
  const [ratings, setRatings] = useState({
    respect: initialRating?.respect || 0,
    reliability: initialRating?.reliability || 0,
    cooperation: initialRating?.cooperation || 0,
    safety: initialRating?.safety || 0
  });
  const [feedback, setFeedback] = useState(initialRating?.feedback || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRatings({
        respect: initialRating?.respect || 0,
        reliability: initialRating?.reliability || 0,
        cooperation: initialRating?.cooperation || 0,
        safety: initialRating?.safety || 0
      });
      setFeedback(initialRating?.feedback || '');
      setError('');
    }
  }, [isOpen, initialRating]);

  if (!isOpen) return null;

  const handleRatingChange = (category: keyof typeof ratings, value: number) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  const handleFinalSubmit = () => {
    if (Object.values(ratings).some(v => v === 0)) {
      setError('All ratings are required (1–5).');
      return;
    }
    onSubmit({
      ...ratings,
      feedback: feedback.trim() || undefined
    });
    onClose();
  };

  const categories = [
    { key: 'respect', label: 'Respectful behavior' },
    { key: 'reliability', label: 'Reliability & Punctuality' },
    { key: 'cooperation', label: 'Cooperation with Group' },
    { key: 'safety', label: 'Adherence to Safety' }
  ];

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-[#001A40]/50 backdrop-blur-md">
      <div className="bg-white max-w-lg w-full p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <div className="mb-10 text-center">
          <span className="text-[10px] font-black text-[#0A3D91] uppercase tracking-[0.3em]">Expedition Feedback</span>
          <div className="flex flex-col items-center mt-6">
            <img src={traveler.avatar} className="w-20 h-20 rounded-[1.5rem] shadow-lg border-2 border-white mb-4" alt="" />
            <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic">Rate {traveler.name}</h2>
          </div>
        </div>

        <div className="space-y-10">
          {categories.map(cat => (
            <div key={cat.key} className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black uppercase text-gray-500 tracking-widest">{cat.label}</label>
                <span className="text-xl font-black text-[#0A3D91]">{ratings[cat.key as keyof typeof ratings] || '—'}</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star} 
                    onClick={() => handleRatingChange(cat.key as keyof typeof ratings, star)}
                    className={`flex-1 h-12 rounded-xl text-lg font-black transition-all ${
                      ratings[cat.key as keyof typeof ratings] >= star 
                        ? 'bg-[#0A3D91] text-white' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {star}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-gray-500 tracking-widest ml-2">Personal Feedback (Optional)</label>
            <textarea 
              placeholder="How was your experience traveling with them?"
              className="w-full bg-gray-50 border border-gray-100 p-6 rounded-3xl text-sm font-bold text-[#0F172A] outline-none focus:border-[#0A3D91] resize-none h-32"
              value={feedback}
              maxLength={300}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <div className="flex justify-end pr-4">
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{feedback.length}/300</span>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest text-center animate-in shake-in">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <M3Button variant="tonal" className="flex-1" onClick={onClose}>Cancel</M3Button>
            <M3Button className="flex-[2]" onClick={handleFinalSubmit}>Submit Rating</M3Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
