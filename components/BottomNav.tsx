
import React from 'react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Explore', icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    )},
    { id: 'initiate-trip', label: 'Create', icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
      </svg>
    )},
    { id: 'my-trips', label: 'Trips', icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    )},
    { id: 'chat-inbox', label: 'Chat', icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    )},
    { id: 'profile', label: 'Profile', icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 flex items-center justify-center z-[60] pb-2 lg:hidden">
      <div className="w-full max-w-lg flex items-center justify-around px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id || (tab.id === 'home' && activeTab === 'search-results');
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1 group w-16"
            >
              <div className={`h-8 w-14 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-[#D7E2FF] text-[#001A40]' : 'text-gray-500 hover:bg-gray-100'}`}>
                {tab.icon(isActive)}
              </div>
              <span className={`text-[9px] font-bold tracking-tight uppercase ${isActive ? 'text-[#1B1B1F]' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
