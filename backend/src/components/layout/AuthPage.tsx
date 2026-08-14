import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../lib/AuthContext';
import noeraxLogo from '../../assets/noerax-logo.png';
import authPanel from '../../assets/auth-whatsapp-panel.jpeg';

type Mode = 'signup' | 'signin';

export function AuthPage() {
  const navigate = useNavigate();
  const { user, loginWithGoogle, loginWithEmail } = useAuth();

  const [mode, setMode] = useState<Mode>('signup');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

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
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f5f7] p-4 md:p-8 font-sans">
      {/* Main card container matching reference */}
      <div className="w-full max-w-5xl bg-white rounded-[36px] shadow-2xl overflow-hidden flex flex-col md:flex-row p-3 md:p-4 min-h-[640px]">

        {/* ── LEFT IMAGE PANEL ─────────────────────────────── */}
        <div className="relative hidden md:flex w-1/2 rounded-[28px] overflow-hidden flex-col justify-between p-8 bg-slate-900 min-h-[600px]">
          {/* Background image */}
          <img
            src={authPanel}
            alt="Noerax Visual"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

          {/* Bottom subtle space */}
          <div className="relative z-10" />
        </div>

        {/* ── RIGHT FORM PANEL ────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center px-6 md:px-12 py-8 bg-white">
          
          {/* Top navigation - Back to Home Page button */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home Page
            </button>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-2">
            {mode === 'signup' ? 'Create an Account' : 'Welcome Back'}
          </h1>

          {/* Log in prompt */}
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
            
            {/* First Name & Last Name (Sign up mode) */}
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

            {/* Email Address */}
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

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-all shadow-md mt-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading
                ? 'Processing...'
                : mode === 'signup'
                ? 'Create Account'
                : 'Log In'}
            </button>

            {/* Terms & Conditions checkbox */}
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

          {/* Google OAuth Button */}
          <div className="flex justify-center">
            <div className="w-full rounded-full border border-gray-200 overflow-hidden hover:border-gray-300 transition-all flex justify-center py-0.5 shadow-sm">
              <GoogleLogin
                onSuccess={async (res) => {
                  if (res.credential) {
                    setIsLoading(true);
                    setError('');
                    const result = await loginWithGoogle(res.credential);
                    setIsLoading(false);
                    if (!result.success && result.error) setError(result.error);
                  }
                }}
                onError={() => setError('Google sign-in popup was closed or unavailable.')}
                theme="outline"
                shape="pill"
                type="standard"
                text={mode === 'signup' ? 'signup_with' : 'signin_with'}
                size="large"
                width="320"
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
