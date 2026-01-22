
import React, { useRef, useEffect } from 'react';
import { AppNotification } from '../types';
import { db } from '../lib/mockDb';

interface NotificationPanelProps {
  notifications: AppNotification[];
  onClose: () => void;
  onNotificationClick: (n: AppNotification) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onClose, onNotificationClick }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const markAllAsRead = () => {
    db.markAllNotificationsRead();
  };

  return (
    <div 
      ref={panelRef}
      className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 shadow-2xl rounded-3xl overflow-hidden z-[150] animate-in slide-in-from-top-2 duration-200"
    >
      <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notifications</h3>
        <button 
          onClick={markAllAsRead}
          className="text-[9px] font-black text-[#0A3D91] uppercase tracking-widest hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto no-scrollbar">
        {notifications.length > 0 ? (
          notifications.map(n => (
            <button
              key={n.id}
              onClick={() => onNotificationClick(n)}
              className={`w-full text-left p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors flex items-start gap-3 relative ${!n.read ? 'bg-blue-50/20' : ''}`}
            >
              {!n.read && (
                <div className="absolute right-4 top-4 w-1.5 h-1.5 bg-[#0A3D91] rounded-full" />
              )}
              <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs ${
                n.type === 'message' ? 'bg-blue-100 text-blue-600' : 
                n.type === 'optin_approved' ? 'bg-green-100 text-green-600' : 
                'bg-amber-100 text-amber-600'
              }`}>
                {n.type === 'message' ? '💬' : n.type === 'optin_approved' ? '✅' : '🔔'}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs uppercase tracking-tight truncate leading-none mb-1 ${!n.read ? 'font-black text-gray-900' : 'font-bold text-gray-500'}`}>
                  {n.title}
                </p>
                <p className="text-[10px] text-gray-400 font-medium line-clamp-2">
                  {n.body}
                </p>
              </div>
            </button>
          ))
        ) : (
          <div className="py-12 text-center">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
