import { motion, AnimatePresence } from 'motion/react';
import { Flame, X, ChevronLeft, ChevronRight, CheckCircle2, Shield, Trophy, Sparkles, Clock, ArrowRight } from 'lucide-react';
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
      <div key={`blank-${i}`} className="w-8 h-8 sm:w-9 sm:h-9" />
    ));

    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isCheckedIn = history.includes(dateStr);
      const isToday =
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

      return (
        <div key={`day-${day}`} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center relative">
          {isCheckedIn ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.15 }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center text-[#060608] shadow-[0_0_12px_rgba(52,211,153,0.4)] cursor-pointer"
              title={`Checked in on ${dateStr}`}
            >
              <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
            </motion.div>
          ) : (
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-[11px] sm:text-xs font-mono transition-all ${
                isToday
                  ? 'border border-dharma-flame/80 bg-dharma-flame/15 text-dharma-flame font-bold shadow-[0_0_12px_rgba(249,115,22,0.25)] ring-1 ring-dharma-flame/40'
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0c0c10] w-full max-w-[430px] rounded-[32px] p-6 sm:p-7 relative shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(249,115,22,0.06)] border border-white/[0.12] overflow-hidden text-white"
          >
            {/* Top Hairline Accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-dharma-flame/50 to-transparent" />

            {/* Ambient background glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-dharma-flame/20 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-white/40 hover:text-white rounded-full bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] transition-all z-20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* LeetCode Header: Flame & Streak Hero */}
            <div className="flex items-center gap-4 mb-5 pt-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#18181f] to-[#121217] border border-dharma-flame/30 flex items-center justify-center shrink-0 shadow-lg shadow-dharma-flame/15 relative group">
                <Flame className="w-7 h-7 text-dharma-flame fill-dharma-flame/20 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-serif italic text-white font-semibold tracking-tight">
                    {streak} <span className="text-lg font-sans not-italic font-light text-white/50">Day Streak</span>
                  </h3>
                </div>
                <p className="text-xs text-white/50 flex items-center gap-1.5 font-mono mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-dharma-flame" />
                  <span>{timeLeftToday} left today</span>
                </p>
              </div>
            </div>

            {/* Quick Stat Badges */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.07] hover:border-white/[0.14] transition-colors text-center">
                <span className="text-[10px] uppercase font-mono text-white/40 block mb-1">Current</span>
                <span className="text-sm font-bold font-mono text-white flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-dharma-flame" /> {streak}d
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.07] hover:border-white/[0.14] transition-colors text-center">
                <span className="text-[10px] uppercase font-mono text-white/40 block mb-1">Longest</span>
                <span className="text-sm font-bold font-mono text-amber-300 flex items-center justify-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" /> {maxStreak}d
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.07] hover:border-white/[0.14] transition-colors text-center">
                <span className="text-[10px] uppercase font-mono text-white/40 block mb-1">Freeze</span>
                <span className="text-sm font-bold font-mono text-sky-400 flex items-center justify-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-sky-400" /> {freezeTokens} Left
                </span>
              </div>
            </div>

            {/* Primary Action: Check In Button */}
            <div className="mb-5">
              {hasCheckedInToday ? (
                <div className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 shadow-inner">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Daily Challenge Completed Today ✨</span>
                </div>
              ) : (
                <button
                  onClick={handleCheckInClick}
                  disabled={isCheckingIn}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-dharma-flame via-amber-500 to-emerald-400 text-black font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.35)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Check In Today (+1 Day Streak)</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>
              )}
            </div>

            {/* Calendar Controls & Month Header */}
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-xs font-bold font-mono tracking-wider uppercase text-white/80">
                {monthName} {year}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white transition-all cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white transition-all cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-[#111116] border border-white/[0.07] rounded-2xl p-3.5 shadow-inner">
              <div className="grid grid-cols-7 gap-y-1.5 text-center mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-white/30 text-[10px] font-mono font-bold uppercase">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1.5 justify-items-center">
                {renderCalendarDays()}
              </div>
            </div>

            {/* Footer Tip */}
            <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] text-white/40 text-center font-mono flex items-center justify-center gap-1.5">
              <span>✦</span>
              <span>"Abhyasa" — Continuous disciplined practice unlocks stillness.</span>
              <span>✦</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}