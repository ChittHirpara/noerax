import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { user, loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Automatically close modal when user logs in successfully
  useEffect(() => {
    if (user) {
      onClose();
    }
  }, [user, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return;
    setIsLoading(true);
    const res = await loginWithEmail(name, email, password, isSignUp);
    setIsLoading(false);
    if (!res.success && res.error) {
      setError(res.error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-dharma-ink w-full max-w-md rounded-3xl p-8 shadow-2xl border border-dharma-line-dark relative overflow-hidden flex flex-col items-center my-8"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-dharma-flame/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-dharma-saffron/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 text-dharma-ivory-dim hover:text-dharma-ivory hover:bg-dharma-ivory/5 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="w-12 h-12 bg-dharma-flame/10 rounded-2xl flex items-center justify-center text-dharma-flame mb-4 border border-dharma-flame/20 shadow-lg shadow-dharma-flame/10">
              <Sparkles className="w-6 h-6" />
            </div>

            <h2 className="text-3xl font-serif text-dharma-ivory mb-1">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-dharma-ivory-dim mb-6 text-center">
              {isSignUp
                ? 'Join Noerax to save your streaks, mantras, and progress.'
                : 'Sign in to access your saved progress and journal.'}
            </p>

            {/* Toggle Switcher */}
            <div className="flex bg-dharma-ink-2 p-1 rounded-xl border border-dharma-line-dark w-full mb-6">
              <button
                onClick={() => { setIsSignUp(true); setError(''); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  isSignUp ? 'bg-dharma-flame text-white shadow-md' : 'text-dharma-ivory-dim hover:text-dharma-ivory'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => { setIsSignUp(false); setError(''); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  !isSignUp ? 'bg-dharma-flame text-white shadow-md' : 'text-dharma-ivory-dim hover:text-dharma-ivory'
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-3.5 mb-5">
              {isSignUp && (
                <div className="relative">
                  <User className="w-4 h-4 text-dharma-ivory-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isSignUp}
                    className="w-full bg-dharma-ink-2 border border-dharma-line-dark rounded-xl pl-10 pr-4 py-2.5 text-sm text-dharma-ivory placeholder-dharma-ivory-dim/40 focus:outline-none focus:border-dharma-flame transition-colors"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="w-4 h-4 text-dharma-ivory-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-dharma-ink-2 border border-dharma-line-dark rounded-xl pl-10 pr-4 py-2.5 text-sm text-dharma-ivory placeholder-dharma-ivory-dim/40 focus:outline-none focus:border-dharma-flame transition-colors"
                />
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-dharma-ivory-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-dharma-ink-2 border border-dharma-line-dark rounded-xl pl-10 pr-4 py-2.5 text-sm text-dharma-ivory placeholder-dharma-ivory-dim/40 focus:outline-none focus:border-dharma-flame transition-colors"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
                  {error}
                </p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-dharma-flame text-white font-semibold rounded-xl text-sm shadow-lg shadow-dharma-flame/30 hover:bg-dharma-saffron transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </form>

            {/* Divider */}
            <div className="w-full flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-dharma-line-dark" />
              <span className="text-[11px] text-dharma-ivory-dim uppercase tracking-wider font-semibold">
                Or Continue With
              </span>
              <div className="flex-1 h-px bg-dharma-line-dark" />
            </div>

            {/* Google Login — redirect to full auth page to avoid double-init */}
            <div className="w-full flex justify-center py-1">
              <button
                type="button"
                onClick={() => { onClose(); navigate('/auth'); }}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-dharma-line-dark text-dharma-ivory-dim hover:text-dharma-ivory hover:border-dharma-flame/40 transition-all text-sm font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
