
import React, { useState } from 'react';
// Corrected import from SocialLinks to SocialProfiles
import { Trip, User, SocialProfiles } from '../types';

interface JoinOnboardingProps {
  trip: Trip;
  user: User;
  // Corrected parameter type to SocialProfiles
  onComplete: (socialLinks?: SocialProfiles, hasVideo?: boolean) => void;
}

const JoinOnboarding: React.FC<JoinOnboardingProps> = ({ trip, user, onComplete }) => {
  const [step, setStep] = useState(1);
  // Updated usage of SocialLinks to SocialProfiles and user.socialLinks to user.socialProfiles
  const [socials, setSocials] = useState<SocialProfiles>(user.socialProfiles || {});
  const [hasVideo, setHasVideo] = useState(false);
  const [recording, setRecording] = useState(false);

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else {
      onComplete(socials, hasVideo);
    }
  };

  const handleMockRecord = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setHasVideo(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-6 bg-[#F8FAFF]">
      <div className="bg-white w-full max-w-2xl p-12 rounded-[3.5rem] border border-gray-100 shadow-2xl relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gray-50">
          <div 
            className="h-full bg-[#0A3D91] transition-all duration-700 rounded-full shadow-[0_0_10px_rgba(10,61,145,0.3)]" 
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>

        {step === 1 ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center">
              <span className="text-[11px] uppercase tracking-[0.4em] text-[#0A3D91] font-black">Milestone 1 of 2</span>
              <h2 className="text-4xl font-black mt-3 text-[#0F172A] tracking-tighter">Social Blueprint</h2>
              <p className="text-gray-400 mt-4 text-xs font-black uppercase tracking-widest">Build trust through verified social presence</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { label: 'LinkedIn', key: 'linkedin', placeholder: 'linkedin.com/in/user' },
                { label: 'Instagram', key: 'instagram', placeholder: '@handle' },
                { label: 'Facebook', key: 'facebook', placeholder: 'fb.com/user' },
                { label: 'X / Twitter', key: 'twitter', placeholder: '@handle' }
              ].map((item: any) => (
                <div key={item.key} className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 ml-2 font-black">{item.label}</label>
                  <input 
                    type="text" 
                    value={(socials as any)[item.key] || ''}
                    onChange={(e) => setSocials({ ...socials, [item.key]: e.target.value })}
                    placeholder={item.placeholder}
                    className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl text-sm font-bold text-[#0F172A] focus:bg-white focus:border-[#0A3D91] outline-none transition-all" 
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-6 pt-6">
              <button 
                onClick={() => setStep(2)}
                className="flex-1 text-gray-400 font-black py-5 rounded-[2rem] hover:bg-gray-50 transition-all text-[10px] uppercase tracking-[0.3em] border border-gray-100 shadow-sm"
              >
                Skip Phase
              </button>
              <button 
                onClick={handleNext}
                className="flex-[2] bg-[#0A3D91] hover:bg-[#2563EB] text-white font-black py-5 rounded-[2rem] transition-all shadow-2xl shadow-blue-900/30 uppercase text-[10px] tracking-[0.3em] active:scale-95"
              >
                Continue Setup
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center">
              <span className="text-[11px] uppercase tracking-[0.4em] text-[#0A3D91] font-black">Milestone 2 of 2</span>
              <h2 className="text-4xl font-black mt-3 text-[#0F172A] tracking-tighter">Human Intro</h2>
              <p className="text-gray-400 mt-4 text-xs font-black uppercase tracking-widest">Connect with your tribe before take-off</p>
            </div>

            <div className="aspect-video w-full rounded-[3rem] bg-gray-50 border-4 border-dashed border-gray-100 flex flex-col items-center justify-center p-12 text-center group hover:border-[#0A3D91]/30 transition-all shadow-inner">
              {hasVideo ? (
                <div className="space-y-6">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-green-500 flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <p className="text-sm font-black text-green-600 uppercase tracking-widest">Intro Bio Captured!</p>
                  <button onClick={() => setHasVideo(false)} className="text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors tracking-widest border-b border-gray-200">Reset Capture</button>
                </div>
              ) : recording ? (
                <div className="space-y-6">
                  <div className="w-10 h-10 rounded-full bg-red-600 animate-ping mx-auto shadow-[0_0_30px_rgba(220,38,38,0.4)]" />
                  <p className="text-sm font-black text-red-600 animate-pulse uppercase tracking-[0.3em]">Recording in Progress...</p>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-gray-200/50 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-[#0A3D91]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  </div>
                  <div className="flex flex-col gap-4 w-full max-w-xs">
                    <button 
                      onClick={handleMockRecord}
                      className="w-full bg-[#0A3D91] text-white font-black py-4 rounded-2xl hover:bg-[#2563EB] transition-all text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-900/20 active:scale-95"
                    >
                      Record 60s Intro
                    </button>
                    <button className="w-full bg-white text-gray-400 font-black py-4 rounded-2xl hover:text-[#0A3D91] transition-all text-[10px] uppercase tracking-[0.2em] border border-gray-100 shadow-sm active:scale-95">
                      Upload File
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="p-8 bg-[#0A3D91]/5 border border-blue-100 rounded-[2.5rem] shadow-inner">
              <p className="text-[10px] text-[#0A3D91] text-center italic font-black uppercase tracking-widest leading-relaxed">
                Privacy Guard: Introduction videos are exclusive to trip members. 
                They help establish familiarity and comfort within the expedition group.
              </p>
            </div>

            <div className="flex gap-6 pt-6">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 text-gray-400 font-black py-5 rounded-[2rem] hover:bg-gray-50 transition-all text-[10px] uppercase tracking-[0.3em] border border-gray-100 shadow-sm"
              >
                Back
              </button>
              <button 
                onClick={handleNext}
                className="flex-[2] bg-[#0A3D91] hover:bg-[#2563EB] text-white font-black py-5 rounded-[2rem] transition-all shadow-2xl shadow-blue-900/30 uppercase text-[10px] tracking-[0.3em] active:scale-95"
              >
                {hasVideo ? 'Seal Profile' : 'Finalize Profile'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinOnboarding;
