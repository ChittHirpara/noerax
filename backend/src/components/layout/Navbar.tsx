import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Settings, Flame, LogOut, Search } from "lucide-react";
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`fixed top-0 w-full z-40 flex items-center justify-between transition-all duration-500 ${
          scrolled
            ? 'py-3 px-8 md:px-16 backdrop-blur-xl bg-dharma-ink/90 border-b border-dharma-line-dark shadow-lg shadow-black/40'
            : 'py-6 px-8 md:px-16 bg-transparent'
        }`}
      >
        {/* Logo */}
        <Link to="/">
          <motion.div
            whileHover={{ scale: 1.04 }}
            className="flex items-center cursor-pointer my-0"
          >
            <img
              src={noeraxLogo}
              alt="Noerax"
              className="h-16 md:h-20 w-auto object-contain transition-all"
              style={{ filter: 'brightness(1.15) contrast(1.05)' }}
            />
          </motion.div>
        </Link>


        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8 text-base font-medium text-dharma-ivory-dim">
          {['Home', 'Frameworks', 'Notes', 'Library', 'Daily Card'].map((label, i) => {
            const path = ['/', '/#guides', '/#journal', '/#library', '/daily-card'][i];
            return (
              <Link
                key={label}
                to={path}
                className="relative group hover:text-dharma-ivory transition-colors duration-200"
              >
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-dharma-flame transition-all duration-300 group-hover:w-full" />
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Streak Badge */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={checkIn}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-colors group ${
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
              <Flame className={`w-4 h-4 transition-colors ${hasCheckedInToday ? 'text-dharma-flame' : 'text-dharma-ivory-dim group-hover:text-dharma-flame'}`} />
            </motion.div>
            <span className={`text-sm font-semibold transition-colors ${hasCheckedInToday ? 'text-dharma-flame' : 'text-dharma-ivory-dim group-hover:text-dharma-ivory'}`}>
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
            <div className="flex items-center gap-3 ml-2 pl-3 border-l border-dharma-line-dark">
              <Link to="/settings">
                <img 
                  src={user.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`} 
                  alt={user.name} 
                  className="w-9 h-9 rounded-full border border-dharma-flame/40 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                  title="View Profile & Settings"
                />
              </Link>
              <button 
                onClick={logout}
                className="p-2 text-dharma-ivory-dim hover:text-red-400 transition-colors"
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
              className="px-6 py-2.5 text-sm font-semibold text-white bg-dharma-flame rounded-full hover:bg-dharma-saffron transition-colors duration-300 shadow-md shadow-dharma-flame/30"
            >
              Begin Journey
            </motion.button>
          )}
        </div>
      </motion.nav>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <StreakModal />
    </>
  );
}




