import React, { useState, useEffect } from 'react';
import { Currency, KycStatus, User, Trip, AppNotification } from '../types';
import { CURRENCY_LIST } from '../lib/currency';
import { db } from '../lib/mockDb';
import NotificationPanel from './NotificationPanel';

interface TopAppBarProps {
  title: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: User | null;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  activeTrip: Trip | null;
}

const TopAppBar: React.FC<TopAppBarProps> = ({ 
  title, activeTab, onTabChange, user, currency, onCurrencyChange, activeTrip
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (user) {
      const updateNotifs = () => {
        setNotifications(db.getNotifications());
      };
      updateNotifs();
      const interval = setInterval(updateNotifs, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const navLinks = [
    { id: 'home', label: 'Explore' },
    { id: 'about', label: 'About' },
    { id: 'initiate-trip', label: 'Create Trip' },
    { id: 'my-trips', label: 'My Trips' },
    { id: 'contact', label: 'Contact Us' },
  ];

  const getKycBadge = (status: KycStatus) => {
    const isVerified = status === KycStatus.VERIFIED;
    return (
      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
        isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
      }`}>
        {isVerified ? 'COMPLETED' : 'NOT COMPLETED'}
      </span>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="sticky top-0 z-[100] w-full flex flex-col">
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-gray-100 flex justify-center shadow-sm w-full pt-[env(safe-area-inset-top)]">
        <div className="w-full max-w-7xl flex items-center px-4 md:px-8 h-full">
          <div 
            className="text-xl font-black tracking-tighter text-[#0A3D91] cursor-pointer mr-8 shrink-0"
            onClick={() => onTabChange('home')}
          >
            Travel Tribe
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onTabChange(link.id)}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === link.id || (link.id === 'home' && activeTab === 'search-results')
                    ? 'text-[#0A3D91] bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 ml-auto">
            {/* Currency Switcher */}
            <div className="relative group hidden sm:block">
              <style>{`
                select {
                  -webkit-appearance: none;
                  -moz-appearance: none;
                  appearance: none;
                }
              `}</style>
              <select 
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value as Currency)}
                className="bg-gray-50 border border-gray-100 text-[#0A3D91] text-[10px] font-black uppercase tracking-widest rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:bg-white transition-all appearance-none pr-6"
              >
                {CURRENCY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#0A3D91]">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            {/* Notification Bell Icon */}
            {user && (
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-400 hover:text-[#0A3D91] transition-colors relative"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[7px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationPanel 
                    notifications={notifications} 
                    onClose={() => setShowNotifications(false)} 
                    onNotificationClick={(n) => {
                      setShowNotifications(false);
                      onTabChange(`deep-link-${n.id}`);
                    }}
                  />
                )}
              </div>
            )}

            {!user ? (
              <div className="flex items-center gap-2">
                {activeTab !== 'auth' && (
                  <button 
                    className="h-9 px-6 text-xs bg-[#0A3D91] text-white rounded-full font-black uppercase tracking-widest active:scale-95 transition-all shadow-md" 
                    onClick={() => onTabChange('auth')}
                  >
                    Sign In
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:flex flex-col items-end">
                  <span className="text-xs font-black text-gray-900 leading-none mb-1">{user.name}</span>
                  {getKycBadge(user.kycStatus)}
                </div>
                <button 
                  onClick={() => onTabChange('profile')}
                  className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 overflow-hidden shadow-sm active:scale-95 transition-transform"
                >
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default TopAppBar;