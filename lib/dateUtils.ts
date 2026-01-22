
import { Trip, User, ParticipationState } from '../types';

/**
 * Validates if a string matches the DD/MM/YYYY pattern and falls within 1900-2100.
 */
export const isValidDDMMYYYY = (str: string): boolean => {
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  if (!regex.test(str)) return false;
  
  const d = parseTripDate(str);
  if (!d) return false;
  
  const year = d.getFullYear();
  return year >= 1900 && year <= 2100;
};

/**
 * Generates an ISO date string (YYYY-MM-DD) relative to today.
 */
export const getRelativeDate = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns the ISO string for the day after the provided ISO date.
 */
export const getNextDayISO = (iso: string): string => {
  const d = parseTripDate(iso);
  if (!d) return '';
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses DD/MM/YYYY or YYYY-MM-DD into a local Date object.
 */
export const parseTripDate = (input: string): Date | null => {
  if (!input) return null;
  const str = String(input).trim();

  // Primary: DD/MM/YYYY
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      
      if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
      
      const date = new Date(y, m, d);
      // Ensure it's a valid calendar date
      if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
        date.setHours(0, 0, 0, 0);
        return date;
      }
    }
  }

  // Secondary: YYYY-MM-DD (ISO)
  if (str.includes('-') && /^\d{4}/.test(str)) {
    const parts = str.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      if (!isNaN(date.getTime())) {
        date.setHours(0, 0, 0, 0);
        return date;
      }
    }
  }

  return null;
};

export const parseDateDDMMYYYY = parseTripDate;

/**
 * Converts a string (DD/MM/YYYY or ISO) to ISO (YYYY-MM-DD).
 */
export const toISODate = (input: string): string => {
  const d = parseTripDate(input);
  if (!d) return '';
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converts an ISO string (YYYY-MM-DD) to DD/MM/YYYY.
 */
export const fromISODate = (iso: string): string => {
  return formatDateDDMMYYYY(iso);
};

/**
 * Formats a Date or string to strictly DD/MM/YYYY.
 */
export const formatDateDDMMYYYY = (dateLike: string | Date | null | undefined): string => {
  if (!dateLike) return '';
  
  let d: Date | null = null;
  
  if (dateLike instanceof Date) {
    d = dateLike;
  } else {
    d = parseTripDate(dateLike);
  }
  
  if (!d || isNaN(d.getTime())) return '';

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateRangeDDMMYYYY = (start: string, end: string): string => {
  if (!start && !end) return '—';
  return `${formatDateDDMMYYYY(start)} – ${formatDateDDMMYYYY(end)}`;
};

/**
 * Calculates duration in days: (End - Start) + 1
 */
export const calculateDuration = (start: string | undefined, end: string | undefined): number | null => {
  if (!start || !end) return null;
  const s = parseTripDate(start);
  const e = parseTripDate(end);
  if (!s || !e) return null;
  const diffTime = e.getTime() - s.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : null;
};

/**
 * Checks if a user has an approved/paid trip overlapping with candidate dates.
 */
export const checkTripOverlap = (user: User, currentTripId: string, newStart: string, newEnd: string, allTrips: Trip[]): Trip | null => {
  const nStart = parseTripDate(newStart);
  const nEnd = parseTripDate(newEnd);
  if (!nStart || !nEnd) return null;

  const myTrips = allTrips.filter(trip => {
    if (trip.id === currentTripId) return false;
    if (trip.ownerId === user.id && trip.tripType === 'ORGANIZER') return false;

    const participation = trip.userParticipation;
    const isApprovedOrPaid = 
      participation === ParticipationState.APPROVED_PAID || 
      participation === ParticipationState.APPROVED_UNPAID;
    
    const isOwnerOfIndividual = (trip.ownerId === user.id && trip.tripType === 'INDIVIDUAL');

    return (isApprovedOrPaid || isOwnerOfIndividual);
  });

  for (const trip of myTrips) {
    const tStart = parseTripDate(trip.startDate);
    const tEnd = parseTripDate(trip.endDate);
    if (tStart && tEnd) {
      if (nStart <= tEnd && nEnd >= tStart) return trip;
    }
  }
  return null;
};

export const getActiveTripForUser = (user: User | null, allTrips: Trip[]): Trip | null => {
  if (!user) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const eligible = allTrips.filter(t => {
    const participation = t.userParticipation;
    const isConfirmed = 
      participation === ParticipationState.APPROVED_PAID || 
      t.ownerId === user.id;
    
    if (!isConfirmed) return false;

    const start = parseTripDate(t.startDate);
    const end = parseTripDate(t.endDate);
    if (!start || !end) return false;

    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);

    return now >= start && now <= endOfDay;
  });

  if (eligible.length === 0) return null;
  
  return eligible.sort((a, b) => {
    const ad = parseTripDate(a.startDate)?.getTime() || 0;
    const bd = parseTripDate(b.startDate)?.getTime() || 0;
    return ad - bd;
  })[0];
};
