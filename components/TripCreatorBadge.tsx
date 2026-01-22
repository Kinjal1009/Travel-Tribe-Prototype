
import React, { useMemo } from 'react';
import { TripCreator } from '../types';
import { db } from '../lib/mockDb';

interface TripCreatorBadgeProps {
  creator: TripCreator;
  compact?: boolean;
  organizerId?: string;
}

const TripCreatorBadge: React.FC<TripCreatorBadgeProps> = ({ creator, compact = false, organizerId }) => {
  const isOrganizer = creator.type === 'organizer';
  const imgUrl = isOrganizer ? creator.companyLogoUrl : creator.avatarUrl;

  const stats = useMemo(() => organizerId ? db.getOrganizerStats(organizerId) : null, [organizerId]);

  return (
    <div className={`flex items-center gap-2 ${compact ? 'py-1' : 'py-2'}`}>
      <div className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full overflow-hidden border border-gray-100 shrink-0 bg-gray-50`}>
        {imgUrl ? (
          <img src={imgUrl} alt={creator.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#0A3D91] flex items-center justify-center text-white text-[8px] font-black">
            {creator.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-black text-gray-900 truncate`}>
            {creator.name}
          </span>
          {stats ? (
             <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1 py-0.5 rounded flex items-center gap-0.5 whitespace-nowrap">
                ⭐ {stats.avgStars} <span className="text-gray-400 font-bold ml-0.5">({stats.ratingCount})</span>
             </span>
          ) : (
             <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-1 py-0.5 rounded whitespace-nowrap">
                New Host
             </span>
          )}
          {!compact && (
            <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-widest whitespace-nowrap">
              {isOrganizer ? 'Organizer' : 'Host'}
            </span>
          )}
        </div>
        {!compact && (
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
            Verified Host
          </span>
        )}
      </div>
    </div>
  );
};

export default TripCreatorBadge;
