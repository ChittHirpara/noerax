import { motion, AnimatePresence } from 'motion/react';
import { Flame, X, ChevronLeft, ChevronRight, CheckCircle2, Shield, Trophy, Sparkles, Clock } from 'lucide-react';
import { useStreak } from '../../lib/StreakContext';
import { useState } from 'react';

export function StreakModal() {
  const {
    streak,
    maxStreak,
    totalActiveDays,
    freezeTokens,
    history,
    hasCheckedInToday,
    timeLeftToday,
    isModalOpen,
    setIsModalOpen,
    checkIn
  } = useStreak();

  const today = new Date();
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleCheckInClick = async () => {
    if (hasCheckedInToday || isCheckingIn) return;
    setIsCheckingIn(true);
    await checkIn();
    setIsCheckingIn(false);
  };

  const renderCalendarDays = () => {
    const blanks = Array.from({ length: firstDayOfMonth }).map((_, i) => (
      <div key={`blank-${i}`} className="w-9 h-9 sm:w-10 sm:h-10" />
    ));

    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isCheckedIn = history.includes(dateStr);
      const isToday =
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

      return (
        <div key={`day-${day}`} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center relative">
          {isCheckedIn ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.15 }}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-black font-bold shadow-[0_0_12px_rgba(52,211,153,0.4)] cursor-pointer"
              title={`Checked in on ${dateStr}`}
            >
              <CheckCircle2 className="w-5 h-5 text-[#0A0A0C]" strokeWidth={3} />
            </motion.div>
          ) : (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono transition-all ${
                isToday
                  ? 'border-2 border-dharma-flame bg-dharma-flame/15 text-dharma-flame font-bold shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {day}
            </div>
          )}
        </div>
      );
    });

    return [...blanks, ...days];
  };

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-lg p-4"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121216] w-full max-w-md rounded-[32px] p-6 sm:p-7 relative shadow-2xl border border-white/10 overflow-hidden text-white"
          >
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-dharma-flame/20 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-white/40 hover:text-white rounded-full bg-white/[0.05] hover:bg-white/[0.1] transition-all z-20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* LeetCode Header: Flame & Streak Hero */}
            <div className="flex items-center gap-4 mb-5 pt-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-dharma-flame/20 to-amber-500/10 border border-dharma-flame/40 flex items-center justify-center shrink-0 shadow-lg shadow-dharma-flame/20 relative">
                <Flame className="w-8 h-8 text-dharma-flame animate-bounce" />
                <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-extrabold tracking-tight font-kanit text-white">
                    {streak} <span className="text-lg font-light text-white/60 font-sans">Day Streak</span>
                  </h3>
                </div>
                <p className="text-xs text-white/50 flex items-center gap-1 font-mono mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-dharma-flame" />
                  <span>{timeLeftToday} remaining today</span>
                </p>
              </div>
            </div>

            {/* Quick Stat Badges */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                <span className="text-[10px] uppercase font-mono text-white/40 block">Current</span>
                <span className="text-sm font-bold font-mono text-white flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-dharma-flame" /> {streak}d
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                <span className="text-[10px] uppercase font-mono text-white/40 block">Longest</span>
                <span className="text-sm font-bold font-mono text-amber-300 flex items-center justify-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" /> {maxStreak}d
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                <span className="text-[10px] uppercase font-mono text-white/40 block">Freeze</span>
                <span className="text-sm font-bold font-mono text-sky-400 flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3 text-sky-400" /> {freezeTokens} Left
                </span>
              </div>
            </div>

            {/* Primary Action: Check In Button */}
            <div className="mb-6">
              {hasCheckedInToday ? (
                <div className="w-full py-3 px-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 shadow-inner">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Daily Wisdom Check-In Completed Today! ✨</span>
                </div>
              ) : (
                <button
                  onClick={handleCheckInClick}
                  disabled={isCheckingIn}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-dharma-flame via-amber-500 to-emerald-500 text-black font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-dharma-flame/30 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Check In Today (+1 Day Streak)</span>
                </button>
              )}
            </div>

            {/* Calendar Controls & Month Header */}
            <div className="flex justify-between items-center mb-3 px-2">
              <span className="text-sm font-semibold font-mono text-white/90">
                {monthName} {year}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-white/60 hover:text-white transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-white/60 hover:text-white transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3">
              <div className="grid grid-cols-7 gap-y-2 text-center mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-white/30 text-[11px] font-mono font-semibold">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-2 justify-items-center">
                {renderCalendarDays()}
              </div>
            </div>

            {/* Footer Tip */}
            <div className="mt-4 pt-3 border-t border-white/[0.05] text-[11px] text-white/40 text-center font-mono">
              <span>"Abhyasa" — With steady practice, clarity and mastery unfold.</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}