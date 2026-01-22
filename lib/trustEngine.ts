
import { TrustSignals, TrustTier, CoTraveler } from '../types';

export const computeTrustScore = (signals: TrustSignals): number => {
  let score = 50; // base 50
  
  if (signals.verifiedId) score += 20;
  if (signals.pastTripsCompleted >= 2) score += 10;
  if (signals.dropOffs >= 1) score -= 15;
  
  score += (signals.avgRating * 5); // rating 0-5 (0-25 points)
  score += signals.commToneScore; // 0-20 points
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

export const getTrustTier = (score: number): TrustTier => {
  if (score >= 80) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
};

export const getTierColor = (tier: TrustTier): string => {
  switch (tier) {
    case 'High': return 'text-green-600 bg-green-50 border-green-100';
    case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'Low': return 'text-red-600 bg-red-50 border-red-100';
    default: return 'text-gray-400 bg-gray-50 border-gray-100';
  }
};

/**
 * Calculates a single group trust score based on approved + verified members only.
 */
export const calculateGroupTrustScore = (members: CoTraveler[]): number => {
  if (!members || members.length === 0) return 0;
  
  // Rule: Only include members who are "verified" (KYC approved)
  // In our mock, signal.verifiedId represents this.
  const verifiedMembers = members.filter(m => m.trustSignals?.verifiedId);
  
  if (verifiedMembers.length === 0) return 60; // Base safety floor for host-only trips

  const total = verifiedMembers.reduce((acc, m) => acc + (m.trustScore || 60), 0);
  const avg = Math.round(total / verifiedMembers.length);
  
  return Math.max(avg, 60); 
};
