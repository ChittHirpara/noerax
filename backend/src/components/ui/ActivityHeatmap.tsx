import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Trophy, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import { useStreak } from '../../lib/StreakContext';

interface HeatmapDay {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3;
  isToday: boolean;
  dayOfWeek: number; // 0 = Sun, 6 = Sat
}

interface ActivityHeatmapProps {
  className?: string;
  showStats?: boolean;
  showLegend?: boolean;
  title?: string;
}

export function ActivityHeatmap({
  className = '',
  showStats = true,
  showLegend = true,
  title = 'Sanctuary Contribution Matrix'
}: ActivityHeatmapProps) {
  const { streak, maxStreak, totalActiveDays, history, activityMap } = useStreak();
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Generate 52 weeks (364 days + pad to end of current week)
  const { weeks, monthLabels, totalContributions } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // End on Saturday of current week
    const currentDayOfWeek = today.getDay();
    const daysUntilEndOfWeek = 6 - currentDayOfWeek;
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + daysUntilEndOfWeek);

    // Total 52 weeks = 364 days
    const totalDays = 52 * 7;
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - totalDays + 1);

    const dayList: HeatmapDay[] = [];
    const months: { name: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    let totalCount = 0;

    const curr = new Date(startDate);
    let dayIndex = 0;

    while (curr <= endDate) {
      const dateStr = curr.toISOString().split('T')[0];
      const isCheckedIn = history.includes(dateStr);
      const customCount = activityMap[dateStr] || 0;
      const count = isCheckedIn ? Math.max(1, customCount) : customCount;
      totalCount += count;

      let level: 0 | 1 | 2 | 3 = 0;
      if (count >= 3) level = 3;
      else if (count === 2) level = 2;
      else if (count >= 1) level = 1;

      const isToday = curr.getTime() === today.getTime();
      const weekIdx = Math.floor(dayIndex / 7);

      if (curr.getMonth() !== lastMonth && curr.getDate() <= 7) {
        lastMonth = curr.getMonth();
        months.push({
          name: curr.toLocaleString('default', { month: 'short' }),
          weekIndex: weekIdx
        });
      }

      dayList.push({
        date: new Date(curr),
        dateStr,
        count,
        level,
        isToday,
        dayOfWeek: curr.getDay()
      });

      curr.setDate(curr.getDate() + 1);
      dayIndex++;
    }

    // Group into 52 columns (weeks)
    const groupedWeeks: HeatmapDay[][] = [];
    for (let i = 0; i < dayList.length; i += 7) {
      groupedWeeks.push(dayList.slice(i, i + 7));
    }

    return { weeks: groupedWeeks, monthLabels: months, totalContributions: totalCount };
  }, [history, activityMap]);

  // Color intensities
  const getCellColor = (level: number, isToday: boolean) => {
    switch (level) {
      case 3:
        return 'bg-gradient-to-br from-cyan-300 to-sky-400 border-cyan-200 shadow-[0_0_8px_rgba(56,189,248,0.5)]';
      case 2:
        return 'bg-emerald-400 border-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.35)]';
      case 1:
        return 'bg-emerald-600/70 border-emerald-500/50';
      default:
        return isToday
          ? 'bg-white/[0.08] border-dharma-flame/60'
          : 'bg-[#18181b] border-white/[0.04] hover:border-white/20';
    }
  };

  const handleMouseEnter = (day: HeatmapDay, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredDay(day);
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    });
  };

  return (
    <div className={`rounded-3xl bg-[#0e0e11] border border-white/[0.08] p-5 sm:p-6 text-white relative shadow-2xl overflow-hidden ${className}`}>
      {/* Glow ambient background */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Stats Banner */}
      {showStats && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06] mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold tracking-wide uppercase font-mono text-white/90">
                {title}
              </h3>
            </div>
            <p className="text-xs text-white/40 mt-0.5">
              {totalContributions || totalActiveDays} total activities in the past year
            </p>
          </div>

          {/* Stat Pills */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-dharma-flame animate-pulse" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-mono text-white/40 block leading-none">Current</span>
                <span className="text-xs font-semibold text-white font-mono">{streak} Days</span>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-mono text-white/40 block leading-none">Longest</span>
                <span className="text-xs font-semibold text-white font-mono">{maxStreak} Days</span>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-mono text-white/40 block leading-none">Active</span>
                <span className="text-xs font-semibold text-white font-mono">{totalActiveDays} Days</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Grid Container (Scrollable on small mobile screens) */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
        <div className="min-w-[680px]">
          {/* Month Labels Header */}
          <div className="flex text-[11px] font-mono text-white/40 pl-8 mb-1.5 relative h-4">
            {monthLabels.map((m, idx) => (
              <span
                key={idx}
                className="absolute transform -translate-x-1/2"
                style={{ left: `${(m.weekIndex / 52) * 100}%` }}
              >
                {m.name}
              </span>
            ))}
          </div>

          {/* Matrix Body with Day of Week Labels */}
          <div className="flex gap-2">
            {/* Day of Week Labels (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between text-[10px] font-mono text-white/30 py-0.5 w-6 shrink-0 h-[104px]">
              <span></span>
              <span>Mon</span>
              <span></span>
              <span>Wed</span>
              <span></span>
              <span>Fri</span>
              <span></span>
            </div>

            {/* 52 Columns */}
            <div className="flex gap-[3px] flex-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px] flex-1">
                  {week.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      onMouseEnter={(e) => handleMouseEnter(day, e)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`w-full aspect-square rounded-[3px] border transition-transform duration-150 cursor-pointer ${getCellColor(
                        day.level,
                        day.isToday
                      )} ${hoveredDay?.dateStr === day.dateStr ? 'scale-125 z-20 ring-2 ring-white/50' : 'hover:scale-110'}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Legend */}
      {showLegend && (
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.05] text-xs text-white/40">
          <div className="flex items-center gap-1 text-[11px] font-mono">
            <span>Learn everyday to build your wisdom streak</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#18181b] border border-white/[0.06] inline-block" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600/70 border border-emerald-500/50 inline-block" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 border border-emerald-300 inline-block" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-cyan-300 border border-white inline-block" />
            <span>More</span>
          </div>
        </div>
      )}

      {/* Floating Hover Tooltip (LeetCode Style) */}
      <AnimatePresence>
        {hoveredDay && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: 'translate(-50%, -100%)'
            }}
            className="fixed z-50 pointer-events-none bg-[#18181b] border border-white/15 text-white text-xs px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md"
          >
            <div className="font-semibold text-white flex items-center gap-1.5">
              {hoveredDay.count > 0 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-white/20" />
              )}
              <span>
                {hoveredDay.count > 0
                  ? `${hoveredDay.count} active ${hoveredDay.count === 1 ? 'session' : 'sessions'}`
                  : 'No activity'}
              </span>
            </div>
            <div className="text-[10px] text-white/50 font-mono mt-0.5">
              {hoveredDay.date.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
              {hoveredDay.isToday && ' (Today)'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}