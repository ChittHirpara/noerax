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
  const monthName = viewDate.toLocaleString('default', { month: 'short' });

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleCheckInClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasCheckedInToday || isCheckingIn) return;
    setIsCheckingIn(true);
    await checkIn();
    setIsCheckingIn(false);
  };

  const renderCalendarDays = () => {
    const blanks = Array.from({ length: firstDayOfMonth }).map((_, i) => (
      <div key={`blank-${i}`} className="w-7 h-7 sm:w-8 sm:h-8" />
    ));

    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isCheckedIn = history.includes(dateStr);
      const isToday =
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

      return (
        <div key={`day-${day}`} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center relative">
          {isCheckedIn ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.15 }}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center text-[#060608] shadow-[0_0_8px_rgba(52,211,153,0.4)] cursor-pointer"
              title={`Checked in on ${dateStr}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </motion.div>
          ) : (
            <div
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[10px] sm:text-[11px] font-mono transition-all ${
                isToday
                  ? 'border border-dharma-flame/80 bg-dharma-flame/15 text-dharma-flame font-bold ring-1 ring-dharma-flame/40'
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
        <>
          {/* Invisible Click-Outside Backdrop (keeps whole webpage clear & visible) */}
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity"
          />

          {/* Compact Floating Popover Card Anchored to Top-Right below Navbar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed top-16 sm:top-[72px] right-3 sm:right-6 md:right-10 lg:right-20 z-50 w-[335px] sm:w-[360px] bg-[#0d0d12]/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(249,115,22,0.08)] border border-white/[0.14] overflow-hidden"
          >
            {/* Top Pointer Arrow */}
            <div className="absolute -top-1.5 right-14 sm:right-20 w-3 h-3 bg-[#0d0d12] border-t border-l border-white/20 transform rotate-45 pointer-events-none" />

            {/* Top Hairline Gradient Rim */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-dharma-flame/50 to-transparent" />

            {/* Header: Flame Hero & Close Button */}
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1c1c24] to-[#121217] border border-dharma-flame/30 flex items-center justify-center shrink-0 shadow-md shadow-dharma-flame/15 relative">
                  <Flame className="w-5 h-5 text-dharma-flame fill-dharma-flame/20 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]" />
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-serif italic text-white font-semibold leading-none">
                    {streak} <span className="text-sm font-sans not-italic font-normal text-white/50">Day Streak</span>
                  </h3>
                  <p className="text-[10px] text-white/50 font-mono flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-dharma-flame" />
                    <span>{timeLeftToday} left</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-white/40 hover:text-white rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.06] transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3 Quick Stat Cards */}
            <div className="grid grid-cols-3 gap-1.5 mb-3.5">
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                <span className="text-[9px] uppercase font-mono text-white/40 block">Current</span>
                <span className="text-xs font-bold font-mono text-white flex items-center justify-center gap-1 mt-0.5">
                  <Flame className="w-3 h-3 text-dharma-flame" /> {streak}d
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                <span className="text-[9px] uppercase font-mono text-white/40 block">Longest</span>
                <span className="text-xs font-bold font-mono text-amber-300 flex items-center justify-center gap-1 mt-0.5">
                  <Trophy className="w-3 h-3 text-amber-400" /> {maxStreak}d
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                <span className="text-[9px] uppercase font-mono text-white/40 block">Freeze</span>
                <span className="text-xs font-bold font-mono text-sky-400 flex items-center justify-center gap-1 mt-0.5">
                  <Shield className="w-3 h-3 text-sky-400" /> {freezeTokens}
                </span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="mb-3.5">
              {hasCheckedInToday ? (
                <div className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-inner">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Checked In for Today! ✨</span>
                </div>
              ) : (
                <button
                  onClick={handleCheckInClick}
                  disabled={isCheckingIn}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-dharma-flame via-amber-500 to-emerald-400 text-black font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  <span>Check In Today (+1 Day)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-black" />
                </button>
              )}
            </div>

            {/* Calendar Controls & Month Switcher */}
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-[11px] font-bold font-mono tracking-wider uppercase text-white/80">
                {monthName} {year}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1 rounded bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white transition-all cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 rounded bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white transition-all cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Compact Calendar Grid */}
            <div className="bg-[#121217] border border-white/[0.06] rounded-xl p-2.5 shadow-inner">
              <div className="grid grid-cols-7 gap-y-1 text-center mb-1.5">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-white/30 text-[9px] font-mono font-bold uppercase">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                {renderCalendarDays()}
              </div>
            </div>

            {/* Footer Micro-Badge */}
            <div className="mt-2.5 pt-2 border-t border-white/[0.05] text-[10px] text-white/40 text-center font-mono flex items-center justify-center gap-1">
              <span>✦</span>
              <span>Abhyasa: Daily consistency builds inner mastery</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}