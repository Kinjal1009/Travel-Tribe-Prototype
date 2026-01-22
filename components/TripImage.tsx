
import React, { useState, useEffect } from 'react';
import { Trip } from '../types';
import { LOCATION_IMAGE_MAP } from '../lib/mockData';

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&q=80&w=1200";

export const TripImage: React.FC<{ trip: Trip; className?: string }> = ({ trip, className = "" }) => {
  const tripImage = (trip as any)?.manualImage || (trip?.location ? LOCATION_IMAGE_MAP[trip.location]?.[0] : null) || FALLBACK_IMAGE;
  const [imgSrc, setImgSrc] = useState(tripImage);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    setImgSrc(tripImage);
    setErrorCount(0);
  }, [tripImage]);

  const handleError = () => {
    if (errorCount === 0) {
      setErrorCount(1);
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  return (
    <div className={`relative bg-gray-200 ${className}`}>
      <img 
        src={imgSrc} 
        className="w-full h-full object-cover transition-opacity duration-500"
        alt={trip?.title || "Trip Image"} 
        onError={handleError}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};
