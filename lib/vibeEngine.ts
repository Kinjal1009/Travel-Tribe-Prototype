
import { VibeProfile, CoTraveler, Trip } from '../types';

const WEIGHTS = {
  budget: 25,
  commitment: 10,
  food: 15,
  social: 10,
  travelMode: 15,
  pace: 10,
  nightStyle: 10,
  soloTime: 5,
};

export const computeVibeMatch = (userProfile: VibeProfile | null, coTravelers: CoTraveler[]): number | null => {
  if (!userProfile) return null;
  if (!coTravelers.length) return 100; // Empty trips are 100% potential

  let totalScore = 0;
  const keys = Object.keys(WEIGHTS) as (keyof VibeProfile)[];

  keys.forEach((key) => {
    const userValue = String(userProfile[key]).toLowerCase();
    
    let matchCount = 0;
    coTravelers.forEach(ct => {
      if (String(ct.vibeProfile[key]).toLowerCase() === userValue) {
        matchCount++;
      }
    });

    const keyScore = (matchCount / coTravelers.length) * WEIGHTS[key];
    totalScore += keyScore;
  });

  return Math.max(0, Math.min(100, Math.round(totalScore)));
};

export const getVibeBand = (score: number) => {
  if (score >= 80) return { label: 'Great', color: 'text-green-600', bg: 'bg-green-50' };
  if (score >= 40) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
  return { label: 'Muted', color: 'text-gray-400', bg: 'bg-gray-50' };
};
