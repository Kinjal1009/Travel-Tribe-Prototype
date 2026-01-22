export enum KycStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED'
}

export type TripStatus = "OPEN" | "FULL" | "PENDING" | "APPROVED" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "WITHDRAWN";
export type MembershipState = "NOT_REQUESTED" | "REQUEST_SENT" | "APPROVED" | "REJECTED";
export type OrganizerType = "individual" | "organizer";

export enum TravelMode {
  BUS = 'Bus',
  TRAIN = 'Train',
  FLIGHT = 'Flight',
  OWN = 'Own',
  ANY = 'Any'
}

export type TransportMode = TravelMode;

export enum TripType {
  ORGANIZER = 'ORGANIZER',
  INDIVIDUAL = 'INDIVIDUAL'
}

export enum TripJoinStatus {
  NOT_JOINED = 'NOT_JOINED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED_NOT_LOCKED = 'APPROVED_NOT_LOCKED',
  LOCKED_PAYMENT_PENDING = 'LOCKED_PAYMENT_PENDING',
  CONFIRMED = 'CONFIRMED'
}

export enum PaymentStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED'
}

export enum ParticipationState {
  NOT_JOINED = 'NOT_JOINED',
  REQUESTED = 'REQUESTED',
  APPROVED_UNPAID = 'APPROVED_UNPAID',
  APPROVED_PAID = 'APPROVED_PAID',
  DENIED = 'DENIED'
}

export enum BookingLifecycleStatus {
  PLANNING = 'PLANNING',
  PAYMENT_OPEN = 'PAYMENT_OPEN',
  CONFIRMED = 'CONFIRMED'
}

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD';
export type TrustTier = 'Low' | 'Medium' | 'High';
export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export interface VibeProfile {
  pace: 'Fast-paced' | 'Relaxed' | 'Balanced';
  budget: 'Talk it out calmly' | 'Adjust and move on' | 'Prefer space before discussing';
  food: 'Very comfortable' | 'Comfortable after a little time' | 'I take time, but I warm up';
  social: 'Social & chatty' | 'Calm & respectful' | 'Depends on the day';
  comfort: 'Basic' | 'Medium' | 'Premium';
  commitment?: 'Planned' | 'Go-with-the-flow' | 'Flexible';
  travelMode?: 'I like structure and clarity' | 'I like freedom and spontaneity' | 'A bit of both';
  nightStyle?: 'Early starts and full days' | 'Easy mornings, steady days' | 'Late starts, relaxed pace';
  soloTime?: 'Like to discuss and decide together' | 'Are okay following the group' | 'Prefer a clear lead, but open to input';
}

export interface TrustSignals {
  verifiedId: boolean;
  pastTripsCompleted: number;
  dropOffs: number;
  avgRating: number;
  commToneScore: number;
}

export interface SocialProfiles {
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface TripMembership {
  id: string;
  tripId: string;
  userId: string;
  state: ParticipationState;
  paid: boolean;
  joinedAt: string;
  socialLinks?: SocialProfiles;
  introVideoUrl?: string;
  trustScoreAtJoining?: number;
  paymentStatusBus?: PaymentStatus;
  paymentStatusHotel?: PaymentStatus;
  paymentStatusFlight?: PaymentStatus;
}

export interface TripRating {
  id: string;
  tripId: string;
  raterUserId: string;
  ratedUserId: string;
  respect: number;
  reliability: number;
  cooperation: number;
  safety: number;
  feedback?: string;
  createdAt: string;
}

export interface OrganizerRating {
  id: string;
  tripId: string;
  organizerId: string;
  organizerType: OrganizerType;
  raterUserId: string;
  stars: number;
  tags: string[];
  comment?: string;
  createdAt: string;
}

export interface OrganizerProfileStats {
  organizerId: string;
  organizerType: OrganizerType;
  avgStars: number;
  ratingCount: number;
  lastUpdatedAt: string;
}

export interface User {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  homeCity: string;
  password?: string;
  passwordHash?: string;
  authProvider: 'form' | 'google';
  googleEmail?: string;
  demoUserFlag?: boolean;
  createdAt: string;
  updatedAt: string;
  gender: Gender;
  avatarUrl: string;
  kycStatus: KycStatus;
  kycVerified: boolean;
  trustScore: number;
  trustTier: TrustTier;
  lastVibeCheckAt?: string;
  vibeProfile?: VibeProfile;
  userRole: 'INDIVIDUAL' | 'ORGANIZER';
  organizerName?: string;
  dob?: string;
  bio?: string;
  isProfileComplete: boolean;
  upiId?: string;
  historySignals?: {
    pastTripsCompleted: number;
    pastDropoffs: number;
    avgRating: number;
    priorForumToneScore: number;
    priorChatFlags: boolean;
  };
  socialProfiles?: SocialProfiles;
  emergencyContact?: EmergencyContact;
  trustProfile?: {
    kycVerified: boolean;
    tripsCompleted: number;
    tripsDropped: number;
    avgRating: number;
    ratingCount: number;
    chatFlags: {
      abusiveCount: number;
      toxicCount: number;
      spamCount: number;
    };
    socialSignals?: { violentContentFlag: boolean };
  };
}

export interface SupportTicket {
  id: string;
  userId: string;
  email: string;
  message: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
}

export interface AuthSession {
  currentUserId: string | null;
  lastLoginAt: string | null;
}

export interface ItineraryItem {
  time: string;
  label: string;
  place?: string;
  notes?: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  summary: string;
  startTime?: string;
  endTime?: string;
  items: ItineraryItem[];
  activities?: string;
  dayTitle?: string;
}

export interface TripCreator {
  type: 'individual' | 'organizer';
  name: string;
  avatarUrl?: string;
  companyLogoUrl?: string;
}

export interface TripParticipant {
  userId: string;
  status: 'pending' | 'approved' | 'denied';
  paid: boolean;
  joinedAt: string;
}

export interface CoTraveler {
  id: string;
  name: string;
  avatar: string;
  vibeProfile: VibeProfile;
  trustSignals: TrustSignals;
  trustScore: number;
  trustTier: TrustTier;
  isOrganizer?: boolean;
}

export interface TripBookingState {
  bus: {
    proposals: Proposal[];
    lockedProposalId: string | null;
    votes: Record<string, string>;
    proposedOptionId?: string;
    lockedOptionId?: string | null;
    pnr?: string;
  };
  flight: {
    proposals: Proposal[];
    lockedProposalId: string | null;
    votes: Record<string, string>;
    proposedOptionId?: string;
    lockedOptionId?: string | null;
    pnr?: string;
  };
  hotel: {
    proposals: Proposal[];
    lockedProposalId: string | null;
    votes: Record<string, string>;
    proposedOptionId?: string;
    lockedOptionId?: string | null;
    bookingId?: string;
  };
  lifecycleStatus: BookingLifecycleStatus;
  paymentEnabled: boolean;
}

export interface Trip {
  id: string;
  title: string;
  ownerId: string;
  tripType: TripType;
  womenOnly: boolean;
  startPoint: string;
  routeStops: string[];
  endPoint: string;
  startDate: string;
  endDate: string;
  pricePerPersonInr: number;
  estimatedBudget: number;
  capacity: number;
  travelModes: TravelMode[];
  imageUrl: string;
  status: TripStatus;
  itinerary: ItineraryDay[];
  createdByUserId: string;
  creator: TripCreator;
  participants: TripParticipant[];
  coTravelers: CoTraveler[];
  location: string;
  locationsCovered?: string[];
  fromCity?: string;
  toCity?: string;
  numberOfDays?: number;
  accessPolicy?: string;
  featuredScore?: number;
  isFeatured?: boolean;
  bookingsVelocity?: number;
  joinedCount: number;
  maxTravelers: number;
  mockApprovalMode?: 'AUTO' | 'MANUAL';
  visibilityRules?: {
    requiresKyc: boolean;
    requiresApproval: boolean;
  };
  bookingState?: BookingLifecycleStatus;
  userParticipation?: ParticipationState;
  bookingStateObj?: TripBookingState;
  vibeMatchPercent?: number;
  membersApproved?: string[];
  membersConfirmed?: string[];
  groupTrustScore?: number;
  ratingsSubmitted?: boolean;
  organizerId: string;
  organizerType: OrganizerType;
  organizerDisplayName: string;
}

export interface Proposal {
  id: string;
  tripId: string;
  type: "BUS" | "HOTEL" | "FLIGHT";
  optionId: string;
  proposedByUserId: string;
  createdAt: string;
  messageText: string;
  votes: Record<string, "YES" | "NO">;
  userId: string;
  userName: string;
  userAvatar: string;
  voterIds: string[];
  title: string;
  provider: string;
  pricePerPerson: number;
  departTime?: string;
  arriveTime?: string;
  notes?: string;
}

export interface AssistantPicklistPayload {
  buses: {
    topRated: AssistantPickItem;
    cheapest: AssistantPickItem;
    mostBooked: AssistantPickItem;
  };
  flights: {
    topRated: AssistantPickItem;
    cheapest: AssistantPickItem;
    mostBooked: AssistantPickItem;
  };
  hotels: {
    topRated: AssistantPickItem;
    cheapest: AssistantPickItem;
    mostBooked: AssistantPickItem;
  };
}

export interface AssistantPickItem {
  id: string;
  name: string;
  rating: number;
  reviews: string;
  price?: number;
  pricePerNight?: number;
  departTime?: string;
  arriveTime?: string;
  duration?: string;
  area?: string;
  bookings?: string;
  label: string;
}

export interface ChatMessage {
  id: string;
  tripId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  proposal?: Proposal;
  type?: "assistant_picklist" | "text" | "system";
  payload?: AssistantPicklistPayload;
}

export interface SearchFilters {
  location: string;
  startFrom?: string;
  startDate?: string;
  endDate?: string;
  days?: string;
  budget?: 'Any' | 'Thrifty' | 'Standard' | 'Luxury';
  tripType?: 'Any' | TripType;
}

export interface BusOption {
  id: string;
  operator: string;
  departTime: string;
  arriveTime: string;
  duration: string;
  seatType: string;
  price: number;
}

export interface FlightOption {
  id: string;
  airline: string;
  flightNumber: string;
  departTime: string;
  arriveTime: string;
  duration: string;
  stops: string;
  price: number;
}

export interface TrainOption {
  id: string;
  trainName: string;
  departTime: string;
  arriveTime: string;
  classType: string;
  price: number;
}

export interface HotelOption {
  id: string;
  name: string;
  area: string;
  rating: number;
  pricePerNight: number;
  totalPrice: number;
  refundableBadge: boolean;
}

export interface BookingLock {
  busLocked: boolean;
  hotelLocked: boolean;
  flightLocked: boolean;
}

export type NotificationType = "message" | "optin_approved" | "optin_rejected" | "proposal_locked" | "payment_due" | "trip_update";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  tripId: string;
  chatId?: string;
  target: {
    screen: "chatThread" | "tripDetails" | "tripsTab";
    params: { tripId: string; chatId?: string; tab?: string };
  };
  createdAt: string;
  read: boolean;
  userId: string; // The recipient
}

export interface Flight {
  airline: string;
  flight_number?: string;
  departure: string;
  arrival: string;
  departure_time?: string;
  arrival_time?: string;
  duration?: string;
  stops: number;
  price: number;
  extensions?: string[];
}

export interface FlightSearchResponse {
  success: boolean;
  flights: Flight[];
}

export enum AppView {
  INTERESTS = 'INTERESTS',
  LOADING = 'LOADING',
  QUIZ = 'QUIZ',
  RESULTS = 'RESULTS',
  FLIGHT_SEARCH = 'FLIGHT_SEARCH'
}

export interface Question {
  id: string;
  text: string;
  options: string[];
}

export interface Match {
  id: string;
  name: string;
  travelStyle: string;
  compatibility: number;
  interests: string[];
  avatar: string;
}

export interface Interest {
  id: string;
  label: string;
  icon: string;
}