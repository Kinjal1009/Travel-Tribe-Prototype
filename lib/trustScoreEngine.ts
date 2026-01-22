
import { User, Trip } from '../types';

/**
 * Trust Score Calculation V1 Algorithm
 * DETERMINISTIC & BACKEND-LIKE
 */

export interface TrustResult {
  score10: number;
  reasons: string[];
}

export const computeIndividualTrust = (user: User): TrustResult => {
  const reasons: string[] = [];
  let score = 5.0; // Baseline

  // Default profile if missing
  const profile = user.trustProfile || {
    kycVerified: user.kycVerified || false,
    tripsCompleted: user.historySignals?.pastTripsCompleted || 0,
    tripsDropped: user.historySignals?.pastDropoffs || 0,
    avgRating: user.historySignals?.avgRating || 0,
    ratingCount: user.historySignals?.pastTripsCompleted || 0,
    chatFlags: { abusiveCount: 0, toxicCount: 0, spamCount: 0 },
    socialSignals: { violentContentFlag: false }
  };

  // 1. KYC Contribution
  if (profile.kycVerified) {
    score += 2.0;
    reasons.push("KYC Verified (+2.0)");
  }

  // 2. Experience Contribution
  if (profile.tripsCompleted >= 5) {
    score += 1.0;
    reasons.push("Expert Traveler: 5+ trips (+1.0)");
  } else if (profile.tripsCompleted >= 3) {
    score += 0.8;
    reasons.push("Experienced Traveler: 3+ trips (+0.8)");
  } else if (profile.tripsCompleted >= 1) {
    score += 0.6;
    reasons.push("Completed first trip (+0.6)");
  }

  // 3. Ratings Contribution
  // Let ratingNorm = (avgRating - 3.0) / 2.0 -> maps 1..5 to -1..+1
  if (profile.ratingCount >= 1) {
    const ratingNorm = (profile.avgRating - 3.0) / 2.0;
    let multiplier = profile.ratingCount >= 5 ? 2.0 : 1.5;
    const contribution = ratingNorm * multiplier;
    score += contribution;
    reasons.push(`Community Feedback: ${profile.avgRating}/5 (${contribution.toFixed(1)})`);
  }

  // 4. Drop-off Penalty
  const totalInvolved = profile.tripsCompleted + profile.tripsDropped;
  if (totalInvolved > 0 && profile.tripsDropped > 0) {
    const dropRate = profile.tripsDropped / totalInvolved;
    const penalty = Math.min(3.0, dropRate * 3.0);
    score -= penalty;
    reasons.push(`Drop-off Penalty (-${penalty.toFixed(1)})`);
  }

  // 5. Chat Flags Penalty
  const cf = profile.chatFlags;
  const chatPenalty = Math.min(2.5, cf.abusiveCount * 0.8 + cf.toxicCount * 0.4 + cf.spamCount * 0.2);
  if (chatPenalty > 0) {
    score -= chatPenalty;
    reasons.push(`Chat Conduct Penalty (-${chatPenalty.toFixed(1)})`);
  }

  // 6. Hard Safety Flag
  if (profile.socialSignals?.violentContentFlag) {
    score -= 4.0;
    reasons.push("Hard Safety Alert: Social Signal (-4.0)");
  }

  // Final Clamp & Round
  const finalScore = Math.max(0, Math.min(10.0, parseFloat(score.toFixed(1))));
  
  return {
    score10: finalScore,
    reasons
  };
};

/**
 * Computes Group Trust Score for a trip
 * Average of creator + approved/confirmed unique members
 */
export const computeGroupTrust = (trip: Trip, usersById: Record<string, User>): number => {
  const involvedUserIds = new Set<string>();
  
  // 1. Creator
  involvedUserIds.add(trip.ownerId);

  // 2. Approved/Confirmed Members
  const members = trip.membersApproved || trip.participants
    .filter(p => p.status === 'approved')
    .map(p => p.userId);
  
  const confirmed = trip.membersConfirmed || trip.participants
    .filter(p => p.paid)
    .map(p => p.userId);

  members.forEach(id => involvedUserIds.add(id));
  confirmed.forEach(id => involvedUserIds.add(id));

  const uniqueIds = Array.from(involvedUserIds);
  if (uniqueIds.length === 0) return 5.0;

  let totalScore = 0;
  let count = 0;

  uniqueIds.forEach(id => {
    const u = usersById[id];
    if (u) {
      totalScore += computeIndividualTrust(u).score10;
      count++;
    }
  });

  if (count === 0) return 5.0;
  return parseFloat((totalScore / count).toFixed(1));
};
