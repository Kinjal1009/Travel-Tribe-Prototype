
import React, { useState } from 'react';
import { User, Gender } from '../types';
import { INDIAN_CITIES } from '../lib/mockData';
import { isValidDDMMYYYY, fromISODate, toISODate } from '../lib/dateUtils';
import { M3Button, M3Card, M3DatePicker } from '../components/ui/M3Components';

interface EditProfileProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onBack: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ user, onSave, onBack }) => {
  // Fix: Explicitly typed formData to ensure gender is of type Gender
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    dob: string;
    gender: Gender;
    homeCity: string;
    email: string;
    phone: string;
  }>({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    dob: user.dob ? fromISODate(user.dob) : '',
    gender: user.gender || 'Prefer not to say',
    homeCity: user.homeCity || '',
    email: user.email || '',
    phone: user.phone || ''
  });
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First and Last Name are required');
      return;
    }
    
    // Check validity but we expect the picker to handle the input format
    if (formData.dob && !isValidDDMMYYYY(formData.dob)) {
      setError('Check Date of Birth format (DD/MM/YYYY)');
      return;
    }

    onSave({
      ...user,
      firstName: formData.firstName,
      lastName: formData.lastName,
      name: `${formData.firstName} ${formData.lastName}`,
      dob: formData.dob ? toISODate(formData.dob) : user.dob,
      gender: formData.gender,
      homeCity: formData.homeCity,
      email: formData.email,
      phone: formData.phone
    });
  };

  return (
    <div className="pt-24 pb-32 px-4 max-w-xl mx-auto w-full page-transition">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 text-gray-400 hover:text-[#0A3D91] transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic">Edit Profile</h1>
      </div>

      <M3Card variant="outlined" className="p-8">
        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 animate-in shake-in">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">First Name</label>
              <input 
                required 
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#0A3D91]" 
                value={formData.firstName} 
                onChange={e => setFormData({...formData, firstName: e.target.value})} 
                placeholder="Jane" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Last Name</label>
              <input 
                required 
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#0A3D91]" 
                value={formData.lastName} 
                onChange={e => setFormData({...formData, lastName: e.target.value})} 
                placeholder="Doe" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Date of Birth (DD/MM/YYYY)</label>
            <M3DatePicker 
              required
              className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#0A3D91]"
              value={formData.dob}
              maxDate={new Date().toISOString()}
              onChange={val => setFormData({...formData, dob: val})}
              placeholder="DD/MM/YYYY"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Gender</label>
              <select 
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#0A3D91] appearance-none" 
                value={formData.gender} 
                onChange={e => setFormData({...formData, gender: e.target.value as Gender})}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Home City</label>
              <select 
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#0A3D91] appearance-none" 
                value={formData.homeCity} 
                onChange={e => setFormData({...formData, homeCity: e.target.value})}
              >
                <option value="">Select City</option>
                {INDIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Email Address</label>
            <input 
              required 
              type="email" 
              className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#0A3D91]" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              placeholder="your@email.com" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Phone Number</label>
            <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">+91</span>
               <input 
                required 
                className="w-full bg-gray-50 border border-gray-100 p-4 pl-12 rounded-2xl text-sm font-bold outline-none focus:border-[#0A3D91]" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                placeholder="9876543210" 
              />
            </div>
          </div>

          <M3Button type="submit" fullWidth className="!h-16 mt-4 shadow-xl shadow-blue-900/10">Save Changes</M3Button>
        </form>
      </M3Card>
    </div>
  );
};

export default EditProfile;
