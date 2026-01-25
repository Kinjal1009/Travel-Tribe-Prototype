import { 
  User, Trip, TripMembership, Proposal, ChatMessage, 
  SearchFilters, TravelMode, KycStatus, TripType, ItineraryDay, ParticipationState, CoTraveler, BookingLifecycleStatus, SupportTicket, AuthSession, TripRating, OrganizerRating, OrganizerProfileStats, OrganizerType, TripStatus, AssistantPicklistPayload, AppNotification, NotificationType
} from '../types';
import { MOCK_TRIPS, VISHNU_USER, getAutoItinerary, LOCATION_IMAGE_MAP, INDIAN_CITIES } from './mockData';
import { formatDateDDMMYYYY, getRelativeDate } from './dateUtils';
import { computeIndividualTrust, computeGroupTrust } from './trustScoreEngine';
import { getTravelOptions, getHotelOptions } from './mockBookingApis';

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
const CURRENT_DB_VERSION = 'v20_flight_proposals'; 

export const ASSISTANT_ID = 'VA_NONAME';
export const ASSISTANT_NAME = 'Travel Tribe Guide';
export const DEV_NOTIF_TEST = true;

class MockDb {
  private data: DbSchema;

  constructor() {
    this.data = this.load();
    if (localStorage.getItem(DB_VERSION_KEY) !== CURRENT_DB_VERSION) {
      this.seed();
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

    const upcomingHosts = [
      { id: 'user_aditi', name: 'Aditi Sharma', firstName: 'Aditi' },
      { id: 'user_rahul_iyer', name: 'Rahul Iyer', firstName: 'Rahul' },
      { id: 'user_sneha_m', name: 'Sneha Menon', firstName: 'Sneha' },
      { id: 'user_karthik_v', name: 'Karthik V', firstName: 'Karthik' }
    ];

    upcomingHosts.forEach(h => {
      this.data.users[h.id] = {
        id: h.id,
        name: h.name,
        firstName: h.firstName,
        lastName: h.name.split(' ')[1] || '',
        email: `${h.id}@example.com`,
        phone: `90000000${h.id.length}`,
        homeCity: 'Bengaluru',
        authProvider: 'form',
        createdAt: now,
        updatedAt: now,
        gender: 'Female',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${h.firstName}`,
        kycStatus: KycStatus.VERIFIED,
        kycVerified: true,
        trustScore: 88,
        trustTier: 'High',
        userRole: 'INDIVIDUAL',
        isProfileComplete: true
      };
    });

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

    let tripCounter = 0;
    const vishnuVibe = vishnu.vibeProfile!;

    // Rishikesh Priority Trip (100% Vibe Match)
    const tripRishi = this.createMockTrip(`v-rishi-${tripCounter++}`, "Yoga & Rapids: Rishikesh Vibe", "Rishikesh", "Delhi", 14500, 'OPEN', 'org_luxury', createVibeGroup(vishnuVibe, 'perfect'));
    tripRishi.isFeatured = true;
    tripRishi.featuredScore = 100;
    this.data.trips[tripRishi.id] = tripRishi;

    const trip100 = this.createMockTrip(`v-100-${tripCounter++}`, "The Ultimate Vibe Match", "Coorg", "Bengaluru", 12000, 'OPEN', 'org_elite', createVibeGroup(vishnuVibe, 'perfect'));
    this.data.trips[trip100.id] = trip100;

    this.injectVishnuLifecycleScenarios(vishnu.id, todayISO);
    this.injectUpcomingLockedTrips(vishnu.id);

    localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
    this.persist();
  }

  private injectUpcomingLockedTrips(vishnuId: string) {
    const now = new Date().toISOString();

    const createLockedTrip = (id: string, title: string, loc: string, hostId: string, startDate: string, endDate: string, busPrice: number, hotelPrice: number, vibePercent: number, isPartner = false) => {
      const host = this.data.users[hostId];
      const trip: Trip = {
        ...this.createMockTrip(id, title, loc, 'Bengaluru', busPrice + hotelPrice, 'OPEN', hostId, []),
        startDate,
        endDate,
        vibeMatchPercent: vibePercent,
        bookingStateObj: {
          bus: {
            proposals: [{
              id: `prop_bus_${id}`,
              tripId: id,
              type: 'BUS',
              optionId: 'bus_opt_1',
              proposedByUserId: hostId,
              userId: hostId,
              userName: host.name,
              userAvatar: host.avatarUrl,
              voterIds: [hostId, vishnuId],
              title: isPartner ? 'Travel Tribe Partner Bus' : 'Best Rated redBus Express',
              provider: 'redBus',
              pricePerPerson: busPrice,
              departTime: '21:30',
              arriveTime: '06:30',
              createdAt: now,
              messageText: `Host locked BUS: Best Rated redBus Express`,
              votes: {}
            }],
            lockedProposalId: `prop_bus_${id}`,
            votes: {}
          },
          hotel: {
            proposals: [{
              id: `prop_hotel_${id}`,
              tripId: id,
              type: 'HOTEL',
              optionId: 'hotel_opt_1',
              proposedByUserId: hostId,
              userId: hostId,
              userName: host.name,
              userAvatar: host.avatarUrl,
              voterIds: [hostId, vishnuId],
              title: !isPartner ? 'MakeMyTrip Premium Resort' : 'Travel Tribe Partner Resort',
              provider: 'MakeMyTrip',
              pricePerPerson: hotelPrice,
              createdAt: now,
              messageText: `Host locked HOTEL: MakeMyTrip Premium Resort`,
              votes: {}
            }],
            lockedProposalId: `prop_hotel_${id}`,
            votes: {}
          },
          flight: { proposals: [], lockedProposalId: null, votes: {} },
          lifecycleStatus: BookingLifecycleStatus.PAYMENT_OPEN,
          paymentEnabled: true
        }
      };

      this.data.trips[id] = trip;
      this.data.memberships[`mem_${id}_${vishnuId}`] = {
        id: `mem_${id}_${vishnuId}`,
        tripId: id,
        userId: vishnuId,
        state: ParticipationState.APPROVED_UNPAID,
        paid: false,
        joinedAt: '2025-01-10'
      };

      this.data.chats[id] = [
        { id: `sys_1_${id}`, tripId: id, userId: 'system', userName: 'System', text: `Host Locked Bus: ${trip.bookingStateObj!.bus.proposals[0].title}`, timestamp: now },
        { id: `sys_2_${id}`, tripId: id, userId: 'system', userName: 'System', text: `Host Locked Hotel: ${trip.bookingStateObj!.hotel.proposals[0].title}`, timestamp: now },
        { id: `sys_3_${id}`, tripId: id, userId: 'system', userName: 'System', text: "Booking Phase Complete. Payments Are Now Open.", timestamp: now }
      ];
    };

    createLockedTrip('up-goa-01', 'Goa Monsoon Escapade', 'Goa', 'user_aditi', '2026-02-13', '2026-02-17', 1450, 8500, 75);
    createLockedTrip('up-coorg-01', 'Coorg Coffee Trails', 'Coorg', 'user_rahul_iyer', '2026-02-20', '2026-02-24', 1250, 6800, 100);
    createLockedTrip('up-pondy-01', 'Pondicherry Chill Weekend', 'Pondicherry', 'user_sneha_m', '2026-02-28', '2026-03-01', 950, 4200, 50);
    createLockedTrip('up-ooty-01', 'Ooty Tea Trails (Partner Exclusive)', 'Ooty', 'user_karthik_v', '2026-03-05', '2026-03-08', 1100, 5500, 25, true);
  }

  private createMockTrip(id: string, title: string, loc: string, origin: string, budget: number, status: TripStatus, orgId: string, travelers: CoTraveler[]): Trip {
    const org = this.data.users[orgId];
    return {
      id, title, location: loc, startPoint: origin, routeStops: [loc], endPoint: origin, startDate: getRelativeDate(20), endDate: getRelativeDate(25), pricePerPersonInr: budget, estimatedBudget: budget, capacity: 12, joinedCount: travelers.length + 1, maxTravelers: 12, travelModes: [TravelMode.BUS], imageUrl: LOCATION_IMAGE_MAP[loc]?.[0] || LOCATION_IMAGE_MAP['Generic'][0], tripType: org?.userRole === 'ORGANIZER' ? TripType.ORGANIZER : TripType.INDIVIDUAL, womenOnly: false, ownerId: orgId, createdByUserId: orgId, creator: { type: org?.userRole === 'ORGANIZER' ? 'organizer' : 'individual', name: org?.name || 'Host', avatarUrl: org?.avatarUrl, companyLogoUrl: org?.userRole === 'ORGANIZER' ? org.avatarUrl : undefined }, organizerId: orgId, organizerType: org?.userRole === 'ORGANIZER' ? 'organizer' : 'individual', organizerDisplayName: org?.name || 'Host', status, itinerary: getAutoItinerary(loc, 4), participants: travelers.map(t => ({ userId: t.id, status: 'approved', paid: true, joinedAt: '2025-01-01' })), coTravelers: travelers };
  }

  private injectVishnuLifecycleScenarios(vishnuId: string, todayISO: string) {
    const t1 = this.createMockTrip("v-life-1", "Himalayan Basecamp Trek", "Manali", "Delhi", 25000, 'OPEN', vishnuId, []);
    t1.startDate = getRelativeDate(30);
    this.data.trips[t1.id] = t1;

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

  private addNotification(userId: string, type: NotificationType, title: string, body: string, tripId: string, screen: "chatThread" | "tripDetails" | "tripsTab", params: any) {
    const newN: AppNotification = { id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, userId, type, title, body, tripId, target: { screen, params }, createdAt: new Date().toISOString(), read: false };
    this.data.notifications.unshift(newN);
    this.persist();
  }

  simulateIncomingMessage(tripId: string, activeTripId: string | null) {
    const trip = this.getTripById(tripId);
    if (!trip) return;
    if (tripId !== activeTripId) {
      this.addNotification(this.getSession() || '', 'message', `New Message in ${trip.title}`, "Hey tribe! Anyone up for a sunrise trek tomorrow?", tripId, 'chatThread', { tripId });
    }
    this.addChatMessage(tripId, 'traveler_x', 'Rahul', "Hey tribe! Anyone up for a sunrise trek tomorrow?");
  }

  simulateOptInApproved(tripId: string) {
    const userId = this.getSession();
    if (!userId) return;
    const trip = this.getTripById(tripId);
    if (!trip) return;
    this.approveMember(tripId, userId);
    this.addNotification(userId, 'optin_approved', "Opt-in Approved! ✅", `The host of "${trip.title}" has approved your request. Chat is now unlocked.`, tripId, 'tripDetails', { tripId });
  }

  hasAssistantPosted(tripId: string): boolean {
    const chat = this.data.chats[tripId] || [];
    return chat.some(m => m.userId === ASSISTANT_ID);
  }

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

  getSession(): string | null { return this.data.session.currentUserId; }
  setSession(userId: string | null) { this.data.session.currentUserId = userId; this.data.session.lastLoginAt = userId ? new Date().toISOString() : null; this.persist(); }

  login(loginId: string, pass: string): User | null {
    const user = Object.values(this.data.users).find(u => (u.email.toLowerCase() === loginId.toLowerCase() || u.phone === loginId) && (u.passwordHash === pass || u.password === pass));
    if (user) this.setSession(user.id);
    return user || null;
  }

  findUserByIdentifier(loginId: string): User | null {
    return Object.values(this.data.users).find(u => (u.email.toLowerCase() === loginId.toLowerCase() || u.phone === loginId)) || null;
  }

  isIdentifierTaken(email: string, phone: string, excludeId?: string): boolean {
    return Object.values(this.data.users).some(u => u.id !== excludeId && (u.email.toLowerCase() === email.toLowerCase() || u.phone === phone));
  }

  signup(user: User) {
    const now = new Date().toISOString();
    const newUser: User = { ...user, createdAt: now, updatedAt: now, trustProfile: { kycVerified: user.kycVerified || false, tripsCompleted: 0, tripsDropped: 0, avgRating: 5.0, ratingCount: 0, chatFlags: { abusiveCount: 0, toxicCount: 0, spamCount: 0 } } };
    this.data.users[newUser.id] = newUser;
    this.setSession(newUser.id);
    this.persist();
  }

  getUser(id: string): User | null { return this.data.users[id] || null; }
  updateUser(user: User) { this.data.users[user.id] = { ...user, updatedAt: new Date().toISOString() }; this.persist(); }
  getAllUsers(): User[] { return Object.values(this.data.users); }
  addSupportTicket(ticket: SupportTicket) { if (!this.data.tickets) this.data.tickets = []; this.data.tickets.push(ticket); this.persist(); }

  getTrips(filters?: SearchFilters): Trip[] {
    let trips = Object.values(this.data.trips);
    if (filters?.location) trips = trips.filter(t => t.location.toLowerCase().includes(filters.location.toLowerCase()));
    if (filters?.startFrom) trips = trips.filter(t => t.startPoint.toLowerCase().includes(filters.startFrom!.toLowerCase()));
    if (filters?.tripType && filters.tripType !== 'Any') trips = trips.filter(t => t.tripType === filters.tripType);
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
      const tribe = Object.values(this.data.memberships).filter(m => m.tripId === trip.id && (m.state === ParticipationState.APPROVED_PAID || m.state === ParticipationState.APPROVED_UNPAID));
      t.joinedCount = tribe.length + (trip.joinedCount || 1);
      
      t.participants = Object.values(this.data.memberships)
        .filter(m => m.tripId === trip.id)
        .map(m => ({
          userId: m.userId,
          status: (m.state === ParticipationState.REQUESTED ? 'pending' : (m.state === ParticipationState.DENIED ? 'denied' : 'approved')) as any,
          paid: m.paid,
          joinedAt: m.joinedAt
        }));

      if (t.joinedCount >= t.maxTravelers && t.status === 'OPEN') t.status = 'FULL';
    }
    t.groupTrustScore = computeGroupTrust(t, this.data.users);
    return t;
  }

  addTrip(trip: Trip) { this.data.trips[trip.id] = trip; this.requestToJoin(trip.id, trip.ownerId, true); this.persist(); }
  submitTripRatings(tripId: string, ratings: any[]) { const trip = this.data.trips[tripId]; if (trip) { trip.ratingsSubmitted = true; this.persist(); } }
  getTripSelections(tripId: string) { return this.data.selections[tripId] || {}; }
  setTripSelection(tripId: string, category: 'bus' | 'hotel', item: any) { if (!this.data.selections[tripId]) this.data.selections[tripId] = {}; this.data.selections[tripId][category] = item; this.persist(); }

  getMemberships(userId: string): TripMembership[] { return Object.values(this.data.memberships).filter(m => m.userId === userId); }

  requestToJoin(tripId: string, userId: string, autoApprove = false) {
    const id = `mem_${tripId}_${userId}`;
    const user = this.getUser(userId);
    const trip = this.getTripById(tripId);
    if (!user || !trip) return;
    const trust = computeIndividualTrust(user);
    const shouldAutoApprove = autoApprove || (user.kycVerified && trust.score10 >= 6.5);
    const state = shouldAutoApprove ? ParticipationState.APPROVED_PAID : ParticipationState.REQUESTED;
    this.data.memberships[id] = { id, tripId, userId, state, paid: shouldAutoApprove, joinedAt: formatDateDDMMYYYY(new Date()), trustScoreAtJoining: user.trustScore };
    if (shouldAutoApprove) this.addChatMessage(tripId, 'system', 'System', `${user.name} joined the tribe.`);
    this.persist();
    return state;
  }

  approveMember(tripId: string, userId: string) {
    const id = `mem_${tripId}_${userId}`;
    if (this.data.memberships[id]) {
      this.data.memberships[id].state = ParticipationState.APPROVED_UNPAID;
      const user = this.getUser(userId);
      this.addChatMessage(tripId, 'system', 'System', `${user?.name}'s opt-in was approved by host.`);
      this.persist();
    }
  }

  markPaid(tripId: string, userId: string, amount?: number) {
    const id = `mem_${tripId}_${userId}`;
    if (this.data.memberships[id]) {
      const user = this.getUser(userId);
      this.data.memberships[id].state = ParticipationState.APPROVED_PAID;
      this.data.memberships[id].paid = true;
      const amtStr = amount ? ` ₹${amount.toLocaleString()}` : '';
      this.addChatMessage(tripId, 'system', 'System', `💳 ${user?.firstName} paid${amtStr}.`);
      this.persist();
    }
  }

  proposeOption(tripId: string, type: 'BUS' | 'HOTEL' | 'FLIGHT', userId: string, option: any) {
    const trip = this.data.trips[tripId];
    const user = this.data.users[userId];
    if (!trip || !user) return;
    const propId = `prop_${Date.now()}`;
    const title = option.title || option.operator || option.name || option.airline;
    const isBus = type === 'BUS';
    const isFlight = type === 'FLIGHT';
    
    let messageText = '';
    if (isBus) messageText = `🚌 ${user.firstName} proposed BUS: ${title}, ₹${option.price}`;
    else if (isFlight) messageText = `✈️ ${user.firstName} proposed FLIGHT: ${title}, ₹${option.price}`;
    else messageText = `🏨 ${user.firstName} proposed STAY: ${title}, ₹${option.pricePerNight || option.totalPrice}`;

    const proposal: Proposal = { 
      id: propId, tripId, type, optionId: option.id || option.title || option.flight_number || title, 
      proposedByUserId: userId, userId, userName: user.name, userAvatar: user.avatarUrl, 
      voterIds: [userId], title, provider: isBus ? 'redBus' : (isFlight ? 'Google Flights' : 'MakeMyTrip'), 
      pricePerPerson: option.price || option.totalPrice || option.pricePerNight || 0, 
      departTime: option.departTime || option.departure_time, arriveTime: option.arriveTime || option.arrival_time, 
      createdAt: formatDateDDMMYYYY(new Date()), messageText, votes: { [userId]: 'YES' } 
    };
    const target = type.toLowerCase() as 'bus' | 'hotel' | 'flight';
    if (!trip.bookingStateObj) {
      trip.bookingStateObj = { bus: { proposals: [], lockedProposalId: null, votes: {} }, flight: { proposals: [], lockedProposalId: null, votes: {} }, hotel: { proposals: [], lockedProposalId: null, votes: {} }, lifecycleStatus: BookingLifecycleStatus.PLANNING, paymentEnabled: false };
    }
    trip.bookingStateObj[target].proposals.push(proposal);
    this.addChatMessage(tripId, 'system', 'System', messageText, proposal);
    this.persist();
    return proposal;
  }

  voteOnProposal(tripId: string, type: 'BUS' | 'HOTEL' | 'FLIGHT', proposalId: string, userId: string, vote: 'YES' | 'NO') {
    const trip = this.data.trips[tripId];
    const user = this.data.users[userId];
    const target = type.toLowerCase() as 'bus' | 'hotel' | 'flight';
    const prop = trip.bookingStateObj?.[target].proposals.find(p => p.id === proposalId);
    if (prop && user) {
      if (vote === 'YES' && !prop.voterIds.includes(userId)) {
        prop.voterIds.push(userId);
        this.addChatMessage(tripId, 'system', 'System', `✅ ${user.firstName} agreed to ${prop.title}`);
      } else if (vote === 'NO') {
        prop.voterIds = prop.voterIds.filter(id => id !== userId);
      }
      prop.votes[userId] = vote;
      this.persist();
    }
  }

  lockProposal(tripId: string, type: 'BUS' | 'HOTEL' | 'FLIGHT', proposalId: string) {
    const trip = this.data.trips[tripId];
    const target = type.toLowerCase() as 'bus' | 'hotel' | 'flight';
    const prop = trip.bookingStateObj?.[target].proposals.find(p => p.id === proposalId);
    if (prop && trip.bookingStateObj) {
      trip.bookingStateObj[target].lockedProposalId = proposalId;
      this.addChatMessage(tripId, 'system', 'System', `Host locked ${type}: ${prop.title}`);
      
      const travelLocked = trip.bookingStateObj.bus.lockedProposalId || trip.bookingStateObj.flight.lockedProposalId;
      if (travelLocked && trip.bookingStateObj.hotel.lockedProposalId) {
        trip.bookingStateObj.paymentEnabled = true;
        trip.bookingStateObj.lifecycleStatus = BookingLifecycleStatus.PAYMENT_OPEN;
        this.addChatMessage(tripId, 'system', 'System', "Booking Phase Complete. Payments Are Now Open.");
      }
      this.persist();
    }
  }

  saveTripRating(rating: Omit<TripRating, 'id' | 'createdAt'>) {
    const existingIdx = this.data.ratings.findIndex(r => r.tripId === rating.tripId && r.raterUserId === rating.raterUserId && r.ratedUserId === rating.ratedUserId);
    const fullRating: TripRating = { ...rating, id: existingIdx !== -1 ? this.data.ratings[existingIdx].id : `rate_${Date.now()}_${Math.floor(Math.random() * 1000)}`, createdAt: existingIdx !== -1 ? this.data.ratings[existingIdx].createdAt : new Date().toISOString() };
    if (existingIdx !== -1) { this.data.ratings[existingIdx] = fullRating; } else { this.data.ratings.push(fullRating); }
    this.applyRatingToProfile(rating.ratedUserId, rating.respect, rating.reliability, rating.cooperation, rating.safety);
    this.persist();
  }

  private applyRatingToProfile(userId: string, resp: number, rel: number, coop: number, safe: number) {
    const user = this.data.users[userId];
    if (!user) return;
    const profile = user.trustProfile || { kycVerified: user.kycVerified || false, tripsCompleted: user.historySignals?.pastTripsCompleted || 0, tripsDropped: user.historySignals?.pastDropoffs || 0, avgRating: user.historySignals?.avgRating || 0, ratingCount: user.historySignals?.pastTripsCompleted || 0, chatFlags: { abusiveCount: 0, toxicCount: 0, spamCount: 0 } };
    const stars = (resp + rel + coop + safe) / 4;
    const currentSum = profile.avgRating * profile.ratingCount;
    const newCount = profile.ratingCount + 1;
    const newAvg = parseFloat(((currentSum + stars) / newCount).toFixed(2));
    user.trustProfile = { ...profile, ratingCount: newCount, avgRating: newAvg };
  }

  getTripRatingsByRater(tripId: string, raterUserId: string): TripRating[] { return this.data.ratings.filter(r => r.tripId === tripId && r.raterUserId === raterUserId); }

  saveOrganizerRating(rating: Omit<OrganizerRating, 'id' | 'createdAt'>) {
    const id = `org_rate_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newRating: OrganizerRating = { ...rating, id, createdAt: new Date().toISOString() };
    this.data.organizerRatings.push(newRating);
    this.updateOrganizerStats(rating.organizerId, rating.organizerType);
    this.persist();
  }

  private updateOrganizerStats(organizerId: string, organizerType: OrganizerType) {
    const ratings = this.data.organizerRatings.filter(r => r.organizerId === organizerId);
    const avgStars = ratings.length > 0 ? ratings.reduce((acc, r) => acc + r.stars, 0) / ratings.length : 0;
    this.data.organizerProfileStats[organizerId] = { organizerId, organizerType, avgStars: parseFloat(avgStars.toFixed(1)), ratingCount: ratings.length, lastUpdatedAt: new Date().toISOString() };
  }

  getOrganizerStats(organizerId: string): OrganizerProfileStats | null { return this.data.organizerProfileStats[organizerId] || null; }
  hasUserRatedOrganizerForTrip(userId: string, tripId: string): boolean { return this.data.organizerRatings.some(r => r.raterUserId === userId && r.tripId === tripId); }

  getChatMessages(tripId: string): ChatMessage[] { return this.data.chats[tripId] || []; }
  addChatMessage(tripId: string, userId: string, userName: string, text: string, proposal?: Proposal, type: any = "text", payload?: any) {
    if (!this.data.chats[tripId]) this.data.chats[tripId] = [];
    const msg: ChatMessage = { id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, tripId, userId, userName, text, timestamp: new Date().toISOString(), proposal, type, payload };
    this.data.chats[tripId].push(msg);
    const currentSessionUserId = this.getSession();
    if (userId !== currentSessionUserId) {
      this.incrementUnreadCount(tripId);
    }
    this.persist();
    return msg;
  }

  resetDb() { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(DB_VERSION_KEY); window.location.reload(); }
}

export const db = new MockDb();