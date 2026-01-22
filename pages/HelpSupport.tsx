
import React, { useState } from 'react';
import { User } from '../types';
import { M3Button, M3Card } from '../components/ui/M3Components';

interface HelpSupportProps {
  user: User;
  onSubmit: (data: { email: string; message: string }) => void;
  onBack: () => void;
}

const HelpSupport: React.FC<HelpSupportProps> = ({ user, onSubmit, onBack }) => {
  const [formData, setFormData] = useState({
    email: user.email || '',
    message: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email.includes('@')) {
      setError('Valid email required');
      return;
    }
    if (formData.message.length < 10) {
      setError('Message must be at least 10 characters');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="pt-24 pb-32 px-4 max-w-xl mx-auto w-full page-transition">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 text-gray-400 hover:text-[#0A3D91]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic">Help & Support</h1>
      </div>

      <M3Card variant="outlined" className="p-8">
        <div className="mb-10">
           <span className="text-[10px] font-black text-[#0A3D91] uppercase tracking-[0.3em]">Support Desk</span>
           <p className="text-xs text-gray-400 font-medium mt-2 leading-relaxed">Having trouble with a booking or a tribe member? Report it below. Our safety dispatch team responds within 120 minutes.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100">{error}</div>}

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Contact Email</label>
            <input required type="email" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#0A3D91]" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="your@email.com" />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Issue / Message</label>
            <textarea required minLength={10} rows={5} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#0A3D91] resize-none" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="Describe your issue in detail..." />
          </div>

          <M3Button type="submit" fullWidth className="!h-16 mt-4 shadow-blue-900/30">Submit Request</M3Button>
        </form>
      </M3Card>
    </div>
  );
};

export default HelpSupport;
