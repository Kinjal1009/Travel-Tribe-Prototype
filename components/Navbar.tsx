import React, { useState } from 'react';
import { User, KycStatus } from '../types';

interface NavbarProps {
  user: User | null;
  onNavigate: (page: string, params?: any) => void;
  onLogout: () => void;
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = ({ user, onNavigate, onLogout, currentPage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getKycColor = (status: KycStatus) => {
    switch (status) {
      case KycStatus.VERIFIED: return 'text-green-600';
      case KycStatus.UNDER_REVIEW: return 'text-amber-600';
      default: return 'text-amber-600';
    }
  };

  const getKycLabel = (status: KycStatus) => {
    switch (status) {
      case KycStatus.VERIFIED: return 'COMPLETED';
      default: return 'NOT COMPLETED';
    }
  };

  const navLinks = [
    { label: 'Explore', id: 'home' },
    { label: 'Create Trip', id: 'initiate-trip' },
    { label: 'My Trips', id: 'my-trips' },
    { label: 'Contact Us', id: 'contact' },
  ];

  const handleNav = (id: string, params?: any) => {
    onNavigate(id, params);
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 h-16 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>

        <div 
          className="text-xl font-bold tracking-tight cursor-pointer text-[#0A3D91]"
          onClick={() => handleNav('home')}
        >
          Travel Tribe
        </div>
      </div>
      
      {/* Desktop Links */}
      <nav className="hidden md:flex items-center space-x-1">
        {navLinks.map((link) => (
          <button 
            key={link.id}
            onClick={() => handleNav(link.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              currentPage === link.id || (link.id === 'home' && currentPage === 'search-results')
                ? 'bg-blue-50 text-[#0A3D91]' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-[#0A3D91]'
            }`}
          >
            {link.label}
          </button>
        ))}
      </nav>

      {/* User Auth Section */}
      <div className="flex items-center gap-2">
        {user ? (
          <div className="flex items-center gap-3">
            <div 
              className="text-right hidden sm:block cursor-pointer"
              onClick={() => handleNav('profile')}
            >
              <div className="text-sm font-semibold text-gray-900 leading-none">{user.name}</div>
              <div className={`text-[10px] font-bold mt-1 ${getKycColor(user.kycStatus)}`}>
                KYC: {getKycLabel(user.kycStatus)}
              </div>
            </div>
            <button 
              onClick={() => handleNav('profile')}
              className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 overflow-hidden shadow-sm active:scale-95 transition-transform"
            >
              <img 
                src={user.avatarUrl} 
                alt={user.name} 
              />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleNav('auth', { mode: 'login' })}
              className="px-6 py-2 text-sm font-semibold bg-[#0A3D91] text-white rounded-full shadow-sm hover:shadow-md hover:bg-blue-800 transition-all active:scale-95"
            >
              Sign in
            </button>
          </div>
        )}
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-xl md:hidden animate-in slide-in-from-top duration-300">
          <div className="flex flex-col p-4 space-y-2">
            {navLinks.map((link) => (
              <button 
                key={link.id}
                onClick={() => handleNav(link.id)}
                className={`w-full text-left px-6 py-4 rounded-2xl text-base font-semibold ${
                  currentPage === link.id ? 'bg-blue-50 text-[#0A3D91]' : 'text-gray-700'
                }`}
              >
                {link.label}
              </button>
            ))}
            {!user && (
              <button 
                onClick={() => handleNav('auth', { mode: 'login' })}
                className="w-full text-left px-6 py-4 rounded-2xl text-base font-semibold text-[#0A3D91]"
              >
                Sign in
              </button>
            )}
            {user && (
              <button 
                onClick={() => { onLogout(); setIsMenuOpen(false); }}
                className="w-full text-left px-6 py-4 rounded-2xl text-base font-semibold text-red-600"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;