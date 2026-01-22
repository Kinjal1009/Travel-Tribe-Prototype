
import React, { useState } from 'react';
import { M3Button, M3Card } from '../components/ui/M3Components';
import { KycStatus } from '../types';

interface KycProps {
  currentStatus: KycStatus;
  onVerify: (status: KycStatus) => void;
  onBack: () => void;
}

const ID_OPTIONS = ['Aadhaar Card', 'Passport', 'Driving License', 'Voter ID'];

const Kyc: React.FC<KycProps> = ({ currentStatus, onVerify, onBack }) => {
  const [id1, setId1] = useState(ID_OPTIONS[0]);
  const [id2, setId2] = useState(ID_OPTIONS[1]);
  const [uploads, setUploads] = useState<Record<string, boolean>>({
    id1Front: false,
    id1Back: false,
    id2Front: false,
    id2Back: false
  });
  const [loading, setLoading] = useState(false);

  const isAlreadySubmitted = currentStatus === KycStatus.PENDING || currentStatus === KycStatus.VERIFIED || currentStatus === KycStatus.UNDER_REVIEW;

  const handleUpload = (key: string) => {
    if (isAlreadySubmitted) return;
    setUploads(prev => ({ ...prev, [key]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isAlreadySubmitted) return;
    setLoading(true);
    setTimeout(() => {
      onVerify(KycStatus.PENDING);
      setLoading(false);
    }, 1500);
  };

  const isFormValid = Object.values(uploads).every(v => v) && id1 !== id2;

  if (isAlreadySubmitted) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-6 bg-[#F8FAFF]">
        <div className="bg-white w-full max-w-xl p-12 rounded-[3.5rem] border border-gray-100 shadow-2xl text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
             {currentStatus === KycStatus.VERIFIED ? (
               <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
             ) : (
               <svg className="w-10 h-10 text-[#0A3D91] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
             )}
          </div>
          <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase mb-4">
            {currentStatus === KycStatus.VERIFIED ? 'Identity Verified' : 'KYC Submitted'}
          </h2>
          <p className="text-sm text-gray-500 mb-10 max-w-xs mx-auto leading-relaxed">
            {currentStatus === KycStatus.VERIFIED 
              ? 'Your identity has been successfully verified. You now have full access to opt-in and join expeditions.'
              : 'Our safety desk is verifying your documents. This usually takes 2-4 hours. You will be notified once approved.'}
          </p>
          <M3Button fullWidth onClick={onBack}>Back to Profile</M3Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-6 bg-[#F8FAFF]">
      <div className="bg-white w-full max-w-xl p-10 md:p-14 rounded-[3.5rem] border border-gray-100 shadow-2xl page-transition">
        <div className="mb-10 text-center md:text-left flex items-start gap-4">
          <button onClick={onBack} className="mt-1 p-2 text-gray-400 hover:text-[#0A3D91] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#0A3D91] font-black">Identity Shield</span>
            <h2 className="text-3xl font-black mt-2 text-[#0F172A] tracking-tighter uppercase italic">KYC Verification</h2>
            <p className="text-gray-400 mt-4 leading-relaxed font-medium text-xs">
              Travel Tribe is identity-first. Upload two national IDs to join your first tribe.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-8">
            {/* ID 1 Section */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-[0.2em] text-gray-400 ml-2 font-black">National ID #1</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm text-[#0F172A] outline-none"
                  value={id1}
                  onChange={(e) => setId1(e.target.value)}
                >
                  {ID_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <UploadBox label="Front Image" isDone={uploads.id1Front} onClick={() => handleUpload('id1Front')} />
                <UploadBox label="Back Image" isDone={uploads.id1Back} onClick={() => handleUpload('id1Back')} />
              </div>
            </div>

            {/* ID 2 Section */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-[0.2em] text-gray-400 ml-2 font-black">National ID #2</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm text-[#0F172A] outline-none"
                  value={id2}
                  onChange={(e) => setId2(e.target.value)}
                >
                  {ID_OPTIONS.map(opt => <option key={opt} value={opt} disabled={opt === id1}>{opt}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <UploadBox label="Front Image" isDone={uploads.id2Front} onClick={() => handleUpload('id2Front')} />
                <UploadBox label="Back Image" isDone={uploads.id2Back} onClick={() => handleUpload('id2Back')} />
              </div>
            </div>
          </div>

          {id1 === id2 && (
             <p className="text-[9px] font-black text-red-600 uppercase tracking-widest text-center italic">Please select two different identification documents.</p>
          )}

          <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl space-y-2">
            <div className="flex items-center gap-3">
               <span className="text-[8px] font-black text-[#0A3D91] uppercase tracking-widest">✓ Encrypted Storage Protocol</span>
            </div>
            <div className="flex items-center gap-3">
               <span className="text-[8px] font-black text-[#0A3D91] uppercase tracking-widest">✓ Verification within 4 hours</span>
            </div>
          </div>

          <button 
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full bg-[#0A3D91] text-white font-black p-6 rounded-[2rem] flex items-center justify-center space-x-4 hover:bg-[#2563EB] transition-all disabled:opacity-50 text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95"
          >
            {loading ? 'Processing Documents...' : 'Submit Verification Pack'}
          </button>
        </form>
      </div>
    </div>
  );
};

const UploadBox: React.FC<{ label: string; isDone: boolean; onClick: () => void }> = ({ label, isDone, onClick }) => (
  <div 
    onClick={onClick}
    className={`aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all cursor-pointer group ${
      isDone ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-[#0A3D91]/30 hover:bg-white'
    }`}
  >
    {isDone ? (
      <>
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white mb-2 shadow-sm animate-in zoom-in duration-300">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
        </div>
        <span className="text-[8px] font-black text-green-700 uppercase tracking-widest">Uploaded</span>
      </>
    ) : (
      <>
        <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-2 group-hover:scale-110 transition-transform">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
        </div>
        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center">{label}</span>
      </>
    )}
  </div>
);

export default Kyc;
