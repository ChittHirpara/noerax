import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, BookOpen, Headphones, PenLine, Sparkles, ArrowRight, X, Layers, Sun, User, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SEARCH_ITEMS = [
  { id: '0', title: 'AI Guidance Sanctuary Workspace', type: 'AI Mentor', section: 'Dialogue', path: '/chat', icon: <Sparkles className="w-4 h-4 text-cyan-300" /> },
  { id: '1', title: 'The Life Library (8 Classical Codexes)', type: 'Scripture', section: 'Codex', path: '/#library', icon: <BookOpen className="w-4 h-4 text-cyan-400" /> },
  { id: '2', title: 'Bhagavad Gita — Nishkama Karma', type: 'Scripture', section: 'Library', path: '/#library', icon: <BookOpen className="w-4 h-4 text-cyan-400" /> },
  { id: '3', title: 'Stoic Philosophy — Marcus Aurelius', type: 'Philosophy', section: 'Library', path: '/#library', icon: <BookOpen className="w-4 h-4 text-cyan-400" /> },
  { id: '4', title: 'Tao Te Ching — Lao Tzu (Wu Wei)', type: 'Philosophy', section: 'Library', path: '/#library', icon: <BookOpen className="w-4 h-4 text-cyan-400" /> },
  { id: '5', title: 'Notes & Application Vault', type: 'Feature', section: 'Journal', path: '/#journal', icon: <PenLine className="w-4 h-4 text-emerald-400" /> },
  { id: '6', title: 'Daily Card of Clarity (3D Shuffle)', type: 'Ritual', section: 'Daily Card', path: '/daily-card', icon: <Layers className="w-4 h-4 text-indigo-400" /> },
  { id: '7', title: 'Daily Morning Reflection Mantra', type: 'Contemplation', section: 'Daily Mantra', path: '/#daily-reflection', icon: <Sun className="w-4 h-4 text-amber-400" /> },
  { id: '8', title: 'AI Companion 3D Universe', type: 'Interactive', section: 'AI Companion', path: '/ai-companion', icon: <Compass className="w-4 h-4 text-pink-400" /> },
  { id: '9', title: 'Profile & Sanctuary Settings', type: 'Account', section: 'Settings', path: '/settings', icon: <User className="w-4 h-4 text-sky-400" /> },
];

export function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = SEARCH_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.type.toLowerCase().includes(query.toLowerCase()) ||
    item.section.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          window.dispatchEvent(new CustomEvent('open-command-menu'));
        }
      }
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        handleSelect(filtered[selectedIndex].path);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex]);

  const handleSelect = (path: string) => {
    onClose();
    setQuery('');
    if (path.startsWith('/#')) {
      const id = path.replace('/#', '');
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else navigate(path);
    } else {
      navigate(path);
    }
  };

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

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 pointer-events-none font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl bg-[#09090c]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto text-white"
            >
              {/* Input Area */}
              <div className="flex items-center px-6 py-4 border-b border-white/10">
                <Search className="w-5 h-5 text-cyan-300 mr-3 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a command or search frameworks, notes, rituals..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  className="w-full bg-transparent text-base sm:text-lg text-white placeholder-white/40 focus:outline-none"
                />
                <button
                  onClick={onClose}
                  className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors ml-2 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Results List */}
              <div className="max-h-[380px] overflow-y-auto p-3 space-y-1 overscroll-contain">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-white/40 text-xs font-mono">
                    No matching results found for "{query}"
                  </div>
                ) : (
                  filtered.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item.path)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                        selectedIndex === idx
                          ? 'bg-gradient-to-r from-sky-500/20 to-cyan-500/10 border border-cyan-400/30 text-white shadow-sm'
                          : 'bg-transparent text-white/70 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-medium text-white">{item.title}</h4>
                          <span className="text-[10px] font-mono uppercase text-white/40">{item.section} · {item.type}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-cyan-300 opacity-60">Jump to</span>
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-300" />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Shortcut Bar */}
              <div className="px-6 py-2.5 bg-white/[0.02] border-t border-white/8 flex items-center justify-between text-[11px] font-mono text-white/40">
                <div className="flex items-center gap-3">
                  <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80">↓</kbd> Navigate</span>
                  <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80">↵</kbd> Select</span>
                  <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80">ESC</kbd> Close</span>
                </div>
                <span className="text-cyan-300/80">Ctrl + K</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
