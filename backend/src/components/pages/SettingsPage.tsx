import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, Sliders, Upload, Trash2, Check, ArrowLeft, Clock, Sparkles, Flame, Award, BookOpen, ShieldCheck, LogOut } from 'lucide-react';
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

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { streak, history } = useStreak();

  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'sanctuary' | 'notifications' | 'security'>('profile');

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [timezone, setTimezone] = useState('UTC +05:30 - Asia / Kolkata');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Sanctuary Preferences
  const [soundscape, setSoundscape] = useState('singing_bowl');
  const [aiTone, setAiTone] = useState('empathetic');
  const [mantraTime, setMantraTime] = useState('08:00');
  const [mantraEnabled, setMantraEnabled] = useState(true);

  // Vault state
  const [journals, setJournals] = useState<SavedJournal[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    try {
      const local = localStorage.getItem('noerax_saved_journals');
      if (local) setJournals(JSON.parse(local));
    } catch (e) {}

    if (user) {
      const parts = (user.name || '').split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmail(user.email || '');
      setAvatarUrl(user.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email || 'seeker'}`);
    }
  }, [user]);

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
    { id: '3', title: 'Sound Sanctuary', desc: 'Listened to 432Hz Soundscapes', icon: <Clock className="w-4 h-4 text-amber-400" />, unlocked: true },
    { id: '4', title: 'Scripture Scholar', desc: 'Explored ancient texts', icon: <BookOpen className="w-4 h-4 text-emerald-400" />, unlocked: true },
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
      soundscape,
      aiTone,
      mantraTime,
      mantraEnabled
    };

    localStorage.setItem('noerax_user_settings', JSON.stringify(updatedProfile));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-dharma-ink pt-24 pb-20 font-sans text-dharma-ivory">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        
        {/* Top Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-dharma-ivory-dim mb-3 font-medium">
          <button onClick={() => navigate('/')} className="hover:text-dharma-ivory transition-colors cursor-pointer">Home</button>
          <span>&gt;</span>
          <span className="text-dharma-flame">Profile & Settings</span>
        </div>

        {/* Page Title & Subtitle */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-dharma-line-dark pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-dharma-ivory mb-1">
              My Profile & Settings
            </h1>
            <p className="text-sm text-dharma-ivory-dim">
              Manage your personal mindfulness stats, account details, sanctuary preferences, and security in one unified place.
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-dharma-line-dark bg-dharma-ink-2 text-xs font-semibold text-dharma-ivory-dim hover:text-dharma-ivory hover:border-dharma-flame/40 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home Page
          </button>
        </div>

        {/* Main Card Layout */}
        <div className="flex flex-col lg:flex-row gap-8 bg-dharma-ink-2/90 border border-dharma-line-dark rounded-[32px] p-6 md:p-8 shadow-2xl overflow-hidden">
          
          {/* Left Vertical Navigation Bar */}
          <div className="flex lg:flex-col gap-2 border-b lg:border-b-0 lg:border-r border-dharma-line-dark pb-4 lg:pb-0 lg:pr-6 flex-shrink-0">
            {[
              { id: 'profile', icon: <User className="w-5 h-5" />, label: 'My Sanctuary Profile' },
              { id: 'account', icon: <ShieldCheck className="w-5 h-5" />, label: 'Account Information' },
              { id: 'sanctuary', icon: <Sliders className="w-5 h-5" />, label: 'Sanctuary Preferences' },
              { id: 'notifications', icon: <Bell className="w-5 h-5" />, label: 'Notifications' },
              { id: 'security', icon: <Shield className="w-5 h-5" />, label: 'Security & Data' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`p-3.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-dharma-flame text-white shadow-lg shadow-dharma-flame/30 font-semibold'
                    : 'bg-dharma-ink-3/40 text-dharma-ivory-dim hover:bg-dharma-ink-3 hover:text-dharma-ivory'
                }`}
                title={tab.label}
              >
                {tab.icon}
                <span className="hidden lg:inline text-xs font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Right Content Panel */}
          <div className="flex-1 space-y-8">
            
            {/* ── 1. MY SANCTUARY PROFILE (Integrated Sanctuary Stats & Level Badges) ── */}
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* User Banner Header */}
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-dharma-ink/60 border border-dharma-line-dark justify-between flex-wrap">
                  <div className="flex items-center gap-4">
                    <img
                      src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.name) || 'User')}&background=f97316&color=fff`}
                      alt="Avatar"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.name) || 'User')}&background=f97316&color=fff`;
                      }}
                      className="w-16 h-16 rounded-full border-2 border-dharma-flame/50 object-cover shadow-lg"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-dharma-ivory flex items-center gap-2">
                        {firstName ? `${firstName} ${lastName}` : 'Mindful Seeker'}
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      </h3>
                      <p className="text-xs text-dharma-ivory-dim">{email || 'LoggedIn Seeker'}</p>
                    </div>
                  </div>

                  <span className="px-3.5 py-1.5 rounded-full bg-dharma-flame/15 border border-dharma-flame/40 text-dharma-flame text-xs font-bold">
                    Level {level} Seeker
                  </span>
                </div>

                {/* Mindful Metrics Stats Grid */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-4 rounded-2xl bg-dharma-ink/80 border border-dharma-line-dark">
                    <span className="text-xs text-dharma-ivory-dim block flex items-center justify-center gap-1 mb-1">
                      <Flame className="w-4 h-4 text-dharma-flame" /> Daily Streak
                    </span>
                    <span className="font-bold text-xl text-dharma-ivory">{streak} Days</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-dharma-ink/80 border border-dharma-line-dark">
                    <span className="text-xs text-dharma-ivory-dim block flex items-center justify-center gap-1 mb-1">
                      <BookOpen className="w-4 h-4 text-cyan-400" /> Reflections
                    </span>
                    <span className="font-bold text-xl text-dharma-ivory">{journals.length} Saved</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-dharma-ink/80 border border-dharma-line-dark">
                    <span className="text-xs text-dharma-ivory-dim block flex items-center justify-center gap-1 mb-1">
                      <Clock className="w-4 h-4 text-emerald-400" /> Mindful Mins
                    </span>
                    <span className="font-bold text-xl text-dharma-ivory">{totalMins}m</span>
                  </div>
                </div>

                {/* Level Progress Bar */}
                <div className="p-4 rounded-2xl bg-dharma-ink/60 border border-dharma-line-dark">
                  <div className="flex justify-between text-xs font-semibold text-dharma-ivory-dim mb-1.5">
                    <span>Level {level} Seeker</span>
                    <span className="text-dharma-flame">{xpProgress}% to Level {level + 1}</span>
                  </div>
                  <div className="w-full bg-dharma-ink h-2 rounded-full overflow-hidden border border-dharma-line-dark">
                    <div className="h-full bg-gradient-to-r from-dharma-flame to-cyan-400 rounded-full" style={{ width: `${xpProgress}%` }} />
                  </div>
                </div>

                {/* 30-Day Activity Heatmap Grid */}
                <div className="p-4 rounded-2xl bg-dharma-ink/60 border border-dharma-line-dark">
                  <span className="text-xs font-semibold uppercase tracking-widest text-dharma-ivory-dim block mb-3">
                    30-Day Sanctuary Activity Matrix
                  </span>
                  <div className="grid grid-cols-10 gap-2">
                    {last30Days.map((day, idx) => (
                      <div
                        key={idx}
                        title={`Date: ${day.dateStr}`}
                        className={`h-3 rounded-sm transition-colors ${
                          day.active ? 'bg-dharma-flame shadow-sm shadow-dharma-flame/50' : 'bg-dharma-ink-3/80'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Achievement Badges */}
                <div>
                  <h4 className="text-sm font-semibold text-dharma-ivory mb-3">Achievement Badges</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {BADGES.map((b) => (
                      <div key={b.id} className="p-3.5 rounded-2xl bg-dharma-ink border border-dharma-line-dark flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-dharma-ink-3 border border-dharma-line-dark">{b.icon}</div>
                        <div>
                          <h5 className="text-xs font-bold text-dharma-ivory">{b.title}</h5>
                          <p className="text-[11px] text-dharma-ivory-dim">{b.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}

            {/* ── 2. ACCOUNT INFORMATION (Language Removed) ── */}
            {activeTab === 'account' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-dharma-ivory mb-1">Account Information</h3>
                  <p className="text-xs text-dharma-ivory-dim">Edit your personal info and avatar.</p>
                </div>

                {/* Avatar Edit Box */}
                <div className="flex items-center gap-5 p-4 rounded-2xl bg-dharma-ink/60 border border-dharma-line-dark">
                  <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-dharma-flame/50 object-cover" />
                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2 bg-dharma-flame text-white text-xs font-semibold rounded-xl hover:bg-dharma-saffron transition-all cursor-pointer flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Upload An Image
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`)}
                      className="p-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                      title="Reset Avatar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Form Fields 2-Column Grid (No Language Field) */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-dharma-ivory-dim mb-2">First name *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-dharma-ink border border-dharma-line-dark text-dharma-ivory text-sm focus:outline-none focus:border-dharma-flame transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dharma-ivory-dim mb-2">Last name *</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-dharma-ink border border-dharma-line-dark text-dharma-ivory text-sm focus:outline-none focus:border-dharma-flame transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dharma-ivory-dim mb-2">Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-dharma-ink border border-dharma-line-dark text-dharma-ivory text-sm focus:outline-none focus:border-dharma-flame transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dharma-ivory-dim mb-2">Phone number *</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-dharma-ink border border-dharma-line-dark text-dharma-ivory text-sm focus:outline-none focus:border-dharma-flame transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-dharma-ivory-dim mb-2">Time zone *</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-dharma-ink border border-dharma-line-dark text-dharma-ivory text-sm focus:outline-none focus:border-dharma-flame transition-colors appearance-none cursor-pointer"
                    >
                      <option value="UTC +05:30 - Asia / Kolkata">🌐 UTC +05:30 - Asia / India</option>
                      <option value="UTC +07:00 - Asia / US">🌐 UTC +07:00 - Asia / US</option>
                      <option value="UTC +00:00 - Europe / London">🌐 UTC +00:00 - Europe / London</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── 3. SANCTUARY PREFERENCES ── */}
            {activeTab === 'sanctuary' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-dharma-ivory mb-1">Sanctuary & Audio Preferences</h3>
                  <p className="text-xs text-dharma-ivory-dim">Customize default soundscapes and AI guidance persona.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-dharma-ivory-dim mb-2">Default Ambient Soundscape</label>
                    <select
                      value={soundscape}
                      onChange={(e) => setSoundscape(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-dharma-ink border border-dharma-line-dark text-dharma-ivory text-sm focus:outline-none focus:border-dharma-flame transition-colors"
                    >
                      <option value="singing_bowl">🥣 432Hz Tibetan Singing Bowl Tone</option>
                      <option value="rain">🌧️ Gentle Sanctuary Rain</option>
                      <option value="stream">🌲 Forest River Flow</option>
                      <option value="drone">🌌 Cosmic Deep Drone</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dharma-ivory-dim mb-2">AI Guide Persona & Tone</label>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-dharma-ink border border-dharma-line-dark text-dharma-ivory text-sm focus:outline-none focus:border-dharma-flame transition-colors"
                    >
                      <option value="empathetic">✨ Empathetic, Calm & Modern (Gen Z Relatable)</option>
                      <option value="stoic">🏛️ Stoic & Direct Wisdom</option>
                      <option value="scholarly">📜 Traditional Scripture Scholar</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── 4. NOTIFICATIONS ── */}
            {activeTab === 'notifications' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-dharma-ivory mb-1">Daily Reminders & Notifications</h3>
                  <p className="text-xs text-dharma-ivory-dim">Set up daily morning mantra and evening journal alerts.</p>
                </div>

                <div className="p-4 rounded-2xl bg-dharma-ink border border-dharma-line-dark flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-dharma-ivory">Daily Mantra Morning Alert</h4>
                    <p className="text-xs text-dharma-ivory-dim">Receive your morning reflection quote at {mantraTime}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={mantraEnabled}
                    onChange={(e) => setMantraEnabled(e.target.checked)}
                    className="w-5 h-5 accent-dharma-flame rounded cursor-pointer"
                  />
                </div>
              </motion.div>
            )}

            {/* ── 5. SECURITY & DATA ── */}
            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-dharma-ivory mb-1">Security & Data Management</h3>
                  <p className="text-xs text-dharma-ivory-dim">Manage account security and export your journal data.</p>
                </div>

                <div className="p-4 rounded-2xl bg-dharma-ink border border-dharma-line-dark flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-dharma-ivory">Export All Sanctuary Data</h4>
                    <p className="text-xs text-dharma-ivory-dim">Download all your saved reflections and audio playlists as JSON</p>
                  </div>
                  <button
                    onClick={() => {
                      const data = localStorage.getItem('noerax_saved_journals') || '[]';
                      const blob = new Blob([data], { type: 'application/json' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = `Noerax-Data-Export-${Date.now()}.json`;
                      link.click();
                    }}
                    className="px-4 py-2 bg-dharma-ink-3 border border-dharma-line-dark text-xs font-semibold rounded-xl text-dharma-ivory hover:border-dharma-flame/40 transition-colors cursor-pointer"
                  >
                    Export JSON
                  </button>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      logout();
                      navigate('/auth');
                    }}
                    className="w-full py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out of Account
                  </button>
                </div>
              </motion.div>
            )}

            {/* Save Button Footer Bar */}
            <div className="pt-6 border-t border-dharma-line-dark flex items-center justify-end gap-3">
              {saveSuccess && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Preferences Saved Successfully!
                </span>
              )}
              <button
                onClick={handleSave}
                className="px-8 py-3 bg-dharma-flame text-white text-sm font-semibold rounded-xl hover:bg-dharma-saffron transition-all shadow-lg shadow-dharma-flame/30 cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Save Changes
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
