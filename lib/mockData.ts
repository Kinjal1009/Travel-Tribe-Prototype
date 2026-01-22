
import { Trip, TripType, TravelMode, User, KycStatus, CoTraveler, VibeProfile, TrustSignals, TripJoinStatus, TripMembership, PaymentStatus, ParticipationState, BookingLifecycleStatus, ItineraryDay, Proposal, TripBookingState, TrustTier, ItineraryItem } from '../types';
import { getTrustTier } from './trustEngine';
import { getRelativeDate } from './dateUtils';

export const SEED_VERSION = "tt_v31_completed_trip_demo";

const IMAGE_IDS = {
  Chennai: 'photo-1582510003544-4d00b7f74220',
  Coorg: 'photo-1580224161947-a7e80486c9d0',
  Hampi: 'photo-1620393470010-fd62688002df',
  Bengaluru: 'photo-1596176530529-78163a4f7af2',
  Goa: 'photo-1512453979798-5ea266f8880c',
  Ooty: 'photo-1590691566700-41ad529b7405',
  Pondicherry: 'photo-1590050752117-23a9d7fc2058',
  Munnar: 'photo-1592500305630-419da01a7c33',
  Jaipur: 'photo-1599661046289-e31887846eac',
  Udaipur: 'photo-1605649440416-43f9426216aa',
  Manali: 'photo-1591122849202-390466dfa996',
  Spiti: 'photo-1626015099898-33e143b5937f',
  Wayanad: 'photo-1592500305630-419da01a7c33',
  Valparai: 'photo-1582510003544-4d00b7f74220',
  Kochi: 'photo-1590603740183-980e7f98e1c2',
  Generic: 'photo-1506461883276-594a12b11cf3'
};

const getUnsplashUrl = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=1200`;

export const LOCATION_IMAGE_MAP: Record<string, string[]> = {
  'Chennai': [getUnsplashUrl(IMAGE_IDS.Chennai)],
  'Coorg': [getUnsplashUrl(IMAGE_IDS.Coorg)],
  'Hampi': [getUnsplashUrl(IMAGE_IDS.Hampi)],
  'Bengaluru': [getUnsplashUrl(IMAGE_IDS.Bengaluru)],
  'Goa': [getUnsplashUrl(IMAGE_IDS.Goa)],
  'Ooty': [getUnsplashUrl(IMAGE_IDS.Ooty)],
  'Pondicherry': [getUnsplashUrl(IMAGE_IDS.Pondicherry)],
  'Munnar': [getUnsplashUrl(IMAGE_IDS.Munnar)],
  'Jaipur': [getUnsplashUrl(IMAGE_IDS.Jaipur)],
  'Udaipur': [getUnsplashUrl(IMAGE_IDS.Udaipur)],
  'Manali': [getUnsplashUrl(IMAGE_IDS.Manali)],
  'Spiti': [getUnsplashUrl(IMAGE_IDS.Spiti)],
  'Wayanad': [getUnsplashUrl(IMAGE_IDS.Wayanad)],
  'Valparai': [getUnsplashUrl(IMAGE_IDS.Valparai)],
  'Kochi': [getUnsplashUrl(IMAGE_IDS.Kochi)],
  'Generic': [getUnsplashUrl(IMAGE_IDS.Generic)],
};

const generateVibeProfile = (variant: 'standard' | 'mismatch' | 'perfect' = 'standard'): VibeProfile => {
  if (variant === 'mismatch') {
    return {
      budget: 'Adjust and move on',
      food: 'I take time, but I warm up',
      commitment: 'Go-with-the-flow',
      social: 'Calm & respectful',
      travelMode: 'I like freedom and spontaneity',
      pace: 'Fast-paced',
      nightStyle: 'Early starts and full days',
      soloTime: 'Are okay following the group',
      comfort: 'Basic'
    };
  }
  if (variant === 'perfect') {
    return {
      budget: 'Talk it out calmly',
      food: 'Very comfortable',
      commitment: 'Planned',
      social: 'Depends on the day',
      travelMode: 'I like structure and clarity',
      pace: 'Balanced',
      nightStyle: 'Easy mornings, steady days',
      soloTime: 'Like to discuss and decide together',
      comfort: 'Medium'
    };
  }
  return {
    budget: 'Talk it out calmly',
    food: 'Comfortable after a little time',
    commitment: 'Flexible',
    social: 'Social & chatty',
    travelMode: 'A bit of both',
    pace: 'Balanced',
    nightStyle: 'Easy mornings, steady days',
    soloTime: 'Prefer a clear lead, but open to input',
    comfort: 'Medium'
  };
};

const createCoTraveler = (id: string, name: string, variant: 'standard' | 'mismatch' | 'perfect' = 'standard', isOrganizer: boolean = false): CoTraveler => {
  const score = isOrganizer ? 88 + (id.length % 5) : 75 + (id.length % 15);
  return {
    id,
    name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    vibeProfile: generateVibeProfile(variant),
    trustSignals: { verifiedId: true, pastTripsCompleted: 3, dropOffs: 0, avgRating: 4.8, commToneScore: 18 },
    trustScore: score,
    trustTier: getTrustTier(score)
  };
};

export const VISHNU_USER: User = {
  id: 'user_vishnu',
  name: 'Vishnu Prabhu',
  firstName: 'Vishnu',
  lastName: 'Prabhu',
  homeCity: 'Chennai',
  isProfileComplete: true,
  gender: 'Male',
  email: 'vishnutvp89@gmail.com',
  phone: '9789328512',
  dob: '1994-01-01',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vishnu',
  kycStatus: KycStatus.VERIFIED,
  kycVerified: true,
  userRole: 'INDIVIDUAL',
  historySignals: { pastTripsCompleted: 5, pastDropoffs: 0, avgRating: 4.8, priorForumToneScore: 10, priorChatFlags: false },
  vibeProfile: generateVibeProfile('perfect'),
  lastVibeCheckAt: '2026-01-10T12:00:00.000Z',
  trustScore: 82,
  trustTier: 'High',
  socialProfiles: { linkedin: 'linkedin.com/in/vishnu-travels' },
  emergencyContact: { name: "Amma", phone: "+91 9123456789", relationship: "Mother" },
  authProvider: 'form',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

export const ANANYA_USER: User = {
  id: 'demo-ananya',
  name: 'Ananya',
  firstName: 'Ananya',
  lastName: '',
  homeCity: 'Bengaluru',
  isProfileComplete: true,
  gender: 'Female',
  email: 'ananya.demo@gmail.com',
  phone: '9876543211',
  dob: '1996-05-15',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya',
  kycStatus: KycStatus.VERIFIED,
  kycVerified: true,
  userRole: 'INDIVIDUAL',
  historySignals: { pastTripsCompleted: 8, pastDropoffs: 0, avgRating: 4.9, priorForumToneScore: 15, priorChatFlags: false },
  trustScore: 85,
  trustTier: 'High',
  socialProfiles: { instagram: '@ananya_explores' },
  authProvider: 'form',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

export const ROHAN_USER: User = {
  id: 'demo-rohan',
  name: 'Rohan Sharma',
  firstName: 'Rohan',
  lastName: 'Sharma',
  homeCity: 'Mumbai',
  isProfileComplete: true,
  gender: 'Male',
  email: 'rohan.demo@gmail.com',
  phone: '9876543212',
  dob: '1992-11-20',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan',
  kycStatus: KycStatus.VERIFIED,
  kycVerified: true,
  userRole: 'INDIVIDUAL',
  historySignals: { pastTripsCompleted: 3, pastDropoffs: 1, avgRating: 4.5, priorForumToneScore: 8, priorChatFlags: false },
  trustScore: 72,
  trustTier: 'Medium',
  socialProfiles: { twitter: '@rohan_rides' },
  authProvider: 'form',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

export const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad', 
  'Pune', 'Ahmedabad', 'Jaipur', 'Udaipur', 'Kochi', 'Goa', 
  'Pondicherry', 'Ooty', 'Munnar', 'Hampi', 'Coorg', 'Rishikesh', 'Manali'
];

// Moving getAutoItinerary above MOCK_TRIPS to fix declaration order error.
export const getAutoItinerary = (location: string, days: number): ItineraryDay[] => {
  return Array.from({ length: days }, (_, i) => {
    const isFirst = i === 0;
    const isLast = i === days - 1;
    
    let title = `Explore ${location} Hidden Gems`;
    let summary = "Full day of curated local experiences and secret spots.";
    let items: ItineraryItem[] = [
      { time: "10:00", label: "Morning Expedition", place: `${location} Old Town`, notes: "Light trekking involved." },
      { time: "13:30", label: "Cultural Lunch", place: "Tribe Recommended Cafe", notes: "Authentic local flavors." },
      { time: "16:00", label: "Afternoon Workshop", place: "Artisan Studio", notes: "Hands-on heritage experience." }
    ];

    if (isFirst) {
      title = `Arrival in ${location}`;
      summary = "Welcome meet, tribe orientation, and local dinner.";
      items = [
        { time: "12:00", label: "Check-in & Settle", place: "Basecamp Lodge", notes: "Relax after travel." },
        { time: "18:00", label: "Tribe Meetup", place: "Central Courtyard", notes: "Introduction and brief orientation." },
        { time: "20:00", label: "Welcome Dinner", place: "Heritage Restaurant", notes: "First feast together." }
      ];
    } else if (isLast) {
      title = `Departure from ${location}`;
      summary = "Last sunrise session and group checkout.";
      items = [
        { time: "06:30", label: "Sunrise Viewpoint", place: "Sky Ridge", notes: "Final photos and reflection." },
        { time: "09:00", label: "Farewell Breakfast", place: "Cafe Terrace", notes: "Exchange contacts and memories." },
        { time: "11:00", label: "Checkout & Disperse", place: "Basecamp", notes: "End of formal expedition." }
      ];
    }

    return {
      day: i + 1,
      title,
      summary,
      items
    };
  });
};

export const MOCK_TRIPS: Trip[] = [
  {
    id: 'trip-hampi-01',
    title: 'Boulders & Ruins: Hampi Expedition',
    ownerId: ROHAN_USER.id,
    tripType: TripType.INDIVIDUAL,
    womenOnly: false,
    startPoint: 'Bengaluru',
    routeStops: ['Hampi'],
    endPoint: 'Bengaluru',
    startDate: getRelativeDate(14),
    endDate: getRelativeDate(18),
    pricePerPersonInr: 8500,
    estimatedBudget: 8500,
    capacity: 10,
    joinedCount: 4,
    maxTravelers: 10,
    travelModes: [TravelMode.BUS],
    imageUrl: LOCATION_IMAGE_MAP['Hampi'][0],
    status: 'OPEN',
    location: 'Hampi',
    itinerary: getAutoItinerary('Hampi', 5),
    createdByUserId: ROHAN_USER.id,
    creator: { type: 'individual', name: ROHAN_USER.name, avatarUrl: ROHAN_USER.avatarUrl },
    participants: [{ userId: ROHAN_USER.id, status: 'approved', paid: true, joinedAt: getRelativeDate(-5) }],
    coTravelers: [createCoTraveler('demo-rohan', 'Rohan Sharma', 'standard', true), createCoTraveler('user-2', 'Rahul'), createCoTraveler('user-3', 'Sneha')],
    organizerId: ROHAN_USER.id,
    organizerType: 'individual',
    organizerDisplayName: ROHAN_USER.name
  },
  {
    id: 'trip-goa-02',
    title: 'South Goa Heritage & Yoga Retreat',
    ownerId: 'org_bharat',
    tripType: TripType.ORGANIZER,
    womenOnly: true,
    startPoint: 'Mumbai',
    routeStops: ['Goa'],
    endPoint: 'Mumbai',
    startDate: getRelativeDate(25),
    endDate: getRelativeDate(30),
    pricePerPersonInr: 15500,
    estimatedBudget: 15500,
    capacity: 15,
    joinedCount: 8,
    maxTravelers: 15,
    travelModes: [TravelMode.TRAIN],
    imageUrl: LOCATION_IMAGE_MAP['Goa'][0],
    status: 'OPEN',
    location: 'Goa',
    itinerary: getAutoItinerary('Goa', 6),
    createdByUserId: 'org_bharat',
    creator: { type: 'organizer', name: 'Bharat Travels', companyLogoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=BT' },
    participants: [{ userId: 'org_bharat', status: 'approved', paid: true, joinedAt: getRelativeDate(-10) }],
    coTravelers: [createCoTraveler('org_bharat', 'Bharat Travels', 'standard', true), createCoTraveler('user-f1', 'Priya'), createCoTraveler('user-f2', 'Anjali')],
    organizerId: 'org_bharat',
    organizerType: 'organizer',
    organizerDisplayName: 'Bharat Travels'
  }
];
