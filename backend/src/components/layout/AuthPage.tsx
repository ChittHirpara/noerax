import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import authPanel from '../../assets/auth-whatsapp-panel.jpeg';

type Mode = 'signup' | 'signin';

export function AuthPage() {
  const navigate = useNavigate();
  const { user, loginWithEmail } = useAuth();

  const [mode, setMode] = useState<Mode>('signup');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // ── If already logged in, redirect to chat ──────────────────────
  useEffect(() => {
    if (user) {
      window.location.href = '/chat';
    }
  }, [user]);

  // ── Handle Google OAuth server-side callback ─────────────────────
  // After /api/auth/google/callback runs, it redirects here with ?google_token=JWT
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleToken = params.get('google_token');
    const oauthError = params.get('error');

    if (oauthError) {
      const messages: Record<string, string> = {
        google_cancelled: 'Google sign-in was cancelled. Please try again.',
        google_failed: 'Google authentication failed. Please try again.',
        google_userinfo_failed: 'Could not load your Google profile. Please try again.',
        no_email: 'Your Google account has no email. Please use a different account.',
        google_init_failed: 'Could not connect to Google. Please try again.',
      };
      setError(messages[oauthError] || 'Google sign-in failed. Please try again.');
      window.history.replaceState(null, '', '/auth');
      return;
    }

    if (googleToken) {
      // Immediately clean URL so token isn't visible
      window.history.replaceState(null, '', '/auth');
      setGoogleLoading(true);

      // Store token in localStorage
      localStorage.setItem('noerax_token', googleToken);

      // Fetch user profile with the new token
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${googleToken}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.user) {
            localStorage.setItem('noerax_user', JSON.stringify(data.user));
            window.location.href = '/chat';
          } else {
            localStorage.removeItem('noerax_token');
            setGoogleLoading(false);
            setError('Google sign-in verification failed. Please try again.');
          }
        })
        .catch(() => {
          localStorage.removeItem('noerax_token');
          setGoogleLoading(false);
          setError('Google sign-in failed. Check your connection and try again.');
        });
    }
  }, []);

  // ── Trigger Google OAuth Server-Side Redirect Flow ───────────────
  // Server at /api/auth/google generates the Google consent URL and redirects.
  // Google then redirects to /api/auth/google/callback which creates the user
  // and sends back a JWT to /auth?google_token=...
  const handleGoogleAuth = () => {
    window.location.href = '/api/auth/google';
  };

  // ── Email / Password Submit ───────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'signup') {
      if (!firstName.trim()) return setError('Please enter your first name.');
      if (password.length < 8) return setError('Password must be at least 8 characters.');
      if (!agreed) return setError('Please agree to the Terms & Condition.');
    }
    setIsLoading(true);
    const fullName = `${firstName} ${lastName}`.trim();
    const res = await loginWithEmail(fullName || firstName, email, password, mode === 'signup');
    setIsLoading(false);
    if (!res.success && res.error) {
      setError(res.error);
    }
    // On success, AuthContext itself redirects to /chat
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f5f7] p-4 md:p-8 font-sans">
      {/* Main card container */}
      <div className="w-full max-w-5xl bg-white rounded-[36px] shadow-2xl overflow-hidden flex flex-col md:flex-row p-3 md:p-4 min-h-[640px]">

        {/* ── LEFT IMAGE PANEL ─────────────────────────────── */}
        <div className="relative hidden md:flex w-1/2 rounded-[28px] overflow-hidden flex-col justify-between p-8 bg-slate-900 min-h-[600px]">
          <img
            src={authPanel}
            alt="Noerax Visual"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
          <div className="relative z-10" />
        </div>

        {/* ── RIGHT FORM PANEL ────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center px-6 md:px-12 py-8 bg-white">

          {/* Back button */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home Page
            </button>
          </div>

          {/* Google loading overlay */}
          {googleLoading && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500 font-medium">Verifying your Google account...</p>
            </div>
          )}

          {!googleLoading && (
            <>
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-2">
                {mode === 'signup' ? 'Create an Account' : 'Welcome Back'}
              </h1>

              {/* Switch mode */}
              <p className="text-sm text-gray-500 mb-8 font-normal">
                {mode === 'signup' ? (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setError(''); }}
                      className="text-gray-900 font-bold underline underline-offset-2 cursor-pointer"
                    >
                      Log in
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setError(''); }}
                      className="text-gray-900 font-bold underline underline-offset-2 cursor-pointer"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* First & Last Name (Sign up only) */}
                <AnimatePresence>
                  {mode === 'signup' && (
                    <motion.div
                      key="names"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-2 gap-3 overflow-hidden"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1.5 ml-1">First Name</label>
                        <input
                          type="text"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required={mode === 'signup'}
                          className="w-full px-5 py-3 rounded-full border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1.5 ml-1">Last Name</label>
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-5 py-3 rounded-full border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all bg-white"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1.5 ml-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-5 py-3 rounded-full border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all bg-white"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1.5 ml-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-5 py-3 pr-12 rounded-full border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-all shadow-md mt-2 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Processing...' : mode === 'signup' ? 'Create Account' : 'Log In'}
                </button>

                {/* Terms checkbox */}
                {mode === 'signup' && (
                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setAgreed(!agreed)}
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer ${
                        agreed ? 'bg-black text-white' : 'border border-gray-300 bg-white'
                      }`}
                    >
                      {agreed && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <span className="text-xs text-gray-500 font-normal">
                      I agree to the{' '}
                      <span className="font-bold text-gray-900 underline underline-offset-2 cursor-pointer">
                        Terms & Condition
                      </span>
                    </span>
                  </div>
                )}
              </form>

              {/* Divider */}
              <div className="relative my-6 flex items-center">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="mx-4 text-xs text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Google Button + Guest */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full py-3 px-6 rounded-full border border-gray-200 hover:border-gray-400 hover:bg-gray-50/80 transition-all flex items-center justify-center gap-3 shadow-sm text-sm font-medium text-gray-700 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    const guestEmail = `guest_${Date.now()}@noerax.internal`;
                    const guestPass = 'noerax_demo_2026';
                    let res = await loginWithEmail('Sanctuary Explorer', guestEmail, guestPass, true);
                    if (!res.success) {
                      res = await loginWithEmail('Sanctuary Explorer', guestEmail, guestPass, false);
                    }
                    setIsLoading(false);
                    // AuthContext handles redirect on success
                  }}
                  disabled={isLoading}
                  className="w-full py-2.5 px-6 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-medium text-gray-600 transition-all text-center cursor-pointer disabled:opacity-50"
                >
                  Continue as Guest Explorer →
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
