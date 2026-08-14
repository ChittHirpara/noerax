import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, BookOpen, Bookmark, LogOut, Calendar, Sparkles, Loader2, Flame, Award, Clock, ShieldCheck, Zap, Download, Settings, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
  const xpProgress = ((journals.length % 2) / 2) * 100 || 65;

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
    { id: '1', title: 'First Inscription', desc: 'Inscribed your first journal entry', icon: <Sparkles className="w-4 h-4 text-cyan-400" />, unlocked: journals.length > 0 },
    { id: '2', title: 'Sovereign Streak', desc: 'Maintained a 3+ day reflection rhythm', icon: <Flame className="w-4 h-4 text-dharma-flame" />, unlocked: streak >= 3 },
    { id: '3', title: 'Sanctuary Master', desc: 'Listened to 432Hz Soundscapes', icon: <Clock className="w-4 h-4 text-amber-400" />, unlocked: true },
    { id: '4', title: 'Classical Scholar', desc: 'Explored multi-tradition frameworks', icon: <BookOpen className="w-4 h-4 text-emerald-400" />, unlocked: true },
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#09090c] border-l border-white/10 shadow-2xl flex flex-col font-sans text-white"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0284c7&color=fff`}
                    alt={user?.name || 'Seeker'}
                    className="w-12 h-12 rounded-full border-2 border-cyan-400/50 object-cover shadow-lg"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-cyan-500 text-black text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-black">
                    Lvl {level}
                  </span>
                </div>
                <div>
                  <h3 className="font-serif italic text-white text-base font-medium flex items-center gap-1.5">
                    {user?.name || 'Mindful Seeker'}
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  </h3>
                  <p className="text-[11px] text-white/40 font-mono">{user?.email || 'Verified Seeker'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mindful Metrics Stats Grid */}
            <div className="p-5 border-b border-white/10 bg-white/[0.01]">
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/8">
                  <span className="text-[10px] text-white/40 block flex items-center justify-center gap-1 font-mono">
                    <Flame className="w-3 h-3 text-dharma-flame" /> Streak
                  </span>
                  <span className="font-serif italic text-lg text-white font-medium">{streak} Days</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/8">
                  <span className="text-[10px] text-white/40 block flex items-center justify-center gap-1 font-mono">
                    <BookOpen className="w-3 h-3 text-cyan-300" /> Entries
                  </span>
                  <span className="font-serif italic text-lg text-white font-medium">{journals.length}</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/8">
                  <span className="text-[10px] text-white/40 block flex items-center justify-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-emerald-400" /> Mindful
                  </span>
                  <span className="font-serif italic text-lg text-white font-medium">{totalMins}m</span>
                </div>
              </div>

              {/* Level XP Progress Bar */}
              <div>
                <div className="flex justify-between text-[11px] font-mono text-white/40 mb-1">
                  <span>Level {level} Seeker</span>
                  <span className="text-cyan-300">{xpProgress}% to Level {level + 1}</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full"
                  />
                </div>
              </div>

              {/* 30-Day Activity Matrix */}
              <div className="mt-4 pt-3 border-t border-white/5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-2">
                  30-Day Activity Matrix
                </span>
                <div className="grid grid-cols-10 gap-1.5">
                  {last30Days.map((day, idx) => (
                    <div
                      key={idx}
                      title={`Date: ${day.dateStr}`}
                      className={`h-2.5 rounded-sm transition-colors ${
                        day.active
                          ? 'bg-gradient-to-br from-sky-400 to-cyan-500 shadow-sm shadow-sky-500/50'
                          : 'bg-white/[0.04]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-white/[0.02] p-1.5 border-b border-white/10 gap-1">
              <button
                onClick={() => setActiveTab('journals')}
                className={`flex-1 py-2 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'journals' ? 'bg-white/10 text-white font-semibold' : 'text-white/40 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Vault ({journals.length})
              </button>
              <button
                onClick={() => setActiveTab('badges')}
                className={`flex-1 py-2 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'badges' ? 'bg-white/10 text-white font-semibold' : 'text-white/40 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" /> Milestones
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {activeTab === 'journals' && (
                <div>
                  {isLoadingJournals ? (
                    <div className="py-12 flex items-center justify-center text-cyan-300 gap-2 text-xs font-mono">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading your reflections...
                    </div>
                  ) : journals.length === 0 ? (
                    <div className="py-16 text-center text-white/40">
                      <BookOpen className="w-10 h-10 text-white/20 mx-auto mb-3" />
                      <p className="text-xs font-medium text-white/60">No saved reflections yet</p>
                      <p className="text-[11px] text-white/30 mt-1">Inscribe in the Reflection Studio to build your vault.</p>
                    </div>
                  ) : (
                    filteredJournals.map((j) => (
                      <div key={j._id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 space-y-2 mb-3 shadow-sm hover:border-cyan-400/30 transition-colors">
                        <div className="flex justify-between items-center text-xs">
                          <h4 className="font-medium text-white font-serif italic">{j.title || 'Daily Reflection'}</h4>
                          <span className="text-[10px] text-cyan-300 flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3" />
                            {new Date(j.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 font-light line-clamp-2">"{j.entryText}"</p>
                        {j.insights && (
                          <p className="text-[11px] text-cyan-200/70 pt-1 border-t border-white/5 line-clamp-1">
                            💡 {j.insights}
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
                      className={`p-3.5 rounded-2xl border flex flex-col justify-between text-left space-y-2 transition-all ${
                        badge.unlocked
                          ? 'bg-white/[0.03] border-cyan-400/30 text-white shadow-md'
                          : 'bg-white/[0.01] border-white/5 text-white/30 opacity-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10">
                          {badge.icon}
                        </div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                          badge.unlocked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white/40'
                        }`}>
                          {badge.unlocked ? 'Unlocked' : 'Locked'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{badge.title}</h4>
                        <p className="text-[10px] text-white/40 font-light">{badge.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-white/10 bg-white/[0.01] space-y-2">
              <button
                onClick={() => {
                  onClose();
                  navigate('/settings');
                }}
                className="w-full btn-liquid-secondary !py-2.5 !text-xs flex items-center justify-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-300" />
                <span>Open Full Settings</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

