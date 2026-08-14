import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, Sliders, Upload, Trash2, Check, ArrowLeft, Clock, Sparkles, Flame, Award, BookOpen, ShieldCheck, LogOut, Download, Key, Activity, Heart, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useStreak } from '../../lib/StreakContext';

interface SavedJournal {
  _id: string;
  title?: string;
  entryText: string;
  insights?: string;
  wisdom?: string;
  tone?: string;
  createdAt: string;
}

const AI_PERSONAS = [
  {
    id: 'karmayoga',
    label: 'Karmayoga Lens (Bhagavad Gita)',
    desc: 'Unrelenting focus on duty, radical detachment from outcomes, and decisive sovereign action.',
    quote: '“Focus entirely on the craft in your hands; let go of the audience.”'
  },
  {
    id: 'stoic',
    label: 'Stoic Fortress (Marcus Aurelius & Epictetus)',
    desc: 'Strict division of control, emotional equanimity, and cognitive fortress mastery.',
    quote: '“You have power over your mind, not outside events. Realize this and find strength.”'
  },
  {
    id: 'taoist',
    label: 'Taoist Flow (Lao Tzu & Wu Wei)',
    desc: 'Effortless action, yielding to overcome friction, and harmonious non-resistance.',
    quote: '“The highest good is like water: yielding, non-competing, and unstoppable.”'
  },
  {
    id: 'zen',
    label: 'Zen Clarity (Buddha & Dogen)',
    desc: 'Pure mindful presence, observing thoughts as passing clouds, and radical stillness.',
    quote: '“Mind precedes all states. Guard your attention as a sacred gate.”'
  }
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { streak, history } = useStreak();

  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'persona' | 'preferences' | 'security'>('profile');

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [timezone, setTimezone] = useState('UTC +05:30 - Asia / Kolkata');
  const [avatarUrl, setAvatarUrl] = useState('');

  // AI & Audio Preferences
  const [aiPersona, setAiPersona] = useState('karmayoga');
  const [soundscape, setSoundscape] = useState('singing_bowl');
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState('08:00');

  // Vault state
  const [journals, setJournals] = useState<SavedJournal[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    try {
      const local = localStorage.getItem('noerax_saved_journals');
      if (local) setJournals(JSON.parse(local));
    } catch (e) {}

    try {
      const savedSettings = localStorage.getItem('noerax_user_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.aiPersona) setAiPersona(parsed.aiPersona);
        if (parsed.soundscape) setSoundscape(parsed.soundscape);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.timezone) setTimezone(parsed.timezone);
        if (parsed.dailyReminder !== undefined) setDailyReminder(parsed.dailyReminder);
      }
    } catch (e) {}

    if (user) {
      const parts = (user.name || '').split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmail(user.email || '');
      setAvatarUrl(user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0284c7&color=fff`);
    }
  }, [user]);

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
    { id: '3', title: 'Sanctuary Master', desc: 'Deep contemplation in 432Hz Soundscapes', icon: <Clock className="w-4 h-4 text-amber-400" />, unlocked: true },
    { id: '4', title: 'Classical Scholar', desc: 'Mastered multi-tradition frameworks', icon: <BookOpen className="w-4 h-4 text-emerald-400" />, unlocked: true },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = () => {
    const updatedProfile = {
      name: `${firstName} ${lastName}`.trim(),
      email,
      picture: avatarUrl,
      phone,
      timezone,
      aiPersona,
      soundscape,
      dailyReminder,
      reminderTime
    };

    localStorage.setItem('noerax_user_settings', JSON.stringify(updatedProfile));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#070709] pt-28 pb-24 font-sans text-white relative overflow-hidden selection:bg-sky-400 selection:text-black">
      {/* Background Atmosphere Shimmer */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-gradient-to-b from-sky-500/8 via-cyan-500/4 to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-purple-900/10 blur-[180px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
        
        {/* Top Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-white/40 mb-4">
          <button onClick={() => navigate('/')} className="hover:text-white transition-colors cursor-pointer">
            Sanctuary Home
          </button>
          <span>/</span>
          <span className="text-cyan-300 font-semibold">Account & Settings</span>
        </div>

        {/* Page Title Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl font-serif italic text-white mb-2 tracking-tight"
              style={{ fontFamily: "'Instrument Serif', 'Playfair Display', serif" }}
            >
              Profile & Sanctuary Settings
            </h1>
            <p className="text-sm text-white/50 font-light max-w-xl">
              Manage your mindfulness identity, configure your AI guidance persona, and manage your private archival vault data.
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="btn-liquid-secondary !py-2 !px-4 !text-xs shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </button>
        </div>

        {/* Main 2-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Vertical Nav Tabs */}
          <div className="w-full lg:w-72 shrink-0 space-y-2 liquid-glass-strong rounded-3xl p-3 border border-white/10 backdrop-blur-2xl">
            {[
              { id: 'profile', icon: <User className="w-4 h-4" />, label: 'Sanctuary Profile' },
              { id: 'account', icon: <ShieldCheck className="w-4 h-4" />, label: 'Personal Information' },
              { id: 'persona', icon: <Sparkles className="w-4 h-4" />, label: 'AI Guide Persona' },
              { id: 'preferences', icon: <Sliders className="w-4 h-4" />, label: 'Audio & Reminders' },
              { id: 'security', icon: <Shield className="w-4 h-4" />, label: 'Data & Security' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full p-3.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-xs font-medium ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/25 font-semibold'
                      : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Main Content Pane */}
          <div className="flex-1 w-full liquid-glass-strong rounded-[28px] p-6 sm:p-9 border border-white/10 shadow-2xl backdrop-blur-2xl">
            
            {/* ── TAB 1: SANCTUARY PROFILE ── */}
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                
                {/* Profile Header Banner */}
                <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/8 flex-wrap">
                  <div className="flex items-center gap-4">
                    <img
                      src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0284c7&color=fff`}
                      alt="Avatar"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-full border-2 border-cyan-400/50 object-cover shadow-lg"
                    />
                    <div>
                      <h3 className="text-xl font-serif italic text-white font-medium flex items-center gap-2">
                        {firstName ? `${firstName} ${lastName}` : 'Mindful Seeker'}
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      </h3>
                      <p className="text-xs text-white/40 font-mono">{email || 'Verified Seeker'}</p>
                    </div>
                  </div>

                  <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-semibold">
                    Level {level} Seeker
                  </span>
                </div>

                {/* Metrics Stats Grid */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/8">
                    <span className="text-xs text-white/40 block flex items-center justify-center gap-1 mb-1 font-mono">
                      <Flame className="w-3.5 h-3.5 text-dharma-flame" /> Daily Streak
                    </span>
                    <span className="font-serif italic text-2xl text-white font-medium">{streak} Days</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/8">
                    <span className="text-xs text-white/40 block flex items-center justify-center gap-1 mb-1 font-mono">
                      <BookOpen className="w-3.5 h-3.5 text-cyan-300" /> Reflections
                    </span>
                    <span className="font-serif italic text-2xl text-white font-medium">{journals.length} Saved</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/8">
                    <span className="text-xs text-white/40 block flex items-center justify-center gap-1 mb-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" /> Mindful Mins
                    </span>
                    <span className="font-serif italic text-2xl text-white font-medium">{totalMins}m</span>
                  </div>
                </div>

                {/* Level Progress Bar */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 space-y-2">
                  <div className="flex justify-between text-xs font-mono text-white/50">
                    <span>Level {level} Mastery</span>
                    <span className="text-cyan-300">{xpProgress}% to Level {level + 1}</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
                    <div className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full" style={{ width: `${xpProgress}%` }} />
                  </div>
                </div>

                {/* 30-Day Activity Matrix */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/8 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono uppercase tracking-widest text-white/50 font-semibold">
                      30-Day Sanctuary Activity Matrix
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400">● Active Rhythm</span>
                  </div>
                  <div className="grid grid-cols-10 gap-2 pt-1">
                    {last30Days.map((day, idx) => (
                      <div
                        key={idx}
                        title={`Date: ${day.dateStr}`}
                        className={`h-4 rounded-md transition-all ${
                          day.active
                            ? 'bg-gradient-to-br from-sky-400 to-cyan-500 shadow-md shadow-sky-500/30'
                            : 'bg-white/[0.04] border border-white/5'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Achievement Badges */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-white/50 mb-3 font-semibold">
                    Unlocked Milestones
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {BADGES.map((b) => (
                      <div key={b.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 shrink-0">
                          {b.icon}
                        </div>
                        <div>
                          <h5 className="text-xs font-semibold text-white">{b.title}</h5>
                          <p className="text-[11px] text-white/40 font-light">{b.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}

            {/* ── TAB 2: PERSONAL INFORMATION ── */}
            {activeTab === 'account' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h3 className="text-xl font-serif italic text-white mb-1">Personal Information</h3>
                  <p className="text-xs text-white/40">Manage your seeker profile details and avatar.</p>
                </div>

                {/* Avatar Edit Box */}
                <div className="flex items-center gap-5 p-4 rounded-2xl bg-white/[0.02] border border-white/8">
                  <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-cyan-400/50 object-cover" />
                  <div className="flex items-center gap-2.5">
                    <label className="btn-liquid-primary !py-2 !px-4 !text-xs cursor-pointer flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5" /> Upload Image
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(firstName || 'User')}&background=0284c7&color=fff`)}
                      className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                      title="Reset Avatar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Form Fields 2-Column Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5">First Name *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5">Last Name *</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5">Phone Number *</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-white/50 mb-1.5">Time Zone *</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0e0e12] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
                    >
                      <option value="UTC +05:30 - Asia / Kolkata">UTC +05:30 — Asia / India (IST)</option>
                      <option value="UTC +00:00 - Europe / London">UTC +00:00 — Europe / London (GMT)</option>
                      <option value="UTC -05:00 - America / New_York">UTC -05:00 — America / New York (EST)</option>
                      <option value="UTC -08:00 - America / Los_Angeles">UTC -08:00 — America / Los Angeles (PST)</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── TAB 3: AI GUIDE PERSONA ── */}
            {activeTab === 'persona' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h3 className="text-xl font-serif italic text-white mb-1">AI Guide Lens & Persona</h3>
                  <p className="text-xs text-white/40">Select the philosophical lens your AI Guide employs during reflection and dialogue.</p>
                </div>

                <div className="space-y-3">
                  {AI_PERSONAS.map((p) => {
                    const isSelected = aiPersona === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setAiPersona(p.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/10 border-cyan-400/50 shadow-lg ring-1 ring-cyan-400/30'
                            : 'bg-white/[0.02] border-white/8 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                            {p.label}
                          </h4>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <p className="text-xs text-white/60 mb-2 font-light leading-relaxed">{p.desc}</p>
                        <p className="text-xs font-serif italic text-cyan-200/80 pl-3 border-l border-cyan-400/40">{p.quote}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── TAB 4: AUDIO & REMINDERS ── */}
            {activeTab === 'preferences' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h3 className="text-xl font-serif italic text-white mb-1">Audio & Notification Preferences</h3>
                  <p className="text-xs text-white/40">Customize default sanctuary soundscapes and daily contemplation alerts.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5">Default Ambient Soundscape</label>
                    <select
                      value={soundscape}
                      onChange={(e) => setSoundscape(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0e0e12] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
                    >
                      <option value="singing_bowl">432Hz Tibetan Singing Bowl Tone</option>
                      <option value="rain">Gentle Temple Rain</option>
                      <option value="stream">Forest Mountain Stream</option>
                      <option value="drone">Deep Cosmic Contemplation Drone</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Daily Morning Contemplation Reminder</h4>
                      <p className="text-xs text-white/40">Receive your daily reflection quote at {reminderTime}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={dailyReminder}
                      onChange={(e) => setDailyReminder(e.target.checked)}
                      className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── TAB 5: DATA & SECURITY ── */}
            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h3 className="text-xl font-serif italic text-white mb-1">Data & Account Security</h3>
                  <p className="text-xs text-white/40">Manage your private reflection archives and session access.</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Export All Vault Data</h4>
                    <p className="text-xs text-white/40">Download all your saved reflections and protocol digests as JSON</p>
                  </div>
                  <button
                    onClick={() => {
                      const data = localStorage.getItem('noerax_saved_journals') || '[]';
                      const blob = new Blob([data], { type: 'application/json' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = `Noerax-Sanctuary-Export-${Date.now()}.json`;
                      link.click();
                    }}
                    className="btn-liquid-secondary !py-2 !px-4 !text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-300" /> Export JSON
                  </button>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={() => {
                      logout();
                      navigate('/auth');
                    }}
                    className="w-full py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out of Sanctuary
                  </button>
                </div>
              </motion.div>
            )}

            {/* Save Button Footer */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-between gap-3 mt-8">
              {saveSuccess ? (
                <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 animate-fade-in">
                  <Check className="w-4 h-4" /> Preferences Inscribed & Saved!
                </span>
              ) : <span />}

              <button
                onClick={handleSave}
                className="btn-liquid-primary !py-2.5 !px-7 !text-xs cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Save Preferences</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

