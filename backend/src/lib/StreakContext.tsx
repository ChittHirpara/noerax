import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface StreakContextType {
  streak: number;
  maxStreak: number;
  totalActiveDays: number;
  freezeTokens: number;
  history: string[];
  activityMap: Record<string, number>;
  hasCheckedInToday: boolean;
  isModalOpen: boolean;
  timeLeftToday: string;
  setIsModalOpen: (isOpen: boolean) => void;
  checkIn: () => Promise<void>;
  useFreeze: () => Promise<boolean>;
  recordActivity: (dateStr?: string) => void;
  refreshStreak: () => Promise<void>;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export function StreakProvider({ children }: { children: ReactNode }) {
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalActiveDays, setTotalActiveDays] = useState(0);
  const [freezeTokens, setFreezeTokens] = useState(2);
  const [history, setHistory] = useState<string[]>([]);
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeLeftToday, setTimeLeftToday] = useState('');

  // Live midnight countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = Math.max(0, endOfDay.getTime() - now.getTime());

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeftToday(
        `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch or calculate streak data
  const refreshStreak = useCallback(async () => {
    const token = localStorage.getItem('token');
    const today = new Date();

    // 1. Try fetching from Backend API if user is authenticated
    if (token) {
      try {
        const res = await fetch('/api/streak', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStreak(data.currentStreak || 0);
          setMaxStreak(data.maxStreak || 0);
          setTotalActiveDays(data.totalActiveDays || 0);
          setFreezeTokens(typeof data.freezeTokens === 'number' ? data.freezeTokens : 2);
          setHasCheckedInToday(Boolean(data.hasCheckedInToday));
          setHistory(data.history || []);
          setActivityMap(data.activityCounts || {});

          // Cache to localStorage
          localStorage.setItem(
            'dharma_streak_data',
            JSON.stringify({
              currentStreak: data.currentStreak,
              maxStreak: data.maxStreak,
              totalActiveDays: data.totalActiveDays,
              freezeTokens: data.freezeTokens,
              lastCheckIn: data.hasCheckedInToday ? today.toISOString() : undefined,
              history: data.history,
              activityMap: data.activityCounts
            })
          );
          return;
        }
      } catch (e) {
        // Fallback to local storage
      }
    }

    // 2. Offline / LocalStorage fallback
    const savedData = localStorage.getItem('dharma_streak_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const {
          currentStreak = 0,
          maxStreak: savedMax = 0,
          totalActiveDays: savedTotal = 0,
          freezeTokens: savedFreeze = 2,
          lastCheckIn,
          history: savedHistory = [],
          activityMap: savedMap = {}
        } = parsed;

        let calculatedStreak = currentStreak;
        let isTodayDone = false;
        let activeFreeze = savedFreeze;

        if (lastCheckIn) {
          const lastDate = new Date(lastCheckIn);
          lastDate.setHours(0, 0, 0, 0);
          const todayZero = new Date(today);
          todayZero.setHours(0, 0, 0, 0);

          const diffDays = Math.round((todayZero.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 0) {
            isTodayDone = true;
          } else if (diffDays === 1) {
            isTodayDone = false;
          } else if (diffDays === 2 && activeFreeze > 0) {
            // Apply 1 freeze token automatically
            activeFreeze -= 1;
            isTodayDone = false;
          } else if (diffDays > 1) {
            calculatedStreak = 0;
            isTodayDone = false;
          }
        }

        const calculatedMax = Math.max(savedMax, calculatedStreak);
        const calculatedTotal = savedTotal || savedHistory.length || (calculatedStreak > 0 ? calculatedStreak : 0);

        setStreak(calculatedStreak);
        setMaxStreak(calculatedMax);
        setTotalActiveDays(calculatedTotal);
        setFreezeTokens(activeFreeze);
        setHasCheckedInToday(isTodayDone);
        setHistory(savedHistory);
        setActivityMap(savedMap);
      } catch (e) {
        console.error('Failed to parse streak data', e);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshStreak();
  }, [refreshStreak]);

  // Record custom activity on heatmap (e.g. journal entry or chat reflection)
  const recordActivity = useCallback((dateStr?: string) => {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    setActivityMap((prev) => {
      const updated = { ...prev, [targetDate]: (prev[targetDate] || 0) + 1 };
      try {
        const saved = localStorage.getItem('dharma_streak_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.activityMap = updated;
          localStorage.setItem('dharma_streak_data', JSON.stringify(parsed));
        }
      } catch {}
      return updated;
    });
  }, []);

  // Check In Today Action
  const checkIn = async () => {
    if (hasCheckedInToday) {
      setIsModalOpen(true);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const token = localStorage.getItem('token');

    // 1. If logged in, call backend checkin endpoint
    if (token) {
      try {
        const res = await fetch('/api/streak/checkin', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStreak(data.currentStreak);
          setMaxStreak(data.maxStreak);
          setTotalActiveDays(data.totalActiveDays);
          setFreezeTokens(data.freezeTokens);
          setHasCheckedInToday(true);
          setHistory(data.history || []);
          setActivityMap(data.activityCounts || {});
          setIsModalOpen(true);
          return;
        }
      } catch (e) {
        console.warn('Backend streak checkin failed, falling back to local state:', e);
      }
    }

    // 2. Local checkin
    const newStreak = streak + 1;
    const newMax = Math.max(maxStreak, newStreak);
    const newHistory = history.includes(todayStr) ? history : [...history, todayStr];
    const newTotal = newHistory.length;
    const newActivityMap = { ...activityMap, [todayStr]: (activityMap[todayStr] || 0) + 1 };

    setStreak(newStreak);
    setMaxStreak(newMax);
    setTotalActiveDays(newTotal);
    setHistory(newHistory);
    setActivityMap(newActivityMap);
    setHasCheckedInToday(true);
    setIsModalOpen(true);

    localStorage.setItem(
      'dharma_streak_data',
      JSON.stringify({
        currentStreak: newStreak,
        maxStreak: newMax,
        totalActiveDays: newTotal,
        freezeTokens,
        lastCheckIn: new Date().toISOString(),
        history: newHistory,
        activityMap: newActivityMap
      })
    );
  };

  // Use Freeze Token Action
  const useFreeze = async (): Promise<boolean> => {
    if (freezeTokens <= 0) return false;

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await fetch('/api/streak/freeze', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFreezeTokens(data.freezeTokens);
          return true;
        }
      } catch (e) {}
    }

    const updatedTokens = Math.max(0, freezeTokens - 1);
    setFreezeTokens(updatedTokens);
    try {
      const saved = localStorage.getItem('dharma_streak_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.freezeTokens = updatedTokens;
        localStorage.setItem('dharma_streak_data', JSON.stringify(parsed));
      }
    } catch {}
    return true;
  };

  return (
    <StreakContext.Provider
      value={{
        streak,
        maxStreak,
        totalActiveDays,
        freezeTokens,
        history,
        activityMap,
        hasCheckedInToday,
        isModalOpen,
        timeLeftToday,
        setIsModalOpen,
        checkIn,
        useFreeze,
        recordActivity,
        refreshStreak
      }}
    >
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak() {
  const context = useContext(StreakContext);
  if (context === undefined) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
}