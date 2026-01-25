import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trip, User, SearchFilters, VibeProfile, Currency, KycStatus, SocialProfiles, ParticipationState, EmergencyContact as IEmergencyContact, SupportTicket, AppNotification } from './types';
import { db, DEV_NOTIF_TEST } from './lib/mockDb';
import TopAppBar from './components/TopAppBar';
import BottomNav from './components/BottomNav';
import VibeModal from './components/VibeModal';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Kyc from './pages/Kyc';
import Profile from './pages/Profile';
import TripDetails from './pages/TripDetails';
import TripRoom from './pages/TripRoom';
import MyTrips from './pages/MyTrips';
import ChatInbox from './pages/ChatInbox';
import Contact from './pages/Contact';
import About from './pages/About';
import InitiateTrip from './pages/InitiateTrip';
import SOSModal from './components/SOSModal';
import EditProfile from './pages/EditProfile';
import EmergencyContact from './pages/EmergencyContact';
import PaymentMethods from './pages/PaymentMethods';
import HelpSupport from './pages/HelpSupport';
import RateTribe from './pages/RateTribe';
import FlightSearch from './pages/FlightSearch';
import TripCard from './components/TripCard';
import { computeVibeMatch } from './lib/vibeEngine';
import VibeCheckScreen from './pages/VibeCheckScreen';

const VIBE_EXPIRY_DAYS = 14;

type IntendedAction = 
  | { type: 'SEARCH'; filters: SearchFilters }
  | { type: 'JOIN'; tripId: string }
  | { type: 'VIBE' }
  | { type: 'TAB'; tabId: string };

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [user, setUser] = useState<User | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Trip[] | null>(null);
  const [showVibeModal, setShowVibeModal] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null);
  const [sosTrip, setSosTrip] = useState<Trip | null>(null);
  const [currency, setCurrency] = useState<Currency>('INR');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [intendedAction, setIntendedAction] = useState<IntendedAction | null>(null);

  useEffect(() => {
    const sessionUserId = db.getSession();
    if (sessionUserId) {
      const u = db.getUser(sessionUserId);
      if (u && u.isProfileComplete) {
        setUser(u);
      } else {
        db.setSession(null);
        if (!['home', 'about', 'contact'].includes(currentPage)) {
          setCurrentPage('auth');
        }
      }
    }
  }, []);

  useEffect(() => {
    if (DEV_NOTIF_TEST && user?.id === 'user_vishnu') {
      const t1 = setTimeout(() => {
        const isLookingAtGoa = currentPage === 'trip-room' && selectedTripId === 'v-life-2';
        db.simulateIncomingMessage('v-life-2', isLookingAtGoa ? 'v-life-2' : null);
      }, 8000);
      const t2 = setTimeout(() => {
        db.simulateOptInApproved('v-life-1');
      }, 15000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [user, currentPage, selectedTripId]);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const updateUserData = useCallback((patch: Partial<User>) => {
    if (!user) return;
    const next = { ...user, ...patch };
    db.updateUser(next);
    setUser(next);
  }, [user]);

  const executeSearch = useCallback((filters: SearchFilters, vibeOverride?: VibeProfile) => {
    const rawTrips = db.getTrips(filters);
    const activeVibe = vibeOverride || user?.vibeProfile;
    const tripsWithVibe = rawTrips.map(t => ({
      ...t,
      vibeMatchPercent: activeVibe ? (computeVibeMatch(activeVibe, t.coTravelers) ?? 0) : 0
    }));
  
    const sorted = tripsWithVibe.sort((a, b) => (b.vibeMatchPercent || 0) - (a.vibeMatchPercent || 0));
    setSearchResults(sorted);
    setCurrentPage('search-results');
  }, [user]);

  const handleSearch = (filters: SearchFilters) => {
    if (!user) {
      setSuccessToast("Sign in to personalize your tribe matches.");
      setIntendedAction({ type: 'SEARCH', filters });
      setCurrentPage('auth');
      return;
    }
    setSearchFilters(filters);
    // Mandatory Vibe Check only for explicit Search via button
    setCurrentPage('vibe-check');
  };

  const handleVibeComplete = (profile: VibeProfile) => {
    updateUserData({ vibeProfile: profile, lastVibeCheckAt: new Date().toISOString() });
    setShowVibeModal(false);
    if (searchFilters) executeSearch(searchFilters, profile);
  };

  const handleAuthComplete = (u: User) => {
    db.setSession(u.id);
    setUser(u);
    if (intendedAction) {
      const action = intendedAction;
      setIntendedAction(null);
      switch (action.type) {
        case 'SEARCH': handleSearch(action.filters); break;
        case 'JOIN': setSelectedTripId(action.tripId); setCurrentPage('trip-details'); break;
        case 'VIBE': setShowVibeModal(true); break;
        case 'TAB': setCurrentPage(action.tabId); break;
      }
    } else {
      setCurrentPage('home');
    }
  };

  const activeTripForHeader = useMemo(() => {
    if (!user) return null;
    return db.getTrips().find(t => t.status === 'ACTIVE' && t.userParticipation === ParticipationState.APPROVED_PAID) || null;
  }, [user, currentPage]);

  const navigateToTrip = (id: string) => {
    const t = db.getTripById(id);
    if (!t) { setCurrentPage('my-trips'); return; }
    setSelectedTripId(id);
    setCurrentPage('trip-details');
    window.scrollTo(0, 0);
  };

  const handleTabChange = (tab: string) => {
    if (tab.startsWith('deep-link-')) {
      const allNotifications = db.getNotifications();
      const n = allNotifications.find(item => item.id === tab.replace('deep-link-', ''));
      if (!n) return;
      db.markNotificationRead(n.id);
      setSelectedTripId(n.target.params.tripId);
      if (n.target.screen === 'chatThread') setCurrentPage('trip-room');
      else if (n.target.screen === 'tripDetails') setCurrentPage('trip-details');
      else if (n.target.screen === 'tripsTab') setCurrentPage('my-trips');
      return;
    }
    const gatedTabs = ['initiate-trip', 'my-trips', 'chat-inbox', 'profile'];
    if (!user && gatedTabs.includes(tab)) {
      setSuccessToast("Sign in to continue.");
      setIntendedAction({ type: 'TAB', tabId: tab });
      setCurrentPage('auth');
      return;
    }
    setCurrentPage(tab);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home 
          user={user} 
          allTrips={db.getTrips()} 
          activeTrip={activeTripForHeader} 
          onSearch={handleSearch} 
          onSelectTrip={(t) => navigateToTrip(t.id)} 
          onSeeAll={() => executeSearch({ location: '' })} 
          onSOS={setSosTrip} 
          userVibe={user?.vibeProfile || null} 
          currency={currency} 
          onVibeStart={() => {
            if (!user) {
              setSuccessToast("Sign in to find your tribe.");
              setCurrentPage('auth');
              return;
            }
            setSearchFilters({ location: '' });
            setCurrentPage('vibe-check');
          }} 
        />;
      case 'search-results':
        return (
          <div className="px-4 pb-32 max-w-7xl mx-auto w-full pt-8 page-transition">
            <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
              <div>
                <h2 className="text-3xl font-black text-[#0A3D91] tracking-tighter italic">Matching Tribes</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Showing {searchResults?.length || 0} active packages</p>
              </div>
              <button onClick={() => setCurrentPage('vibe-check')} className="bg-blue-50 text-[#0A3D91] px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100 shadow-sm active:scale-95 transition-all">Redo Vibe Check</button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {searchResults?.map(t => (
                <TripCard key={t.id} trip={t} user={user} vibeScore={t.vibeMatchPercent} onClick={() => navigateToTrip(t.id)} currency={currency} />
              ))}
            </div>
          </div>
        );
      case 'vibe-check':
        if (!user) { setCurrentPage('auth'); return null; }
        return <VibeCheckScreen 
          onBack={() => setCurrentPage('home')} 
          onJoin={() => executeSearch(searchFilters || { location: '' })} 
          destination={searchFilters?.location || 'India'} 
        />;
      case 'trip-details':
        const t = selectedTripId ? db.getTripById(selectedTripId, user?.id) : null;
        return t ? <TripDetails trip={t} allTrips={db.getTrips()} currentUser={user} onJoin={(s, v) => { if (!user) { setSuccessToast("Sign in to continue."); setIntendedAction({ type: 'JOIN', tripId: selectedTripId! }); setCurrentPage('auth'); return; } updateUserData({ socialProfiles: s }); db.requestToJoin(selectedTripId!, user!.id); navigateToTrip(selectedTripId!); }} onKycCta={() => { if (!user) { setSuccessToast("Sign in to continue."); setIntendedAction({ type: 'JOIN', tripId: selectedTripId! }); setCurrentPage('auth'); return; } setCurrentPage('profile'); }} currency={currency} userVibe={user?.vibeProfile || null} onVibeStart={() => { if (!user) { setSuccessToast("Sign in to continue."); setIntendedAction({ type: 'VIBE' }); setCurrentPage('auth'); return; } setShowVibeModal(true); }} onBack={() => setCurrentPage('home')} onSelectTripRoom={() => { if (!user) { setCurrentPage('auth'); return; } setCurrentPage('trip-room'); }} /> : <div className="p-20 text-center">Trip Not Found</div>;
      case 'trip-room':
        if (!user) { setCurrentPage('auth'); return null; }
        return selectedTripId ? <TripRoom tripId={selectedTripId} user={user!} onBack={() => setCurrentPage('trip-details')} /> : null;
      case 'my-trips':
        if (!user) { setCurrentPage('auth'); return null; }
        const myTrips = db.getTrips().filter(trip => trip.userParticipation !== ParticipationState.NOT_JOINED || trip.ownerId === user?.id);
        return <MyTrips user={user!} activeTrips={activeTripForHeader ? [activeTripForHeader] : []} approvedTrips={myTrips.filter(t => t.userParticipation?.includes('APPROVED'))} pendingTrips={myTrips.filter(t => t.userParticipation === ParticipationState.REQUESTED)} initiatedTrips={myTrips.filter(t => t.ownerId === user?.id)} onSelectTrip={(t) => navigateToTrip(t.id)} onExplore={() => setCurrentPage('home')} onInitiate={() => setCurrentPage('initiate-trip')} onSOS={setSosTrip} onRateTrip={(t) => { setSelectedTripId(t.id); setCurrentPage('rate-tribe'); }} />;
      case 'chat-inbox':
        if (!user) { setCurrentPage('auth'); return null; }
        return <ChatInbox user={user!} allTrips={db.getTrips()} onSelectTrip={(t) => { setSelectedTripId(t.id); setCurrentPage('trip-room'); }} onShowMessage={(msg) => setSuccessToast(msg)} />;
      case 'profile':
        if (!user) { setCurrentPage('auth'); return null; }
        return <Profile user={user!} onUpdateUser={updateUserData} onLogout={() => { db.setSession(null); setUser(null); setCurrentPage('auth'); }} onResetDemoData={() => db.resetDb()} onClearStorage={() => { localStorage.clear(); window.location.reload(); }} onResetVibe={() => updateUserData({ vibeProfile: undefined, lastVibeCheckAt: undefined })} onNavigate={setCurrentPage} />;
      case 'flight-search':
        return <FlightSearch onBack={() => setCurrentPage('home')} />;
      case 'kyc':
        if (!user) { setCurrentPage('auth'); return null; }
        return <Kyc currentStatus={user?.kycStatus || KycStatus.NOT_STARTED} onVerify={(status) => { updateUserData({ kycStatus: status }); setSuccessToast('KYC Pack Submitted'); setCurrentPage('profile'); }} onBack={() => setCurrentPage('profile')} />;
      case 'edit-profile':
        if (!user) { setCurrentPage('auth'); return null; }
        return <EditProfile user={user!} onSave={(u) => { updateUserData(u); setSuccessToast('Profile updated'); setCurrentPage('profile'); }} onBack={() => setCurrentPage('profile')} />;
      case 'emergency-contact':
        if (!user) { setCurrentPage('auth'); return null; }
        return <EmergencyContact user={user!} onSave={(c) => { updateUserData({ emergencyContact: c }); setSuccessToast('Emergency contact saved'); setCurrentPage('profile'); }} onBack={() => setCurrentPage('profile')} />;
      case 'payment-methods':
        if (!user) { setCurrentPage('auth'); return null; }
        return <PaymentMethods user={user!} onSave={(upi) => { updateUserData({ upiId: upi }); setSuccessToast('UPI updated'); setCurrentPage('profile'); }} onBack={() => setCurrentPage('profile')} />;
      case 'help-support':
        if (!user) { setCurrentPage('auth'); return null; }
        return <HelpSupport user={user!} onSubmit={(d) => { db.addSupportTicket({ id: `t_${Date.now()}`, userId: user!.id, email: d.email, message: d.message, status: 'OPEN', createdAt: new Date().toISOString() }); setSuccessToast('Ticket submitted'); setCurrentPage('profile'); }} onBack={() => setCurrentPage('profile')} />;
      case 'initiate-trip':
        if (!user) { setCurrentPage('auth'); return null; }
        return <InitiateTrip user={user!} allTrips={db.getTrips()} onTripCreated={(nt) => { db.addTrip(nt); navigateToTrip(nt.id); }} onNavigate={setCurrentPage} />;
      case 'rate-tribe':
        if (!user) { setCurrentPage('auth'); return null; }
        const rt = selectedTripId ? db.getTripById(selectedTripId, user?.id) : null;
        return rt ? <RateTribe trip={rt} user={user!} onBack={() => setCurrentPage('my-trips')} onSuccess={(msg) => setSuccessToast(msg)} /> : null;
      case 'contact': return <Contact />;
      case 'about': return <About onBack={() => setCurrentPage('home')} />;
      case 'auth': return <Auth onAuthComplete={handleAuthComplete} />;
      default: return <Home user={user} allTrips={db.getTrips()} activeTrip={activeTripForHeader} onSearch={handleSearch} onSelectTrip={(t) => navigateToTrip(t.id)} onSeeAll={() => executeSearch({ location: '' })} onSOS={setSosTrip} userVibe={user?.vibeProfile || null} currency={currency} onVibeStart={() => executeSearch({ location: '' })} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFF]">
      <TopAppBar title="Travel Tribe" activeTab={currentPage} onTabChange={handleTabChange} user={user} currency={currency} onCurrencyChange={setCurrency} activeTrip={activeTripForHeader} />
      <main className="flex-1 w-full flex flex-col items-center overflow-x-hidden">{renderPage()}</main>
      <BottomNav activeTab={currentPage} onTabChange={handleTabChange} />
      <VibeModal isOpen={showVibeModal} onComplete={handleVibeComplete} onClose={() => setShowVibeModal(false)} />
      <SOSModal isOpen={!!sosTrip} onClose={() => setSosTrip(null)} trip={sosTrip} user={user} />
      {successToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[500] animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 border border-white/10">
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
             {successToast}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;