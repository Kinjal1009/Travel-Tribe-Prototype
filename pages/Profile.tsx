
import React, { useState } from 'react';
import { User, KycStatus, Gender } from '../types';
import { M3Card, M3Button } from '../components/ui/M3Components';
import { getTierColor } from '../lib/trustEngine';
import { SEED_VERSION } from '../lib/mockData';

interface ProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onResetDemoData: () => void;
  onClearStorage: () => void;
  onResetVibe: () => void;
  onNavigate: (page: string) => void;
}

const DEFAULT_AVATARS = {
  Male: 'https://api.dicebear.com/7.x/avataaars/svg?seed=male_default',
  Female: 'https://api.dicebear.com/7.x/avataaars/svg?seed=female_default',
  Other: 'https://api.dicebear.com/7.x/avataaars/svg?seed=neutral_default',
  'Prefer not to say': 'https://api.dicebear.com/7.x/avataaars/svg?seed=neutral_default'
};

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onLogout, onResetDemoData, onClearStorage, onResetVibe, onNavigate }) => {
  const isVerified = user.kycStatus === KycStatus.VERIFIED;
  const isOrganizer = user.userRole === 'ORGANIZER';
  const isDemoUser = user.id === 'user_vishnu' || user.id === 'demo-vishnu' || user.id === 'user_vishnu_001';

  const handleGenderChange = (newGender: Gender) => {
    let newAvatar = user.avatarUrl;
    // Fix: replaced profilePhotoUrl with avatarUrl and added check for default avatars
    if (!user.avatarUrl || user.avatarUrl.includes('dicebear.com')) {
      newAvatar = DEFAULT_AVATARS[newGender] || DEFAULT_AVATARS.Other;
    }
    onUpdateUser({ ...user, gender: newGender, avatarUrl: newAvatar });
  };

  const menuItems = [
    { label: 'Edit Profile', icon: '👤', id: 'edit-profile' },
    { label: 'KYC Verification', icon: '🛡️', id: 'kyc' },
    { label: 'Emergency Contact', icon: '🚨', id: 'emergency-contact' },
    { label: 'Payment Methods', icon: '💳', id: 'payment-methods' },
    { label: 'Help & Support', icon: '💬', id: 'help-support' },
    { label: 'About Travel Tribe', icon: 'ℹ️', id: 'about' },
  ];

  const getKycStatusLabel = () => {
    switch (user.kycStatus) {
      case KycStatus.VERIFIED: return 'Completed ✅';
      case KycStatus.PENDING: return 'Verification Pending ⏳';
      case KycStatus.UNDER_REVIEW: return 'Under Review 🔍';
      default: return 'Not completed';
    }
  };

  return (
    <div className="pt-20 pb-32 px-4 space-y-6 max-w-2xl mx-auto w-full page-transition">
      <section className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
            <img src={user.avatarUrl} className="w-full h-full object-cover" alt={user.name} />
          </div>
          {isVerified && (
            <div className="absolute bottom-0 right-0 bg-green-600 p-1.5 rounded-full border-2 border-white shadow-sm">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
              </svg>
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-black text-[#1B1B1F] tracking-tight">
                {isOrganizer ? user.organizerName : user.name}
            </h2>
            {isDemoUser && (
              <span className="bg-[#0A3D91] text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Demo User</span>
            )}
          </div>
          {isOrganizer && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest -mt-1">{user.name} (Lead Representative)</p>}
          <div className={`text-[10px] font-black uppercase tracking-[0.2em] mt-2 ${isVerified ? 'text-green-600' : 'text-amber-600'}`}>
            KYC Status: {getKycStatusLabel()}
          </div>
        </div>
      </section>

      {/* Trust Score Section - Hidden Individual Score */}
      <M3Card variant="elevated" className="p-8 bg-gradient-to-br from-[#0A3D91] to-[#001A40] text-white">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Community Reputation</h3>
            <p className="text-2xl font-black tracking-tight mt-2 uppercase italic">{isVerified ? 'Verified Explorer' : 'Identity Not Verified'}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest mt-4 opacity-50">
              Trusted Member of the Travel Tribe
            </p>
          </div>
          <div className="w-20 h-20 rounded-full border-4 border-white/10 flex items-center justify-center">
             <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </div>
        </div>
      </M3Card>

      {/* Developer Controls Section */}
      <M3Card variant="outlined" className="p-8 border-dashed border-blue-200 bg-blue-50/20">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#0A3D91] mb-4">Account & Vibe Controls</h3>
        <div className="flex flex-col gap-3">
          <M3Button variant="tonal" fullWidth className="!h-10 text-[9px] !text-red-600" onClick={onResetVibe}>Reset Vibe Profile</M3Button>
          <div className="flex gap-3">
            <M3Button variant="tonal" fullWidth className="!h-10 text-[9px]" onClick={onResetDemoData}>Reset Demo Data</M3Button>
            <M3Button variant="outlined" fullWidth className="!h-10 text-[9px] !border-red-200 !text-red-600" onClick={onClearStorage}>Clear Storage</M3Button>
          </div>
          <p className="text-[9px] text-gray-400 font-medium leading-relaxed text-center">
            "Reset Vibe Profile" will force a mandatory check on next login.
          </p>
        </div>
      </M3Card>

      <section className="space-y-2">
        <M3Card variant="outlined" className="p-0">
          {menuItems.map((item, i) => (
            <button 
              key={i} 
              onClick={() => {
                onNavigate(item.id);
              }}
              className="w-full flex items-center justify-between p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group"
            >
              <span className="flex items-center gap-4 text-sm font-bold text-[#1B1B1F] group-hover:text-[#0A3D91] transition-colors">
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                {item.id === 'kyc' && user.kycStatus === KycStatus.PENDING && (
                  <span className="text-[7px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">Pending</span>
                )}
                <svg className="w-4 h-4 text-gray-400 group-hover:text-[#0A3D91] transition-all group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </M3Card>

        <M3Button variant="text" fullWidth className="text-red-600 mt-4 h-14" onClick={onLogout}>
          Sign Out
        </M3Button>
      </section>

      <footer className="text-center pt-8">
        <div className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em]">TRAVEL TRIBE TECHNOLOGIES PVT LTD</div>
        <div className="text-[8px] font-bold text-gray-400 uppercase mt-2">v{SEED_VERSION}</div>
      </footer>
    </div>
  );
};

export default Profile;
