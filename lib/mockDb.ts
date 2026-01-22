import { 
  User, Trip, TripMembership, Proposal, ChatMessage, 
  SearchFilters, TravelMode, KycStatus, TripType, ItineraryDay, ParticipationState, CoTraveler, BookingLifecycleStatus, SupportTicket, AuthSession, TripRating, OrganizerRating, OrganizerProfileStats, OrganizerType, TripStatus, AssistantPicklistPayload, AppNotification, NotificationType
} from '../types';
import { MOCK_TRIPS, VISHNU_USER, getAutoItinerary, LOCATION_IMAGE_MAP, INDIAN_CITIES } from './mockData';
import { formatDateDDMMYYYY, getRelativeDate } from './dateUtils';
import { computeIndividualTrust, computeGroupTrust } from './trustScoreEngine';
import { getTravelOptions, getHotelOptions } from './mockBookingApis';

export const DEV_NOTIF_TEST = true;

interface DbSchema {
  users: Record<string, User>;
  trips: Record<string, Trip>;
  memberships: Record<string, TripMembership>;
  chats: Record<string, ChatMessage[]>;
  tickets: SupportTicket[];
  session: AuthSession;
  ratings: TripRating[];
  organizerRatings: OrganizerRating[];
  organizerProfileStats: Record<string, OrganizerProfileStats>;
  selections: Record<string, { bus?: any, hotel?: any }>;
  unreadCounts: Record<string, number>;
  notifications: AppNotification[];
}

const STORAGE_KEY = 'tt_canonical_db_v3';
const DB_VERSION_KEY = 'TT_DB_VERSION_MARKER_V3';
const CURRENT_DB_VERSION = 'v17_notif_simulations';

export const ASSISTANT_ID = 'VA_NONAME';
export const ASSISTANT_NAME = 'TRAVEL TRIBE Guide';

class MockDb {
  private data: DbSchema;

  constructor() {
    this.data = this.load();
    if (localStorage.getItem(DB_VERSION_KEY) !== CURRENT_DB_VERSION) {
      this.seed();
    }
    
    if (DEV_NOTIF_TEST) {
      (window as any).ttSimMsg = (tripId: string) => this.simulateIncomingMessage(tripId);
      (window as any).ttSimApprove = (tripId: string) => this.simulateOptInApproved(tripId);
    }
  }

  private load(): DbSchema {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return { 
        users: {}, 
        trips: {}, 
        memberships: {}, 
        chats: {}, 
        tickets: [], 
        session: { currentUserId: null, lastLoginAt: null },
        ratings: [],
        organizerRatings: [],
        organizerProfileStats: {},
        selections: {},
        unreadCounts: {},
        notifications: []
      };
    }
    const parsed = JSON.parse(saved);
    if (!parsed.ratings) parsed.ratings = [];
    if (!parsed.organizerRatings) parsed.organizerRatings = [];
    if (!parsed.organizerProfileStats) parsed.organizerProfileStats = {};
    if (!parsed.selections) parsed.selections = {};
    if (!parsed.unreadCounts) parsed.unreadCounts = {};
    if (!parsed.notifications) parsed.notifications = [];
    return parsed;
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  private seed() {
    console.log("DB SEEDING: Generating Comprehensive Market Data...");
    
    const now = new Date().toISOString();
    const todayISO = now.split('T')[0];
    
    // 1. Core User: Vishnu
    const vishnu: User = { 
      ...VISHNU_USER, 
      id: 'user_vishnu',
      passwordHash: 'password123', 
      authProvider: 'form',
      demoUserFlag: true,
      createdAt: now,
      updatedAt: now,
      trustProfile: {
        kycVerified: true,
        tripsCompleted: 5,
        tripsDropped: 0,
        avgRating: 4.8,
        ratingCount: 5,
        chatFlags: { abusiveCount: 0, toxicCount: 0, spamCount: 0 }
      }
    };
    this.data.users[vishnu.id] = vishnu;

    // 2. Define Diverse Mock Organizers
    const mockOrganizers = [
      { id: 'org_elite', name: 'Elite Expeditions', type: 'organizer' as OrganizerType, stars: 4.9, count: 156 },
      { id: 'org_backpacker', name: 'Nomad Soul', type: 'individual' as OrganizerType, stars: 4.7, count: 89 },
      { id: 'org_luxury', name: 'Royal Safaris', type: 'organizer' as OrganizerType, stars: 5.0, count: 42 },
      { id: 'org_newbie', name: 'Sahil Kapoor', type: 'individual' as OrganizerType, stars: 0, count: 0 },
      { id: 'org_mixed', name: 'Wanderlust Co', type: 'organizer' as OrganizerType, stars: 3.8, count: 210 },
      { id: 'org_weekend', name: 'Weekend Warriors', type: 'individual' as OrganizerType, stars: 4.2, count: 23 }
    ];

    mockOrganizers.forEach(o => {
      this.data.organizerProfileStats[o.id] = {
        organizerId: o.id,
        organizerType: o.type,
        avgStars: o.stars,
        ratingCount: o.count,
        lastUpdatedAt: now
      };
      // Create user entry for the organizer
      this.data.users[o.id] = {
        id: o.id,
        name: o.name,
        firstName: o.name.split(' ')[0],
        lastName: o.name.split(' ')[1] || '',
        email: `${o.id}@example.com`,
        phone: `900000000${o.id.length}`,
        homeCity: 'Bengaluru',
        authProvider: 'form',
        createdAt: now,
        updatedAt: now,
        gender: 'Other',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${o.name}`,
        kycStatus: KycStatus.VERIFIED,
        kycVerified: true,
        trustScore: 85,
        trustTier: 'High',
        userRole: o.type === 'organizer' ? 'ORGANIZER' : 'INDIVIDUAL',
        isProfileComplete: true
      };
    });

    // 3. Helper to build diverse Co-Travelers for Vibe Matching
    const createVibeGroup = (baseProfile: any, variation: 'perfect' | 'mixed' | 'opposite'): CoTraveler[] => {
      const group: CoTraveler[] = [];
      const travelerCount = 3 + Math.floor(Math.random() * 5);
      
      for (let i = 0; i < travelerCount; i++) {
        let vibe = { ...baseProfile };
        if (variation === 'mixed') {
          if (i % 2 === 0) vibe.pace = 'Fast-paced';
          if (i % 3 === 0) vibe.budget = 'Adjust and move on';
        } else if (variation === 'opposite') {
          vibe = {
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

        group.push({
          id: `traveler_${i}_${Math.random()}`,
          name: `Explorer ${i}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=explorer${i}${Math.random()}`,
          vibeProfile: vibe,
          trustSignals: { verifiedId: true, pastTripsCompleted: 2, dropOffs: 0, avgRating: 4.5, commToneScore: 15 },
          trustScore: 70,
          trustTier: 'Medium'
        });
      }
      return group;
    };

    // 4. Generate ~50 Trips across all permutations
    const destinationCities = ['Goa', 'Hampi', 'Coorg', 'Ooty', 'Manali', 'Rishikesh', 'Jaipur', 'Udaipur', 'Varanasi', 'Munnar', 'Alleppey', 'Pondicherry'];
    const originCities = ['Bengaluru', 'Chennai', 'Mumbai', 'Delhi', 'Hyderabad', 'Coimbatore', 'Kochi', 'Pune', 'Ahmedabad', 'Kolkata'];
    const tripStatuses: TripStatus[] = ['OPEN', 'FULL', 'ACTIVE', 'COMPLETED'];
    const budgetTiers = [4500, 8500, 12500, 22000, 35000];

    let tripCounter = 0;

    // A. Vishnu-Specific Required Scenarios
    
    // 1. 100% Vibe Match Trip - Updated to Rishikesh as priority
    const vishnuVibe = vishnu.vibeProfile!;
  
    const trip100 = this.createMockTrip(`v-100-${tripCounter++}`, "The Ultimate Vibe Match", "Coorg", "Bengaluru", 12000, 'OPEN', 'org_elite', createVibeGroup(vishnuVibe, 'perfect'));
    this.data.trips[trip100.id] = trip100;

    // 2. <70% Vibe Match Trip
    const tripLow = this.createMockTrip(`v-low-${tripCounter++}`, "Contrast Expedition", "Manali", "Delhi", 18000, 'OPEN', 'org_backpacker', createVibeGroup(vishnuVibe, 'opposite'));
    this.data.trips[tripLow.id] = tripLow;

    // 3. Women-Only Trip (Male Vishnu sees as disabled)
    const tripWomen = this.createMockTrip(`v-women-${tripCounter++}`, "Her Solace: Munnar Retreat", "Munnar", "Kochi", 15000, 'OPEN', 'org_luxury', createVibeGroup(vishnuVibe, 'mixed'));
    tripWomen.womenOnly = true;
    tripWomen.accessPolicy = "WOMEN_ONLY";
    this.data.trips[tripWomen.id] = tripWomen;

    // 4. Booked Full Trip
    const tripFull = this.createMockTrip(`v-full-${tripCounter++}`, "Sunset at Hampi (Sold Out)", "Hampi", "Bengaluru", 9000, 'FULL', 'org_weekend', createVibeGroup(vishnuVibe, 'mixed'));
    tripFull.joinedCount = 12;
    tripFull.maxTravelers = 12;
    this.data.trips[tripFull.id] = tripFull;

    // B. Bulk Seeding across Market
    destinationCities.forEach(dest => {
      originCities.slice(0, 3).forEach((origin, idx) => {
        const org = mockOrganizers[tripCounter % mockOrganizers.length];
        const status = tripStatuses[tripCounter % tripStatuses.length];
        const budget = budgetTiers[tripCounter % budgetTiers.length];
        
        const trip = this.createMockTrip(
          `market-${tripCounter++}`,
          `${dest} ${idx === 0 ? 'Expedition' : 'Weekend'}`,
          dest,
          origin,
          budget,
          status,
          org.id,
          createVibeGroup(vishnuVibe, idx % 2 === 0 ? 'mixed' : 'opposite')
        );
        
        // Vary dates to populate timeline
        if (status === 'COMPLETED') {
            trip.startDate = getRelativeDate(-40 - tripCounter);
            trip.endDate = getRelativeDate(-35 - tripCounter);
        } else if (status === 'ACTIVE') {
            trip.startDate = getRelativeDate(-1);
            trip.endDate = getRelativeDate(4);
        } else {
            trip.startDate = getRelativeDate(10 + tripCounter);
            trip.endDate = getRelativeDate(15 + tripCounter);
        }

        this.data.trips[trip.id] = trip;
      });
    });

    // 5. Inject the 10 Lifecycle Scenarios for Vishnu (from previous requirement)
    this.injectVishnuLifecycleScenarios(vishnu.id, todayISO);

    // Initial unread count mock for demo
    this.data.unreadCounts['v-life-2'] = 3;

    // 6. Mock Notifications for Vishnu
    this.seedMockNotifications(vishnu.id);

    localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
    this.persist();
  }

  private seedMockNotifications(userId: string) {
    if (this.data.notifications.length > 0) return;
    
    this.data.notifications = [
      {
        id: 'n1',
        userId,
        type: 'message',
        title: 'Goa Monsoon Escapade',
        body: 'New message received',
        tripId: 'v-life-2',
        target: { screen: 'chatThread', params: { tripId: 'v-life-2' } },
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        read: false
      },
      {
        id: 'n2',
        userId,
        type: 'message',
        title: 'Himalayan Basecamp Trek',
        body: 'New message received',
        tripId: 'v-life-1',
        target: { screen: 'chatThread', params: { tripId: 'v-life-1' } },
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        read: false
      },
      {
        id: 'n3',
        userId,
        type: 'optin_approved',
        title: 'Approved',
        body: 'You’re approved for Ooty Tea Trails',
        tripId: 'v-life-3',
        target: { screen: 'chatThread', params: { tripId: 'v-life-3' } },
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        read: false
      },
      {
        id: 'n4',
        userId,
        type: 'proposal_locked',
        title: 'Selection Locked',
        body: 'Host locked a bus for Goa Monsoon Escapade',
        tripId: 'v-life-2',
        target: { screen: 'tripDetails', params: { tripId: 'v-life-2' } },
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        read: false
      },
      {
        id: 'n5',
        userId,
        type: 'payment_due',
        title: 'Payment Due',
        body: 'Goa Monsoon Escapade payment is now open',
        tripId: 'v-life-2',
        target: { screen: 'tripDetails', params: { tripId: 'v-life-2' } },
        createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        read: false
      }
    ];
  }

  private createMockTrip(id: string, title: string, loc: string, origin: string, budget: number, status: TripStatus, orgId: string, travelers: CoTraveler[]): Trip {
    const org = this.data.users[orgId];
    return {
      id,
      title,
      location: loc,
      startPoint: origin,
      routeStops: [loc],
      endPoint: origin,
      startDate: getRelativeDate(20),
      endDate: getRelativeDate(25),
      pricePerPersonInr: budget,
      estimatedBudget: budget,
      capacity: 12,
      joinedCount: travelers.length + 1,
      maxTravelers: 12,
      travelModes: [TravelMode.BUS],
      imageUrl: LOCATION_IMAGE_MAP[loc]?.[0] || LOCATION_IMAGE_MAP['Generic'][0],
      tripType: org?.userRole === 'ORGANIZER' ? TripType.ORGANIZER : TripType.INDIVIDUAL,
      womenOnly: false,
      ownerId: orgId,
      createdByUserId: orgId,
      creator: { 
        type: org?.userRole === 'ORGANIZER' ? 'organizer' : 'individual', 
        name: org?.name || 'Host', 
        avatarUrl: org?.avatarUrl,
        companyLogoUrl: org?.userRole === 'ORGANIZER' ? org.avatarUrl : undefined
      },
      organizerId: orgId,
      organizerType: org?.userRole === 'ORGANIZER' ? 'organizer' : 'individual',
      organizerDisplayName: org?.name || 'Host',
      status,
      itinerary: getAutoItinerary(loc, 4),
      participants: travelers.map(t => ({ userId: t.id, status: 'approved', paid: true, joinedAt: '2025-01-01' })),
      coTravelers: travelers
    };
  }

  private injectVishnuLifecycleScenarios(vishnuId: string, todayISO: string) {
    const v = this.data.users[vishnuId];
    
    const t1 = this.createMockTrip("v-life-1", "Himalayan Basecamp Trek", "Manali", "Delhi", 25000, 'OPEN', 'org_elite', []);
    t1.startDate = getRelativeDate(30);
    this.data.trips[t1.id] = t1;
    this.data.memberships[`mem_${t1.id}_${vishnuId}`] = { id: `mem_${t1.id}_${vishnuId}`, tripId: t1.id, userId: vishnuId, state: ParticipationState.APPROVED_UNPAID, paid: false, joinedAt: todayISO };

    const t2 = this.createMockTrip("v-life-2", "Goa Monsoon Escapade", "Goa", "Mumbai", 15000, 'ACTIVE', 'org_backpacker', []);
    t2.startDate = getRelativeDate(-1);
    t2.endDate = getRelativeDate(3);
    this.data.trips[t2.id] = t2;
    this.data.memberships[`mem_${t2.id}_${vishnuId}`] = { id: `mem_${t2.id}_${vishnuId}`, tripId: t2.id, userId: vishnuId, state: ParticipationState.APPROVED_PAID, paid: true, joinedAt: todayISO };

    const t3 = this.createMockTrip("v-life-3", "Ooty Tea Trails", "Ooty", "Chennai", 12000, 'COMPLETED', 'org_elite', []);
    t3.ratingsSubmitted = false;
    t3.startDate = getRelativeDate(-10);
    t3.endDate = getRelativeDate(-5);
    this.data.trips[t3.id] = t3;
    this.data.memberships[`mem_${t3.id}_${vishnuId}`] = { id: `mem_${t3.id}_${vishnuId}`, tripId: t3.id, userId: vishnuId, state: ParticipationState.APPROVED_PAID, paid: true, joinedAt: todayISO };
  }

  // --- Simulations ---
  public simulateIncomingMessage(tripId: string, currentViewingTripId?: string | null) {
    const trip = this.getTripById(tripId);
    if (!trip) return;
    
    this.addChatMessage(tripId, 'system_bot', 'Tribe Bot', "Hey tribe! I found a great spot for dinner tonight. Should we add it to the itinerary?", undefined, 'text');
    
    // Only notify if not looking at the exact thread
    if (tripId !== currentViewingTripId) {
       const vishnuId = 'user_vishnu';
       this.addNotification(vishnuId, 'message', trip.title, 'New message received', tripId, 'chatThread', { tripId });
    }
  }

  public simulateOptInApproved(tripId: string) {
    const vishnuId = 'user_vishnu';
    const id = `mem_${tripId}_${vishnuId}`;
    if (this.data.memberships[id]) {
      this.data.memberships[id].state = ParticipationState.APPROVED_UNPAID;
      const trip = this.getTripById(tripId);
      this.addNotification(vishnuId, 'optin_approved', 'Approved', `You’re approved for ${trip?.title || 'the expedition'}`, tripId, 'chatThread', { tripId });
      this.persist();
    }
  }

  // --- Notifications ---
  getNotifications(): AppNotification[] {
    const userId = this.getSession();
    if (!userId) return [];
    return this.data.notifications.filter(n => n.userId === userId);
  }

  markNotificationRead(id: string) {
    const n = this.data.notifications.find(item => item.id === id);
    if (n) {
      n.read = true;
      this.persist();
    }
  }

  markAllNotificationsRead() {
    const userId = this.getSession();
    this.data.notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    this.persist();
  }

  public addNotification(userId: string, type: NotificationType, title: string, body: string, tripId: string, screen: "chatThread" | "tripDetails" | "tripsTab", params: any) {
    const newN: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      type,
      title,
      body,
      tripId,
      target: { screen, params },
      createdAt: new Date().toISOString(),
      read: false
    };
    this.data.notifications.unshift(newN);
    this.persist();
  }

  // --- Assistant Logic ---

  hasAssistantPosted(tripId: string): boolean {
    const chat = this.data.chats[tripId] || [];
    return chat.some(m => m.userId === ASSISTANT_ID);
  }

  // --- Unread Logic ---
  getUnreadCount(tripId: string): number {
    return this.data.unreadCounts[tripId] || 0;
  }

  resetUnreadCount(tripId: string) {
    if (this.data.unreadCounts[tripId]) {
      this.data.unreadCounts[tripId] = 0;
      this.persist();
    }
  }

  private incrementUnreadCount(tripId: string) {
    this.data.unreadCounts[tripId] = (this.data.unreadCounts[tripId] || 0) + 1;
  }

  // --- Auth ---
  getSession(): string | null {
    return this.data.session.currentUserId;
  }

  setSession(userId: string | null) {
    this.data.session.currentUserId = userId;
    this.data.session.lastLoginAt = userId ? new Date().toISOString() : null;
    this.persist();
  }

  login(loginId: string, pass: string): User | null {
    const user = Object.values(this.data.users).find(u => 
      (u.email.toLowerCase() === loginId.toLowerCase() || u.phone === loginId) && 
      (u.passwordHash === pass || u.password === pass)
    );
    if (user) {
      this.setSession(user.id);
    }
    return user || null;
  }

  findUserByIdentifier(loginId: string): User | null {
    return Object.values(this.data.users).find(u => 
      (u.email.toLowerCase() === loginId.toLowerCase() || u.phone === loginId)
    ) || null;
  }

  isIdentifierTaken(email: string, phone: string, excludeId?: string): boolean {
    return Object.values(this.data.users).some(u => 
      u.id !== excludeId && (u.email.toLowerCase() === email.toLowerCase() || u.phone === phone)
    );
  }

  signup(user: User) {
    const now = new Date().toISOString();
    const newUser: User = {
      ...user,
      createdAt: now,
      updatedAt: now,
      trustProfile: {
          kycVerified: user.kycVerified || false,
          tripsCompleted: 0,
          tripsDropped: 0,
          avgRating: 5.0,
          ratingCount: 0,
          chatFlags: { abusiveCount: 0, toxicCount: 0, spamCount: 0 }
      }
    };
    this.data.users[newUser.id] = newUser;
    this.setSession(newUser.id);
    this.persist();
  }

  // --- Users ---
  getUser(id: string): User | null {
    return this.data.users[id] || null;
  }

  updateUser(user: User) {
    this.data.users[user.id] = { 
      ...user, 
      updatedAt: new Date().toISOString() 
    };
    this.persist();
  }

  getAllUsers(): User[] {
    return Object.values(this.data.users);
  }

  // --- Support ---
  addSupportTicket(ticket: SupportTicket) {
    if (!this.data.tickets) this.data.tickets = [];
    this.data.tickets.push(ticket);
    this.persist();
  }

  // --- Trips ---
  getTrips(filters?: SearchFilters): Trip[] {
    let trips = Object.values(this.data.trips);
    if (filters?.location) {
      trips = trips.filter(t => t.location.toLowerCase().includes(filters.location.toLowerCase()));
    }
    if (filters?.startFrom) {
      trips = trips.filter(t => t.startPoint.toLowerCase().includes(filters.startFrom!.toLowerCase()));
    }
    if (filters?.tripType && filters.tripType !== 'Any') {
      trips = trips.filter(t => t.tripType === filters.tripType);
    }
    
    const currentUserId = this.getSession();
    return trips.map(t => this.hydrateTrip(t, currentUserId));
  }

  getTripById(id: string, userId?: string | null): Trip | null {
    const trip = this.data.trips[id];
    if (!trip) return null;
    return this.hydrateTrip(trip, userId || this.getSession());
  }

  private hydrateTrip(trip: Trip, userId?: string | null): Trip {
    const t = JSON.parse(JSON.stringify(trip)) as Trip; 
    if (userId) {
      const mem = this.data.memberships[`mem_${trip.id}_${userId}`];
      t.userParticipation = mem ? mem.state : ParticipationState.NOT_JOINED;
      
      const tribe = Object.values(this.data.memberships).filter(m => 
        m.tripId === trip.id && (m.state === ParticipationState.APPROVED_PAID || m.state === ParticipationState.APPROVED_UNPAID)
      );
      t.joinedCount = tribe.length + (trip.joinedCount || 1);
      if (t.joinedCount >= t.maxTravelers && t.status === 'OPEN') t.status = 'FULL';
    }

    t.groupTrustScore = computeGroupTrust(t, this.data.users);
    
    return t;
  }

  addTrip(trip: Trip) {
    this.data.trips[trip.id] = trip;
    this.requestToJoin(trip.id, trip.ownerId, true);
    this.persist();
  }

  submitTripRatings(tripId: string, ratings: any[]) {
    const trip = this.data.trips[tripId];
    if (trip) {
      trip.ratingsSubmitted = true;
      this.persist();
    }
  }

  // --- Selections ---
  getTripSelections(tripId: string) {
    return this.data.selections[tripId] || {};
  }

  setTripSelection(tripId: string, category: 'bus' | 'hotel', item: any) {
    if (!this.data.selections[tripId]) this.data.selections[tripId] = {};
    this.data.selections[tripId][category] = item;
    this.persist();
  }

  // --- Memberships ---
  getMemberships(userId: string): TripMembership[] {
    return Object.values(this.data.memberships).filter(m => m.userId === userId);
  }

  requestToJoin(tripId: string, userId: string, autoApprove = false) {
    const id = `mem_${tripId}_${userId}`;
    const user = this.getUser(userId);
    const trip = this.getTripById(tripId);
    
    if (!user || !trip) return;

    const trust = computeIndividualTrust(user);
    const shouldAutoApprove = autoApprove || (user.kycVerified && trust.score10 >= 6.5);

    const state = shouldAutoApprove ? ParticipationState.APPROVED_PAID : ParticipationState.REQUESTED;
    
    this.data.memberships[id] = {
      id,
      tripId,
      userId,
      state,
      paid: shouldAutoApprove,
      joinedAt: formatDateDDMMYYYY(new Date()),
      trustScoreAtJoining: user.trustScore
    };

    if (shouldAutoApprove) {
      this.addChatMessage(tripId, 'system', 'System', `${user.name} joined the tribe.`);
    }

    this.persist();
    return state;
  }

  approveMember(tripId: string, userId: string) {
    const id = `mem_${tripId}_${userId}`;
    if (this.data.memberships[id]) {
      this.data.memberships[id].state = ParticipationState.APPROVED_UNPAID;
      const user = this.getUser(userId);
      const trip = this.getTripById(tripId);
      this.addChatMessage(tripId, 'system', 'System', `${user?.name}'s opt-in was approved by host.`);
      
      // Notify the member
      this.addNotification(
        userId, 
        'optin_approved', 
        'Approved', 
        `You’re approved for ${trip?.title || 'the expedition'}`, 
        tripId, 
        'chatThread', 
        { tripId }
      );

      this.persist();
    }
  }

  markPaid(tripId: string, userId: string) {
    const id = `mem_${tripId}_${userId}`;
    if (this.data.memberships[id]) {
      this.data.memberships[id].state = ParticipationState.APPROVED_PAID;
      this.data.memberships[id].paid = true;
      const user = this.getUser(userId);
      this.addChatMessage(tripId, 'system', 'System', `${user?.name} completed v17_notif_simulationspayment. Expedition confirmed!`);
      this.persist();
    }
  }

  // --- Booking & Proposals ---
  // Updated signature to allow 'FLIGHT' and satisfy calling code in TripRoom.tsx
  proposeOption(tripId: string, type: 'BUS' | 'HOTEL' | 'FLIGHT', userId: string, option: any) {
    const trip = this.data.trips[tripId];
    const user = this.data.users[userId];
    if (!trip || !user) return;

    const propId = `prop_${Date.now()}`;
    const proposal: Proposal = {
      id: propId,
      tripId,
      type,
      optionId: option.id || option.title,
      proposedByUserId: userId,
      userId,
      userName: user.name,
      userAvatar: user.avatarUrl,
      voterIds: [userId],
      title: option.title || option.operator || option.name,
      provider: type === 'BUS' ? 'redBus' : (type === 'FLIGHT' ? 'Airline' : 'MakeMyTrip'),
      pricePerPerson: option.price || option.totalPrice || option.pricePerNight || 0,
      departTime: option.departTime,
      arriveTime: option.arriveTime,
      createdAt: formatDateDDMMYYYY(new Date()),
      messageText: `${user.name} proposed ${type}: ${option.operator || option.name || option.title}`,
      votes: { [userId]: 'YES' }
    };

    const target = type.toLowerCase() as 'bus' | 'hotel' | 'flight';
    // Added missing 'flight' property to satisfy TripBookingState interface
    if (!trip.bookingStateObj) {
      trip.bookingStateObj = { 
        bus: { proposals: [], lockedProposalId: null, votes: {} }, 
        hotel: { proposals: [], lockedProposalId: null, votes: {} }, 
        flight: { proposals: [], lockedProposalId: null, votes: {} },
        lifecycleStatus: BookingLifecycleStatus.PLANNING, 
        paymentEnabled: false 
      };
    }
    
    trip.bookingStateObj[target].proposals.push(proposal);
    this.addChatMessage(tripId, 'system', 'System', proposal.messageText, proposal);
    this.persist();
    return proposal;
  }

  // Updated signature to allow 'FLIGHT'
  voteOnProposal(tripId: string, type: 'BUS' | 'HOTEL' | 'FLIGHT', proposalId: string, userId: string, vote: 'YES' | 'NO') {
    const trip = this.data.trips[tripId];
    const target = type.toLowerCase() as 'bus' | 'hotel' | 'flight';
    const prop = trip.bookingStateObj?.[target].proposals.find(p => p.id === proposalId);
    if (prop) {
      if (vote === 'YES' && !prop.voterIds.includes(userId)) prop.voterIds.push(userId);
      else if (vote === 'NO') prop.voterIds = prop.voterIds.filter(id => id !== userId);
      prop.votes[userId] = vote;
      this.persist();
    }
  }

  // Updated signature to allow 'FLIGHT'
  lockProposal(tripId: string, type: 'BUS' | 'HOTEL' | 'FLIGHT', proposalId: string) {
    const trip = this.data.trips[tripId];
    const target = type.toLowerCase() as 'bus' | 'hotel' | 'flight';
    const prop = trip.bookingStateObj?.[target].proposals.find(p => p.id === proposalId);
    if (prop && trip.bookingStateObj) {
      trip.bookingStateObj[target].lockedProposalId = proposalId;
      this.addChatMessage(tripId, 'system', 'System', `Host locked ${type}: ${prop.title}`);
      
      // Notify participants
      const participants = trip.participants.filter(p => p.status === 'approved');
      participants.forEach(p => {
        if (p.userId !== this.getSession()) {
          this.addNotification(
            p.userId, 
            'proposal_locked', 
            'Selection Locked', 
            `Host locked a ${type.toLowerCase()} for ${trip.title}`, 
            tripId, 
            'tripDetails', 
            { tripId }
          );
        }
      });

      if (trip.bookingStateObj.bus.lockedProposalId && trip.bookingStateObj.hotel.lockedProposalId) {
        trip.bookingStateObj.paymentEnabled = true;
        trip.bookingStateObj.lifecycleStatus = BookingLifecycleStatus.PAYMENT_OPEN;
        this.addChatMessage(tripId, 'system', 'System', "Booking Phase complete. Payments are now OPEN.");
        
        // Payment due notifications
        participants.forEach(p => {
          if (p.userId !== this.getSession()) {
            this.addNotification(
              p.userId, 
              'payment_due', 
              'Payment Open', 
              `${trip.title} payment is now open`, 
              tripId, 
              'tripDetails', 
              { tripId }
            );
          }
        });
      }
      this.persist();
    }
  }

  // --- Ratings ---
  saveTripRating(rating: Omit<TripRating, 'id' | 'createdAt'>) {
    const existingIdx = this.data.ratings.findIndex(r => 
      r.tripId === rating.tripId && 
      r.raterUserId === rating.raterUserId && 
      r.ratedUserId === rating.ratedUserId
    );

    const fullRating: TripRating = {
      ...rating,
      id: existingIdx !== -1 ? this.data.ratings[existingIdx].id : `rate_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: existingIdx !== -1 ? this.data.ratings[existingIdx].createdAt : new Date().toISOString()
    };

    if (existingIdx !== -1) {
      this.data.ratings[existingIdx] = fullRating;
    } else {
      this.data.ratings.push(fullRating);
    }

    this.applyRatingToProfile(rating.ratedUserId, rating.respect, rating.reliability, rating.cooperation, rating.safety);

    this.persist();
  }

  private applyRatingToProfile(userId: string, resp: number, rel: number, coop: number, safe: number) {
      const user = this.data.users[userId];
      if (!user) return;

      const profile = user.trustProfile || {
          kycVerified: user.kycVerified || false,
          tripsCompleted: user.historySignals?.pastTripsCompleted || 0,
          tripsDropped: user.historySignals?.pastDropoffs || 0,
          avgRating: user.historySignals?.avgRating || 0,
          ratingCount: user.historySignals?.pastTripsCompleted || 0,
          chatFlags: { abusiveCount: 0, toxicCount: 0, spamCount: 0 }
      };

      const stars = (resp + rel + coop + safe) / 4;
      const currentSum = profile.avgRating * profile.ratingCount;
      const newCount = profile.ratingCount + 1;
      const newAvg = parseFloat(((currentSum + stars) / newCount).toFixed(2));

      user.trustProfile = {
          ...profile,
          ratingCount: newCount,
          avgRating: newAvg
      };
  }

  getTripRatingsByRater(tripId: string, raterUserId: string): TripRating[] {
    return this.data.ratings.filter(r => r.tripId === tripId && r.raterUserId === raterUserId);
  }

  // --- Organizer Ratings ---
  saveOrganizerRating(rating: Omit<OrganizerRating, 'id' | 'createdAt'>) {
    const id = `org_rate_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newRating: OrganizerRating = {
      ...rating,
      id,
      createdAt: new Date().toISOString()
    };
    
    this.data.organizerRatings.push(newRating);
    this.updateOrganizerStats(rating.organizerId, rating.organizerType);
    this.persist();
  }

  private updateOrganizerStats(organizerId: string, organizerType: OrganizerType) {
    const ratings = this.data.organizerRatings.filter(r => r.organizerId === organizerId);
    const avgStars = ratings.length > 0 
      ? ratings.reduce((acc, r) => acc + r.stars, 0) / ratings.length 
      : 0;
    
    this.data.organizerProfileStats[organizerId] = {
      organizerId,
      organizerType,
      avgStars: parseFloat(avgStars.toFixed(1)),
      ratingCount: ratings.length,
      lastUpdatedAt: new Date().toISOString()
    };
  }

  getOrganizerStats(organizerId: string): OrganizerProfileStats | null {
    return this.data.organizerProfileStats[organizerId] || null;
  }

  hasUserRatedOrganizerForTrip(userId: string, tripId: string): boolean {
    return this.data.organizerRatings.some(r => r.raterUserId === userId && r.tripId === tripId);
  }

  // --- Chat ---
  getChatMessages(tripId: string): ChatMessage[] {
    return this.data.chats[tripId] || [];
  }

  addChatMessage(tripId: string, userId: string, userName: string, text: string, proposal?: Proposal, type: any = "text", payload?: any) {
    if (!this.data.chats[tripId]) this.data.chats[tripId] = [];
    const msg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tripId,
      userId,
      userName,
      text,
      timestamp: new Date().toISOString(),
      proposal,
      type,
      payload
    };
    this.data.chats[tripId].push(msg);

    // Unread count tracking
    const currentSessionUserId = this.getSession();
    if (userId !== currentSessionUserId) {
      this.incrementUnreadCount(tripId);
    }

    this.persist();
    return msg;
  }

  resetDb() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DB_VERSION_KEY);
    window.location.reload();
  }
}

export const db = new MockDb();