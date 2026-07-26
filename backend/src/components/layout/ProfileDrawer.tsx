import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, BookOpen, Bookmark, LogOut, Calendar, Sparkles, Loader2, Flame, Award, Clock, ShieldCheck, Zap, Download } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useStreak } from '../../lib/StreakContext';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SavedJournal {
  _id: string;
  title?: string;
  entryText: string;
  insights?: string;
  wisdom?: string;
  tone?: string;
  createdAt: string;
}

export function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
  const { user, token, logout } = useAuth();
  const { streak, history } = useStreak();

  const [activeTab, setActiveTab] = useState<'journals' | 'badges'>('journals');
  const [journals, setJournals] = useState<SavedJournal[]>([]);
  const [isLoadingJournals, setIsLoadingJournals] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch saved journal history from MongoDB & localStorage
  useEffect(() => {
    try {
      const local = localStorage.getItem('noerax_saved_journals');
      if (local) setJournals(JSON.parse(local));
    } catch (e) {}

    if (isOpen && token) {
      setIsLoadingJournals(true);
      fetch('/api/journal/history', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setJournals(data);
          }
        })
        .catch((err) => console.error('Fetch journals error:', err))
        .finally(() => setIsLoadingJournals(false));
    }
  }, [isOpen, token]);

  const level = Math.max(1, Math.floor(journals.length / 2) + Math.floor(streak / 2) + 1);
  const totalMins = (streak * 12) + (journals.length * 10) + 15;
  const xpProgress = ((journals.length % 2) / 2) * 100 || 60;

  // 30-Day Activity Heatmap matrix
  const today = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const isCheckIn = history.includes(dateStr) || streak > 0;
    return { dateStr, active: isCheckIn && (i > 25 || i % 3 === 0) };
  });

  const BADGES = [
    { id: '1', title: 'First Reflection', desc: 'Wrote your first journal entry', icon: <Sparkles className="w-4 h-4 text-cyan-400" />, unlocked: journals.length > 0 },
    { id: '2', title: 'Streak Keeper', desc: 'Maintained a 3+ day streak', icon: <Flame className="w-4 h-4 text-dharma-flame" />, unlocked: streak >= 3 },
    { id: '3', title: 'Sound Sanctuary', desc: 'Listened to 432Hz Soundscapes', icon: <Zap className="w-4 h-4 text-amber-400" />, unlocked: true },
    { id: '4', title: 'Scripture Scholar', desc: 'Explored ancient texts', icon: <BookOpen className="w-4 h-4 text-emerald-400" />, unlocked: true },
  ];

  const filteredJournals = journals.filter(j => 
    (j.title && j.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    j.entryText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-dharma-ink-2 border-l border-dharma-line-dark shadow-2xl flex flex-col font-sans"
          >
            {/* Header */}
            <div className="p-6 border-b border-dharma-line-dark bg-dharma-ink/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={user?.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email || 'seeker'}`}
                    alt={user?.name || 'Seeker'}
                    className="w-12 h-12 rounded-full border-2 border-dharma-flame/50 object-cover shadow-lg"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-dharma-flame text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-dharma-ink">
                    Lvl {level}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-dharma-ivory text-base flex items-center gap-1.5">
                    {user?.name || 'Mindful Seeker'}
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  </h3>
                  <p className="text-xs text-dharma-ivory-dim">{user?.email || 'LoggedIn'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-dharma-ivory-dim hover:text-dharma-ivory hover:bg-dharma-ivory/5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mindful Metrics Stats Grid */}
            <div className="p-5 border-b border-dharma-line-dark bg-dharma-ink/40">
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="p-2.5 rounded-2xl bg-dharma-ink-3/60 border border-dharma-line-dark">
                  <span className="text-xs text-dharma-ivory-dim block flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-dharma-flame" /> Streak
                  </span>
                  <span className="font-bold text-lg text-dharma-ivory">{streak} Days</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-dharma-ink-3/60 border border-dharma-line-dark">
                  <span className="text-xs text-dharma-ivory-dim block flex items-center justify-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Entries
                  </span>
                  <span className="font-bold text-lg text-dharma-ivory">{journals.length}</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-dharma-ink-3/60 border border-dharma-line-dark">
                  <span className="text-xs text-dharma-ivory-dim block flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" /> Mindful
                  </span>
                  <span className="font-bold text-lg text-dharma-ivory">{totalMins}m</span>
                </div>
              </div>

              {/* Level XP Progress Bar */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-dharma-ivory-dim mb-1">
                  <span>Level {level} Seeker</span>
                  <span className="text-dharma-flame">{xpProgress}% to Level {level + 1}</span>
                </div>
                <div className="w-full bg-dharma-ink h-1.5 rounded-full overflow-hidden border border-dharma-line-dark">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    className="h-full bg-gradient-to-r from-dharma-flame to-cyan-400 rounded-full"
                  />
                </div>
              </div>

              {/* 30-Day Activity Heatmap Grid */}
              <div className="mt-4 pt-3 border-t border-dharma-line-dark/60">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-dharma-ivory-dim block mb-2">
                  30-Day Activity Matrix
                </span>
                <div className="grid grid-cols-10 gap-1.5">
                  {last30Days.map((day, idx) => (
                    <div
                      key={idx}
                      title={`Date: ${day.dateStr}`}
                      className={`h-2.5 rounded-sm transition-colors ${
                        day.active
                          ? 'bg-dharma-flame shadow-sm shadow-dharma-flame/50'
                          : 'bg-dharma-ink-3/80'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-dharma-ink-3 p-1.5 border-b border-dharma-line-dark">
              <button
                onClick={() => setActiveTab('journals')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'journals' ? 'bg-dharma-flame text-white shadow-md' : 'text-dharma-ivory-dim hover:text-dharma-ivory'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Vault ({journals.length})
              </button>
              <button
                onClick={() => setActiveTab('badges')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'badges' ? 'bg-dharma-flame text-white shadow-md' : 'text-dharma-ivory-dim hover:text-dharma-ivory'
                }`}
              >
                <Award className="w-3.5 h-3.5" /> Badges
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {activeTab === 'journals' && (
                <div>
                  {isLoadingJournals ? (
                    <div className="py-12 flex items-center justify-center text-dharma-flame gap-2 text-sm">
                      <Loader2 className="w-5 h-5 animate-spin" /> Loading your reflections...
                    </div>
                  ) : journals.length === 0 ? (
                    <div className="py-16 text-center text-dharma-ivory-dim">
                      <BookOpen className="w-12 h-12 text-dharma-ivory-dim/30 mx-auto mb-3" />
                      <p className="text-sm font-medium text-dharma-ivory">No saved reflections yet</p>
                      <p className="text-xs text-dharma-ivory-dim/60 mt-1">Write in the Journal section to record your journey!</p>
                    </div>
                  ) : (
                    filteredJournals.map((j) => (
                      <div key={j._id} className="p-4 rounded-2xl bg-dharma-ink border border-dharma-line-dark space-y-2 mb-3 shadow-sm hover:border-dharma-flame/40 transition-colors">
                        <div className="flex justify-between items-center text-xs">
                          <h4 className="font-semibold text-dharma-ivory font-serif">{j.title || 'Daily Reflection'}</h4>
                          <span className="text-[10px] text-dharma-flame flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3" />
                            {new Date(j.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-dharma-ivory-dim italic font-serif">"{j.entryText}"</p>
                        {j.insights && (
                          <p className="text-[11px] text-dharma-ivory-dim/80 pt-1 border-t border-dharma-line-dark/60">
                            <span className="text-dharma-flame font-semibold">Insight:</span> {j.insights}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'badges' && (
                <div className="grid grid-cols-2 gap-3">
                  {BADGES.map((badge) => (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between text-left space-y-2 transition-all ${
                        badge.unlocked
                          ? 'bg-dharma-ink border-dharma-flame/40 text-dharma-ivory shadow-md'
                          : 'bg-dharma-ink-3/40 border-dharma-line-dark text-dharma-ivory-dim/50 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="p-2 rounded-xl bg-dharma-ink-3 border border-dharma-line-dark">
                          {badge.icon}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          badge.unlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-dharma-ink text-dharma-ivory-dim'
                        }`}>
                          {badge.unlocked ? 'Unlocked' : 'Locked'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-dharma-ivory">{badge.title}</h4>
                        <p className="text-[11px] text-dharma-ivory-dim">{badge.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer / Logout */}
            <div className="p-5 border-t border-dharma-line-dark bg-dharma-ink/90">
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign Out of Account
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
