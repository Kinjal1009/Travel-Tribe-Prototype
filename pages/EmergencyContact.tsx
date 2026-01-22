
import React, { useState } from 'react';
import { User, EmergencyContact as IEmergencyContact } from '../types';
import { M3Button, M3Card } from '../components/ui/M3Components';

interface EmergencyContactProps {
  user: User;
  onSave: (contact: IEmergencyContact) => void;
  onBack: () => void;
}

const EmergencyContact: React.FC<EmergencyContactProps> = ({ user, onSave, onBack }) => {
  const [formData, setFormData] = useState<IEmergencyContact>(user.emergencyContact || {
    name: '',
    phone: '',
    relationship: ''
  });
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.relationship.trim() || !formData.phone.trim()) {
      setError('All fields are required');
      return;
    }
    if (formData.phone.length < 10) {
      setError('Invalid phone number');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="pt-24 pb-32 px-4 max-w-xl mx-auto w-full page-transition">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 text-gray-400 hover:text-[#0A3D91]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic">Emergency Contact</h1>
      </div>

      <M3Card variant="outlined" className="p-8">
        <form onSubmit={handleSave} className="space-y-6">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100">{error}</div>}
          
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Contact Name</label>
            <input required className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#0A3D91]" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Relationship</label>
            <input required className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#0A3D91]" value={formData.relationship} onChange={e => setFormData({...formData, relationship: e.target.value})} placeholder="e.g. Mother, Father, Friend" />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Phone Number (+91)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">+91</span>
              <input required className="w-full bg-gray-50 border border-gray-100 p-4 pl-12 rounded-2xl text-sm font-bold outline-none focus:border-[#0A3D91]" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} placeholder="9876543210" />
            </div>
          </div>

          <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl">
            <p className="text-[9px] text-[#0A3D91] font-black uppercase tracking-widest leading-relaxed">
              This contact will be shared with the trip initiator and Travel Tribe safety desk during your expeditions.
            </p>
          </div>

          <M3Button type="submit" fullWidth className="!h-16">Save Contact</M3Button>
        </form>
      </M3Card>
    </div>
  );
};

export default EmergencyContact;
