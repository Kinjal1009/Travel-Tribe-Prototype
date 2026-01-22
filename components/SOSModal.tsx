import React, { useState, useEffect } from 'react';
import { Trip, User } from '../types';
import { M3Button } from './ui/M3Components';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
  user: User | null;
  onAddContact?: () => void;
}

type SOSStep = 'confirm' | 'calling' | 'success';

interface CallingStep {
  label: string;
  status: 'idle' | 'calling' | 'connected';
}

const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose, trip, user, onAddContact }) => {
  const [step, setStep] = useState<SOSStep>('confirm');
  const [callingSteps, setCallingSteps] = useState<CallingStep[]>([
    { label: `Emergency Contact (${user?.emergencyContact?.name || 'Guardian'})`, status: 'idle' },
    { label: 'TRAVEL TRIBE Support Desk', status: 'idle' },
    { label: 'Local Police Control Room (100)', status: 'idle' },
  ]);

  useEffect(() => {
    if (!isOpen) {
      setStep('confirm');
      setCallingSteps([
        { label: `Emergency Contact (${user?.emergencyContact?.name || 'Guardian'})`, status: 'idle' },
        { label: 'TRAVEL TRIBE Support Desk', status: 'idle' },
        { label: 'Local Police Control Room (100)', status: 'idle' },
      ]);
    }
  }, [isOpen, user]);

  const runStepper = async () => {
    setStep('calling');
    
    for (let i = 0; i < callingSteps.length; i++) {
      setCallingSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'calling' } : s));
      await new Promise(r => setTimeout(r, 1200));
      setCallingSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'connected' } : s));
      await new Promise(r => setTimeout(r, 600));
    }
    
    await new Promise(r => setTimeout(r, 500));
    setStep('success');
  };

  if (!isOpen) return null;

  const hasContact = !!user?.emergencyContact?.phone;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-[#001A40]/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white max-w-lg w-full p-10 md:p-14 rounded-[3.5rem] border border-red-100 shadow-2xl relative overflow-hidden transition-all duration-500">
        <div className={`absolute top-0 left-0 h-1.5 bg-red-600 transition-all duration-[6000ms] ease-linear ${step === 'calling' ? 'w-full' : 'w-0'}`} />
        
        {step === 'confirm' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
              <svg className="w-10 h-10 text-red-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black mb-4 text-[#0F172A] tracking-tighter uppercase">Initiate SOS?</h2>
            <p className="text-sm text-gray-500 mb-10 max-w-xs mx-auto leading-relaxed">
              This will immediately notify your emergency contact, the TRAVEL TRIBE safety desk, and nearby travelers.
            </p>

            <div className="space-y-4">
              <M3Button variant="error" fullWidth className="!h-20 !rounded-[2rem] shadow-2xl shadow-red-900/20" onClick={runStepper}>
                CONFIRM EMERGENCY
              </M3Button>
              <M3Button variant="text" fullWidth onClick={onClose} className="!text-gray-400">
                Cancel
              </M3Button>
            </div>
          </div>
        )}

        {step === 'calling' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center mb-10">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                 <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 005.516 5.516l.773-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
              </div>
              <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter italic">Broadcasting Alerts...</h3>
            </div>
            
            <div className="space-y-4">
              {callingSteps.map((s, i) => (
                <div key={i} className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${s.status === 'connected' ? 'bg-green-50 border-green-100 scale-105' : s.status === 'calling' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100 opacity-40'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${s.status === 'connected' ? 'text-green-700' : s.status === 'calling' ? 'text-red-700' : 'text-gray-400'}`}>{s.label}</span>
                  {s.status === 'calling' && <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />}
                  {s.status === 'connected' && <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center animate-in zoom-in duration-500">
             <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
             </div>
             <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase mb-4">Shield Active</h2>
             <p className="text-sm text-gray-500 mb-10 max-w-xs mx-auto leading-relaxed">
               All emergency channels have been notified. Our safety lead is tracking your live location via trip coordination protocols.
             </p>
             <M3Button fullWidth className="!h-16 !rounded-2xl" onClick={onClose}>Understood</M3Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOSModal;