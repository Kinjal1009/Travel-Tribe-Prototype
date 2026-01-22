
import { VISHNU_USER, MOCK_TRIPS } from './mockData';
import { User, Trip } from '../types';

const KEYS = {
  MODE: 'no_name_demo_mode',
  SEEDED: 'no_name_demo_seeded',
  USER: 'no_name_demo_user',
  TRIPS: 'no_name_demo_trips',
  ACTIVE_USER: 'no_name_user'
};

/**
 * Checks if demo mode is currently enabled in storage.
 */
export const isDemoModeActive = (): boolean => {
  return localStorage.getItem(KEYS.MODE) === 'true';
};

/**
 * Enables demo mode:
 * 1. Sets the mode flag.
 * 2. Seeds Vishnu and the 5 demo trips if not already seeded.
 * 3. Forces Vishnu as the active user.
 */
export const enableDemoMode = () => {
  localStorage.setItem(KEYS.MODE, 'true');
  
  // Always seed or update to ensure freshness of demo data
  localStorage.setItem(KEYS.USER, JSON.stringify(VISHNU_USER));
  localStorage.setItem(KEYS.TRIPS, JSON.stringify(MOCK_TRIPS));
  localStorage.setItem(KEYS.SEEDED, 'true');

  // Set current session user to Vishnu
  localStorage.setItem(KEYS.ACTIVE_USER, JSON.stringify(VISHNU_USER));
};

/**
 * Disables demo mode:
 * 1. Sets the mode flag to false.
 * 2. Clears demo-specific storage keys.
 * 3. Logs out the current user if they are the demo user.
 */
export const disableDemoMode = () => {
  localStorage.setItem(KEYS.MODE, 'false');
  
  const currentUser = JSON.parse(localStorage.getItem(KEYS.ACTIVE_USER) || 'null');
  
  // Remove demo-specific storage
  localStorage.removeItem(KEYS.USER);
  localStorage.removeItem(KEYS.TRIPS);
  localStorage.removeItem(KEYS.SEEDED);

  // Logout if current user is the demo user
  if (currentUser && currentUser.id === VISHNU_USER.id) {
    localStorage.removeItem(KEYS.ACTIVE_USER);
  }
};

/**
 * Retrieves the seeded demo trips from storage.
 */
export const getDemoTrips = (): Trip[] => {
  const saved = localStorage.getItem(KEYS.TRIPS);
  return saved ? JSON.parse(saved) : [];
};
