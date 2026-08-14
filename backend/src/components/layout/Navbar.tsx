import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Settings, Flame, LogOut, Search, Menu, X } from "lucide-react";
import { useStreak } from "../../lib/StreakContext";
import { SettingsModal } from "./SettingsModal";
import { StreakModal } from "../ui/StreakModal";
import { useAuth } from "../../lib/AuthContext";
import { useNavigate } from "react-router-dom";
import noeraxLogo from "../../assets/noerax-logo.png";

interface NavbarProps {
  onOpenProfile?: () => void;
}

export function Navbar({ onOpenProfile }: NavbarProps) {
  const { streak, hasCheckedInToday, checkIn } = useStreak();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 40);

      // Keep navbar visible if mobile menu is open or at the very top of page
      if (isMobileMenuOpen || currentY < 40) {
        setIsVisible(true);
      } else if (currentY > lastY && currentY > 80) {
        // Scrolling DOWN -> Hide navbar smoothly
        setIsVisible(false);
      } else if (currentY < lastY) {
        // Scrolling UP (even slightly) -> Show navbar immediately
        setIsVisible(true);
      }

      lastY = currentY > 0 ? currentY : 0;
      setLastScrollY(lastY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen]);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'AI Companion', path: '/ai-companion' },
    { label: 'Frameworks', path: '/#guides' },
    { label: 'Notes', path: '/#journal' },
    { label: 'Library', path: '/#library' },
    { label: 'Daily Card', path: '/daily-card' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: isVisible ? 0 : -120 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 md:px-12 py-4 flex items-center justify-between transition-colors duration-500 ${
          scrolled
            ? 'bg-[#070709]/85 backdrop-blur-xl border-b border-white/8 shadow-[0_4px_30px_rgba(0,0,0,0.4)]'
            : 'bg-transparent'
        }`}
      >
        {/* Luxury Brandmark & Wordmark */}
        <Link to="/" className="flex items-center gap-3 group cursor-pointer select-none">
          <div className="relative flex items-center justify-center">
            {/* Subtle Aura Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400/30 to-cyan-400/30 rounded-xl blur-md opacity-50 group-hover:opacity-100 group-hover:scale-115 transition-all duration-300 pointer-events-none" />
            
            {/* Glass Gem Icon Pill */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.06] border border-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-lg group-hover:border-cyan-400/50 group-hover:bg-white/[0.09] transition-all duration-300">
              <img 
                src={noeraxLogo} 
                alt="Noerax Emblem" 
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain mix-blend-screen brightness-125 contrast-125 transition-transform duration-300 group-hover:scale-110" 
              />
            </div>
          </div>

          <div className="flex flex-col text-left">
            <span 
              className="text-xl sm:text-2xl font-serif italic text-white font-semibold tracking-tight leading-none group-hover:text-cyan-200 transition-colors"
              style={{ fontFamily: "'Instrument Serif', 'Playfair Display', serif" }}
            >
              Noerax
            </span>
            <span className="text-[9px] font-mono tracking-[0.22em] uppercase text-cyan-300/80 mt-0.5 leading-none font-medium">
              Sanctuary
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-5 lg:gap-7 text-sm lg:text-base font-medium text-dharma-ivory-dim">
          {navItems.map(({ label, path }) => {
            const isMVP = label === 'AI Companion';
            if (isMVP) {
              return (
                <Link
                  key={label}
                  to={path}
                  className="relative group inline-flex items-center hover:text-white transition-colors duration-200"
                >
                  <span className="relative -top-2.5 mr-1 px-1 py-0.2 text-[8.5px] font-black tracking-wider text-black bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 rounded-md shadow-md -rotate-6 group-hover:rotate-0 transition-transform duration-300">
                    NEW
                  </span>
                  <span className="font-semibold sleek-mvp-text">
                    AI Companion
                  </span>
                  <span className="relative -top-2.5 ml-1 px-1 py-0.2 text-[8.5px] font-black tracking-wider text-white bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 rounded-md shadow-md rotate-6 group-hover:rotate-0 transition-transform duration-300">
                    COMING SOON
                  </span>
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-dharma-flame transition-all duration-300 group-hover:w-full" />
                </Link>
              );
            }
            return (
              <Link
                key={label}
                to={path}
                className="relative group hover:text-dharma-ivory transition-colors duration-200 whitespace-nowrap"
              >
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-dharma-flame transition-all duration-300 group-hover:w-full" />
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Streak Badge */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={checkIn}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-colors group ${
              hasCheckedInToday 
                ? 'bg-dharma-flame/10 border-dharma-flame/30' 
                : 'bg-dharma-ink-3 border-dharma-line-dark hover:border-dharma-flame/40'
            }`}
            title={hasCheckedInToday ? "Checked in today!" : "Click to check in for today"}
          >
            <motion.div
              animate={hasCheckedInToday ? {} : { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Flame className={`w-4 h-4 ${hasCheckedInToday ? 'text-dharma-flame fill-dharma-flame' : 'text-dharma-ivory-dim group-hover:text-dharma-flame'}`} />
            </motion.div>
            <span className={`text-xs font-semibold ${hasCheckedInToday ? 'text-dharma-flame' : 'text-dharma-ivory-dim'}`}>
              {streak} {streak === 1 ? 'Day' : 'Days'}
            </span>
          </motion.div>

          {/* Search Trigger Icon Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-menu'))}
            className="p-2 text-dharma-ivory-dim hover:text-dharma-flame transition-colors cursor-pointer"
            title="Search Noerax (Ctrl + K)"
          >
            <Search className="w-5 h-5" />
          </motion.button>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-dharma-line-dark">
              <Link to="/settings">
                <img 
                  src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=f97316&color=fff`} 
                  alt={user.name || 'User Profile'} 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).onerror = null;
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=f97316&color=fff`;
                  }}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-dharma-flame/40 shadow-sm cursor-pointer hover:scale-105 transition-transform object-cover"
                  title="View Profile & Settings"
                />
              </Link>
              <button 
                onClick={logout}
                className="p-1.5 sm:p-2 text-dharma-ivory-dim hover:text-red-400 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(user ? '/chat' : '/auth')}
              className="btn-liquid-primary !px-5 !py-2 !text-sm"
            >
              Start Learning
            </motion.button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 md:hidden text-dharma-ivory-dim hover:text-dharma-ivory transition-colors cursor-pointer"
            title="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Drawer Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-0 top-16 bg-[#070709]/95 border-b border-white/15 backdrop-blur-2xl z-30 p-6 shadow-2xl md:hidden font-sans"
          >
            <div className="flex flex-col space-y-4">
              {navItems.map(({ label, path }) => {
                const isMVP = label === 'AI Companion';
                if (isMVP) {
                  return (
                    <Link
                      key={label}
                      to={path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between text-base font-medium py-2 border-b border-white/10"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black bg-gradient-to-r from-cyan-400 to-sky-300 rounded-md shadow-sm -rotate-6">
                          NEW
                        </span>
                        <span className="font-semibold sleek-mvp-text">
                          AI Companion
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-amber-500 to-pink-500 rounded-md shadow-sm rotate-6">
                        COMING SOON
                      </span>
                    </Link>
                  );
                }
                return (
                  <Link
                    key={label}
                    to={path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-base font-medium text-white/80 hover:text-cyan-300 transition-colors py-2 border-b border-white/10"
                  >
                    {label}
                  </Link>
                );
              })}

              <div className="pt-2 flex justify-between items-center text-xs text-white/50 font-mono">
                <span>Daily Practice Streak:</span>
                <span className="font-bold text-cyan-300">{streak} Days</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <StreakModal />
    </>
  );
}



