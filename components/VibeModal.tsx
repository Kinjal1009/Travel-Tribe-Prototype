
import React, { useState, useEffect } from 'react';
import { VibeProfile, TravelMode } from '../types';
import { M3Button } from './ui/M3Components';

interface VibeModalProps {
  onComplete: (profile: VibeProfile) => void;
  onClose: () => void;
  isOpen: boolean;
  isMandatory?: boolean;
}

const QUESTIONS = [
  { 
    key: 'pace', 
    label: 'How do you like to travel?', 
    options: [
      {v: 'Fast-paced', l:'Fast-paced — I like covering a lot'}, 
      {v: 'Relaxed', l:'Relaxed — I prefer fewer places, more time'}, 
      {v: 'Balanced', l:'Balanced — a mix of both'}
    ] 
  },
  { 
    key: 'commitment', 
    label: 'What’s your travel planning style?', 
    options: [
      {v: 'Planned', l:'Planned — I like knowing what’s coming'}, 
      {v: 'Go-with-the-flow', l:'Go-with-the-flow — plans can change'}, 
      {v: 'Flexible', l:'Flexible — plan the basics, adjust as we go'}
    ] 
  },
  { 
    key: 'social', 
    label: 'What kind of group energy do you enjoy?', 
    options: [
      {v: 'Social & chatty', l:'Social & chatty'}, 
      {v: 'Calm & respectful', l:'Calm & respectful'}, 
      {v: 'Depends on the day', l:'Depends on the day'}
    ] 
  },
  { 
    key: 'soloTime', 
    label: 'When group decisions come up, you usually…', 
    options: [
      {v: 'Like to discuss and decide together', l:'Like to discuss and decide together'}, 
      {v: 'Are okay following the group', l:'Are okay following the group'}, 
      {v: 'Prefer a clear lead, but open to input', l:'Prefer a clear lead, but open to input'}
    ] 
  },
  { 
    key: 'food', 
    label: 'How comfortable are you with meeting new people on trips?', 
    options: [
      {v: 'Very comfortable', l:'Very comfortable'}, 
      {v: 'Comfortable after a little time', l:'Comfortable after a little time'}, 
      {v: 'I take time, but I warm up', l:'I take time, but I warm up'}
    ] 
  },
  { 
    key: 'nightStyle', 
    label: 'On a typical trip day, you prefer…', 
    options: [
      {v: 'Early starts and full days', l:'Early starts and full days'}, 
      {v: 'Easy mornings, steady days', l:'Easy mornings, steady days'}, 
      {v: 'Late starts, relaxed pace', l:'Late starts, relaxed pace'}
    ] 
  },
  { 
    key: 'travelMode', 
    label: 'Which sounds more like you on a trip?', 
    options: [
      {v: 'I like structure and clarity', l:'I like structure and clarity'}, 
      {v: 'I like freedom and spontaneity', l:'I like freedom and spontaneity'}, 
      {v: 'A bit of both', l:'A bit of both'}
    ] 
  },
  { 
    key: 'budget', 
    label: 'If there’s a disagreement during a trip, you usually…', 
    options: [
      {v: 'Talk it out calmly', l:'Talk it out calmly'}, 
      {v: 'Adjust and move on', l:'Adjust and move on'}, 
      {v: 'Prefer space before discussing', l:'Prefer space before discussing'}
    ] 
  },
];

const VibeModal: React.FC<VibeModalProps> = ({ onComplete, onClose, isOpen, isMandatory = false }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showFullHelper, setShowFullHelper] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setStep(0);
      setAnswers({});
      setCurrentSelection(null);
      setIsAdvancing(false);
      setShowFullHelper(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentQ = QUESTIONS[step];

  const goNext = (selectedVal: string) => {
    const newAnswers = { ...answers, [currentQ.key]: selectedVal };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      setCurrentSelection(newAnswers[QUESTIONS[nextStep].key] || null);
      setIsAdvancing(false);
    } else {
      onComplete(newAnswers as unknown as VibeProfile);
    }
  };

  const handleOptionClick = (val: string) => {
    if (isAdvancing) return;
    setCurrentSelection(val);
    setIsAdvancing(true);
    setTimeout(() => goNext(val), 200);
  };

  const handleBack = () => {
    if (step > 0 && !isAdvancing) {
      const prevStep = step - 1;
      setStep(prevStep);
      setCurrentSelection(answers[QUESTIONS[prevStep].key] || null);
    }
  };

  const handleSkip = () => {
    if (isAdvancing || isMandatory) return;
    setIsAdvancing(true);
    setTimeout(() => goNext('Skipped'), 200);
  };

  const progress = ((step + 1) / QUESTIONS.length) * 100;

  return (
    <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-[#001A40]/80 backdrop-blur-md" onClick={() => !isMandatory && setShowExitConfirm(true)} />

      <div className="relative w-full max-w-xl bg-white md:rounded-[3rem] rounded-t-[3rem] shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
        <header className="h-16 md:h-20 flex items-center px-6 md:px-8 border-b border-gray-100 shrink-0">
          <div className="flex-1">
             <h2 className="text-[9px] md:text-[10px] font-black text-[#0A3D91] uppercase tracking-[0.3em]">Tribe Compatibility Check</h2>
             <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                   <div className="h-full bg-[#0A3D91] transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[8px] md:text-[9px] font-black text-[#0A3D91]">{step + 1}/{QUESTIONS.length}</span>
             </div>
          </div>
          {!isMandatory && (
            <button onClick={() => setShowExitConfirm(true)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-5 md:p-10 space-y-4 md:space-y-6 no-scrollbar">
          <div className="space-y-1">
            <p className="text-[9px] md:text-[10px] font-black text-blue-400 uppercase tracking-widest">Question {step + 1}</p>
            <h3 className="text-xl md:text-3xl font-black text-[#1B1B1F] tracking-tight leading-tight">{currentQ.label}</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-2 md:gap-3">
            {currentQ.options.map((opt) => {
              const isSelected = currentSelection === opt.v;
              return (
                <button
                  key={opt.v}
                  disabled={isAdvancing}
                  onClick={() => handleOptionClick(opt.v)}
                  aria-pressed={isSelected}
                  className={`w-full text-left p-3.5 md:p-5 rounded-[1.25rem] md:rounded-[1.5rem] border-2 transition-all flex items-center justify-between ${
                    isSelected 
                      ? 'border-[#0A3D91] bg-blue-50 ring-2 ring-[#0A3D91]/10' 
                      : 'border-gray-100 bg-white hover:border-blue-200'
                  } ${isAdvancing && !isSelected ? 'opacity-60' : ''}`}
                >
                  <span className={`text-xs md:text-sm font-bold leading-tight flex-1 pr-4 ${isSelected ? 'text-[#0A3D91]' : 'text-[#1B1B1F]'}`}>{opt.l}</span>
                  <div className={`w-5 h-5 md:w-6 md:h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-[#0A3D91] bg-[#0A3D91]' : 'border-gray-200'}`}>
                    {isSelected && <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Collapsible Helper Text Area */}
          <div className="bg-blue-50/50 p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border border-blue-50">
            <p className={`text-[9px] md:text-[10px] text-[#0A3D91] font-black uppercase tracking-widest text-center leading-relaxed ${!showFullHelper ? 'line-clamp-2' : ''}`}>
              Your vibe helps us match you with trips and people you’ll feel comfortable with. There are no right or wrong answers — just better alignment.
            </p>
            <button 
              onClick={() => setShowFullHelper(!showFullHelper)} 
              className="w-full text-center mt-1 text-[8px] md:text-[9px] font-black text-[#0A3D91]/60 uppercase tracking-tighter hover:underline"
            >
              {showFullHelper ? 'Collapse' : 'Learn more'}
            </button>
          </div>
        </div>

        <footer className="p-5 md:p-8 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <button 
            onClick={handleBack} 
            disabled={step === 0 || isAdvancing} 
            className="px-4 md:px-6 py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#0A3D91] disabled:opacity-0"
          >
            ← Back
          </button>
          {!isMandatory && (
            <button 
              onClick={handleSkip} 
              disabled={isAdvancing}
              className="px-3 md:px-4 py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 disabled:opacity-50"
            >
              {step === QUESTIONS.length - 1 ? 'Finish' : 'Skip'}
            </button>
          )}
        </footer>

        {showExitConfirm && !isMandatory && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[110] flex flex-col items-center justify-center p-10 text-center">
             <h4 className="text-2xl font-black text-[#0F172A] mb-4">Abandon Vibe Check?</h4>
             <p className="text-sm text-gray-500 mb-10 max-w-xs">Your progress will be lost.</p>
             <div className="flex flex-col gap-3 w-full">
                <M3Button variant="filled" fullWidth onClick={() => setShowExitConfirm(false)}>Resume</M3Button>
                <M3Button variant="text" fullWidth className="!text-red-500" onClick={onClose}>Discard</M3Button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VibeModal;
