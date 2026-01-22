import React, { useState } from 'react';
import { M3Button } from './ui/M3Components';
import { SocialProfiles } from '../types';

interface OptInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (socials: SocialProfiles, hasVideo: boolean) => void;
}

const OptInModal: React.FC<OptInModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [socials, setSocials] = useState<SocialProfiles>({});
  const [hasVideo, setHasVideo] = useState(false);
  const [recording, setRecording] = useState(false);

  if (!isOpen) return null;

  const handleMockRecord = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setHasVideo(true);
    }, 2000);
  };

  const handleFinalSubmit = () => {
    onSubmit(socials, hasVideo);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#001A40]/40 backdrop-blur-md">
      <div className="bg-white max-w-lg w-full p-10 md:p-14 rounded-[3.5rem] shadow-2xl border border-gray-100 relative overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 h-2 bg-blue-50 w-full">
            <div className={`h-full bg-[#0A3D91] transition-all duration-500 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
        </div>

        <button onClick={onClose} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <span className="text-[10px] font-black text-[#0A3D91] uppercase tracking-[0.3em]">Step 1 of 3</span>
              <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter mt-2">Social Proof</h2>
              <p className="text-sm text-gray-400 font-medium mt-2">Linking socials increases approval rates by 40%.</p>
            </div>

            <div className="space-y-4">
              {['Linkedin', 'Instagram', 'Facebook', 'Twitter'].map(key => (
                <div key={key} className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">{key}</label>
                  <input 
                    placeholder={`e.g. ${key.toLowerCase()}.com/user`}
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-[#0F172A] outline-none focus:border-[#0A3D91]"
                    value={(socials as any)[key.toLowerCase()] || ''}
                    onChange={(e) => setSocials({...socials, [key.toLowerCase()]: e.target.value})}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-4">
               <M3Button variant="tonal" className="flex-1" onClick={() => setStep(2)}>Skip</M3Button>
               <M3Button className="flex-[2]" onClick={() => setStep(2)}>Continue</M3Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <span className="text-[10px] font-black text-[#0A3D91] uppercase tracking-[0.3em]">Step 2 of 3</span>
              <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter mt-2">Human Intro</h2>
              <p className="text-sm text-gray-400 font-medium mt-2">A quick 30s video helps the tribe get to know you.</p>
            </div>

            <div className="aspect-video bg-gray-50 rounded-[2.5rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center p-10 text-center group">
               {hasVideo ? (
                 <div className="space-y-4">
                   <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white shadow-xl">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                   </div>
                   <p className="text-sm font-black text-green-600 uppercase tracking-widest">Video Captured</p>
                 </div>
               ) : recording ? (
                 <div className="space-y-6">
                    <div className="w-12 h-12 bg-red-600 rounded-full animate-ping mx-auto" />
                    <p className="text-xs font-black text-red-600 uppercase tracking-[0.2em]">Recording...</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                    <button onClick={handleMockRecord} className="bg-[#0A3D91] text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Record Intro</button>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Skip allowed, but not recommended</p>
                 </div>
               )}
            </div>

            <div className="flex gap-4">
              <M3Button variant="tonal" className="flex-1" onClick={() => setStep(1)}>Back</M3Button>
              <M3Button className="flex-[2]" onClick={() => setStep(3)}>Continue to Review</M3Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div>
              <span className="text-[10px] font-black text-[#0A3D91] uppercase tracking-[0.3em]">Step 3 of 3</span>
              <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter mt-2">Review & Submit</h2>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4">
               <div>
                  <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Linked Presence</h4>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {Object.values(socials).filter(v => v).length > 0 ? (
                      Object.entries(socials).map(([k, v]) => v && <span key={k} className="text-[10px] font-bold text-[#0A3D91] bg-blue-50 px-2 py-1 rounded capitalize">{k}</span>)
                    ) : <span className="text-[10px] font-bold text-gray-400">None provided</span>}
                  </div>
               </div>
               <div>
                  <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Video Bio</h4>
                  <div className="mt-1">
                    <span className={`text-[10px] font-bold ${hasVideo ? 'text-green-600' : 'text-gray-400'}`}>{hasVideo ? 'Ready to share ✅' : 'Skipped'}</span>
                  </div>
               </div>
            </div>

            <div className="flex gap-4">
               <M3Button variant="tonal" className="flex-1" onClick={() => setStep(2)}>Back</M3Button>
               <M3Button className="flex-[2]" onClick={handleFinalSubmit}>Send Request</M3Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptInModal;