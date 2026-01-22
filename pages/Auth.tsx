
import React, { useState } from 'react';
import { User, KycStatus, Gender } from '../types';
import { db } from '../lib/mockDb';
import { INDIAN_CITIES } from '../lib/mockData';
import { formatDateDDMMYYYY, parseTripDate, isValidDDMMYYYY, toISODate, fromISODate } from '../lib/dateUtils';
import { M3DatePicker } from '../components/ui/M3Components';

interface AuthProps {
  onAuthComplete: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthComplete }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    loginId: '', // For login/forgot: email or mobile
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dob: '', // Now handled as DD/MM/YYYY text input
    gender: '' as Gender | '',
    homeCity: '',
    isGoogleMock: false,
    googleId: '',
    existingUserId: '' // Tracks existing profile ID for completion
  });

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateMobile = (mobile: string) => /^[6-9]\d{9}$/.test(mobile.replace(/^\+91/, '').trim());
  const validatePassword = (pass: string) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(pass);

  const calculateAge = (dobString: string) => {
    const birthDate = parseTripDate(dobString);
    if (!birthDate) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleGoogleMockLogin = (acc: any) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const googleEmail = acc.email || acc.sub;
      // Requirement: Check local DB keyed by email
      const existingUser = db.findUserByIdentifier(googleEmail);
      
      if (existingUser && existingUser.isProfileComplete) {
        // If profile exists and profileCompleted === true: Navigate user to Home/Explore
        db.setSession(existingUser.id);
        onAuthComplete(existingUser);
      } else {
        // If profile does not exist OR profileCompleted === false: Navigate to Complete Profile
        setFormData({
          ...formData,
          firstName: existingUser?.firstName || acc.firstName || acc.label.split(' ')[0] || '',
          lastName: existingUser?.lastName || acc.lastName || acc.label.split(' ').slice(1).join(' ') || '',
          email: googleEmail,
          phone: existingUser?.phone || '',
          homeCity: existingUser?.homeCity || '',
          dob: existingUser?.dob ? fromISODate(existingUser.dob) : '',
          gender: existingUser?.gender || '',
          isGoogleMock: true,
          googleId: acc.id,
          existingUserId: existingUser?.id || ''
        });
        setMode('signup');
        setShowAccountPicker(false);
      }
    }, 800);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'login') {
      const loginId = formData.loginId.trim();
      const password = formData.password;

      if (!loginId || !password) {
        setError('Login ID and password are required');
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        const user = db.login(loginId, password);
        if (user) {
          onAuthComplete(user);
        } else {
          setError('Invalid credentials. Please check your login ID or password.');
        }
      }, 1000);
    } else if (mode === 'forgot') {
      const loginId = formData.loginId.trim();
      if (!loginId) {
        setError('Email or Mobile is required');
        return;
      }
      if (!validatePassword(formData.password)) {
        setError('New Password must be at least 8 characters and include both letters and numbers');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        const user = db.findUserByIdentifier(loginId);
        if (user) {
          db.updateUser({ ...user, passwordHash: formData.password });
          setSuccess('Password updated successfully. Please sign in.');
          setMode('login');
          setFormData({ ...formData, password: '', confirmPassword: '' });
        } else {
          setError('Account not found');
        }
      }, 1000);
    } else {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('First and Last name are required');
        return;
      }
      if (!validateEmail(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }
      const normalizedPhone = formData.phone.replace(/^\+91/, '').trim();
      if (!validateMobile(normalizedPhone)) {
        setError('Please enter a valid 10-digit India mobile number');
        return;
      }
      if (!formData.dob) {
        setError('Date of Birth is required');
        return;
      }
      
      if (calculateAge(formData.dob) < 18) {
        setError('You must be at least 18 years old to join');
        return;
      }
      if (!formData.gender) {
        setError('Please select your gender');
        return;
      }
      if (!formData.homeCity) {
        setError('Home city is required');
        return;
      }
      if (!formData.isGoogleMock) {
        if (!validatePassword(formData.password)) {
          setError('Password must be at least 8 characters and include both letters and numbers');
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
      }

      // Pass existingUserId to excludeId to allow updating an existing incomplete profile
      if (db.isIdentifierTaken(formData.email, normalizedPhone, formData.existingUserId || formData.googleId)) {
        setError('Account already exists. Please sign in.');
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        const now = new Date().toISOString();
        const newUser: User = {
          id: formData.existingUserId || formData.googleId || `user_${Date.now()}`,
          name: `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: normalizedPhone,
          homeCity: formData.homeCity,
          passwordHash: formData.password, // Proto: stored plain
          authProvider: formData.isGoogleMock ? 'google' : 'form',
          googleEmail: formData.isGoogleMock ? formData.email : undefined,
          gender: formData.gender as Gender,
          dob: toISODate(formData.dob),
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.firstName}_${Date.now()}`,
          kycStatus: KycStatus.NOT_STARTED,
          kycVerified: false,
          trustScore: 60,
          trustTier: 'Medium',
          userRole: 'INDIVIDUAL',
          isProfileComplete: true, // Marked as complete on save
          createdAt: now,
          updatedAt: now,
          historySignals: {
            pastTripsCompleted: 0,
            pastDropoffs: 0,
            avgRating: 5.0,
            priorForumToneScore: 10,
            priorChatFlags: false
          }
        };
        db.signup(newUser);
        onAuthComplete(newUser);
      }, 1000);
    }
  };

  const demoAccounts = [
    { id: 'user_vishnu_001', label: 'Vishnu Prabhu', sub: 'vishnutvp89@gmail.com', email: 'vishnutvp89@gmail.com', firstName: 'Vishnu', lastName: 'Prabhu', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vishnu' },
    { id: 'demo-ananya', label: 'Ananya', sub: 'ananya.demo@gmail.com', email: 'ananya.demo@gmail.com', firstName: 'Ananya', lastName: '', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya' },
    { id: 'demo-rohan', label: 'Rohan Sharma', sub: 'rohan.demo@gmail.com', email: 'rohan.demo@gmail.com', firstName: 'Rohan', lastName: 'Sharma', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 flex items-center justify-center px-4 md:px-0 bg-[#F8FAFF]">
      <div className="bg-white w-full max-w-md p-10 md:p-14 rounded-[3.5rem] border border-gray-100 shadow-2xl">
        <div className="text-center mb-10">
          <div className="text-2xl font-black text-[#0A3D91] tracking-tighter italic mb-4">TRAVEL TRIBE</div>
          <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter">
            {mode === 'login' ? 'Welcome back' : mode === 'forgot' ? 'Reset Password' : (formData.isGoogleMock ? 'Complete Profile' : 'Start your journey')}
          </h2>
          <p className="text-gray-400 mt-3 text-[10px] font-black uppercase tracking-widest">
            {mode === 'login' ? 'Sign in to access your tribe' : mode === 'forgot' ? 'Identify your account' : 'Join verified explorers'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest animate-in shake-in">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-600 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {mode === 'login' && (
            <>
              <button 
                onClick={() => setShowAccountPicker(true)}
                className="w-full h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-95 shadow-sm group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.21.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm font-bold text-gray-700">Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="flex-1 border-t border-gray-100"></div>
                <span className="px-4 text-[9px] font-black text-gray-300 uppercase tracking-widest bg-white">Or with password</span>
                <div className="flex-1 border-t border-gray-100"></div>
              </div>
            </>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'signup' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">First Name</label>
                    <input
                      required
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-[#0F172A] outline-none focus:border-[#0A3D91]"
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Jane"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Last Name</label>
                    <input
                      required
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-[#0F172A] outline-none focus:border-[#0A3D91]"
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email Address</label>
                  <input
                    required
                    type="email"
                    readOnly={formData.isGoogleMock}
                    className={`w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-[#0F172A] outline-none focus:border-[#0A3D91] ${formData.isGoogleMock ? 'opacity-70 cursor-not-allowed' : ''}`}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@doe.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">India Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">+91</span>
                    <input
                      required
                      className="w-full bg-gray-50 border border-gray-100 p-4 pl-12 rounded-2xl text-sm font-bold text-[#0F172A] outline-none focus:border-[#0A3D91]"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Date of Birth (DD/MM/YYYY)</label>
                  <M3DatePicker
                    required
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-[#0F172A] outline-none focus:border-[#0A3D91]"
                    value={formData.dob}
                    maxDate={new Date().toISOString()}
                    onChange={val => setFormData({ ...formData, dob: val })}
                    placeholder="DD/MM/YYYY"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Gender</label>
                    <select
                      required
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-[#0F172A] outline-none focus:border-[#0A3D91]"
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value as Gender })}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Home City</label>
                    <select
                      required
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-[#0F172A] outline-none focus:border-[#0A3D91]"
                      value={formData.homeCity}
                      onChange={e => setFormData({ ...formData, homeCity: e.target.value })}
                    >
                      <option value="">Select</option>
                      {INDIAN_CITIES.sort().map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>
                </div>

                {!formData.isGoogleMock && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Password</label>
                      <input
                        required
                        type="password"
                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-[#0F172A] outline-none focus:border-[#0A3D91]"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Min 8 chars, 1 letter + 1 number"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Confirm Password</label>
                      <input
                        required
                        type="password"
                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-[#0F172A] outline-none focus:border-[#0A3D91]"
                        value={formData.confirmPassword}
                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Re-enter password"
                      />
                    </div>
                  </>
                )}
              </div>
            ) : mode === 'forgot' ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email or Mobile</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-[#0F172A] outline-none focus:border-[#0A3D91] placeholder:font-medium"
                    value={formData.loginId}
                    onChange={e => setFormData({ ...formData, loginId: e.target.value })}
                    placeholder="name@email.com or 9876543210"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">New Password</label>
                  <input
                    required
                    type="password"
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-[#0F172A] outline-none focus:border-[#0A3D91]"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 8 chars, 1 letter + 1 number"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Confirm Password</label>
                  <input
                    required
                    type="password"
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-[#0F172A] outline-none focus:border-[#0A3D91]"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email or Mobile</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-[#0F172A] outline-none focus:border-[#0A3D91] placeholder:font-medium"
                    value={formData.loginId}
                    onChange={e => setFormData({ ...formData, loginId: e.target.value })}
                    placeholder="name@email.com or 9876543210"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                    <button 
                      type="button" 
                      onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                      className="text-[9px] font-black text-[#0A3D91] uppercase tracking-widest hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-[#0F172A] outline-none focus:border-[#0A3D91]"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0A3D91]"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0A3D91] hover:bg-blue-800 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50 uppercase text-xs tracking-[0.3em]"
            >
              {isLoading ? 'PROCESSING...' : (mode === 'login' ? 'SIGN IN' : mode === 'forgot' ? 'RESET PASSWORD' : (formData.isGoogleMock ? 'COMPLETE PROFILE' : 'CREATE ACCOUNT'))}
            </button>
          </form>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            {mode === 'login' ? "New to the tribe?" : (mode === 'forgot' ? "Remembered password?" : "Already a member?")}
            <button
              type="button"
              onClick={() => { 
                setMode(mode === 'login' ? 'signup' : 'login'); 
                setError(''); 
                setSuccess(''); 
                setFormData({ ...formData, googleId: '', isGoogleMock: false, existingUserId: '' }); 
              }}
              className="ml-2 text-[#0A3D91] font-black hover:underline cursor-pointer relative z-10"
            >
              {mode === 'login' ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </button>
          </p>
        </div>
      </div>

      {showAccountPicker && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-[#001A40]/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center mb-8">
               <svg className="w-8 h-8 mx-auto mb-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.21.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <h3 className="text-xl font-black text-[#0F172A] tracking-tighter">Choose an account</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">to continue to Travel Tribe</p>
            </div>

            <div className="space-y-3">
              {demoAccounts.map(acc => (
                <button 
                  key={acc.id}
                  onClick={() => handleGoogleMockLogin(acc)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all text-left group"
                >
                  <img src={acc.avatarUrl} className="w-10 h-10 rounded-full border border-gray-100 group-hover:scale-105 transition-transform" alt="" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate leading-none mb-1">{acc.label}</p>
                    <p className="text-[10px] text-gray-400 font-medium truncate">{acc.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowAccountPicker(false)}
              className="w-full mt-8 py-4 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
