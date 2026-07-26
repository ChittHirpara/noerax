import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, BookOpen, Headphones, PenLine, Sparkles, ArrowRight, X, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SEARCH_ITEMS = [
  { id: '0', title: 'AI Chatbot Sanctuary Workspace', type: 'AI Guide', section: 'Fullscreen Chat', path: '/chat', icon: <Sparkles className="w-4 h-4 text-dharma-flame" /> },
  { id: '1', title: 'Bhagavad Gita — Non-Attachment', type: 'Scripture', section: 'Reading Room', path: '/reading-room', icon: <BookOpen className="w-4 h-4 text-cyan-400" /> },
  { id: '2', title: 'Yoga Sutras — Stillness of Mind', type: 'Scripture', section: 'Reading Room', path: '/reading-room', icon: <BookOpen className="w-4 h-4 text-cyan-400" /> },
  { id: '3', title: 'Tao Te Ching — Natural Flow', type: 'Scripture', section: 'Reading Room', path: '/reading-room', icon: <BookOpen className="w-4 h-4 text-cyan-400" /> },
  { id: '4', title: '432Hz Solfeggio Audio Player', type: 'Soundscape', section: 'Audio', path: '/#mixtape', icon: <Headphones className="w-4 h-4 text-dharma-flame" /> },
  { id: '5', title: 'AI Voice Journal Dictation', type: 'Feature', section: 'Journal', path: '/#journal', icon: <PenLine className="w-4 h-4 text-emerald-400" /> },
  { id: '6', title: 'Daily Card of Clarity (3D Shuffle)', type: 'Ritual', section: 'Daily Card', path: '/daily-card', icon: <Layers className="w-4 h-4 text-indigo-400" /> },
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
          // Open menu
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
      else navigate('/');
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
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl bg-dharma-ink-2/95 backdrop-blur-2xl border border-dharma-line-dark rounded-3xl shadow-2xl overflow-hidden pointer-events-auto font-sans"
            >
              {/* Input Area */}
              <div className="flex items-center px-6 py-4 border-b border-dharma-line-dark">
                <Search className="w-5 h-5 text-dharma-flame mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a command or search scriptures, audio, shop..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  className="w-full bg-transparent text-lg text-dharma-ivory placeholder-dharma-ivory-dim/40 focus:outline-none font-serif"
                />
                <button
                  onClick={onClose}
                  className="p-1 rounded-full text-dharma-ivory-dim hover:text-dharma-ivory hover:bg-dharma-ivory/5 transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Results List */}
              <div data-lenis-prevent className="max-h-[380px] overflow-y-auto p-3 space-y-1 overscroll-contain">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-dharma-ivory-dim text-sm">
                    No matching results found for "{query}"
                  </div>
                ) : (
                  filtered.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item.path)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                        selectedIndex === idx
                          ? 'bg-dharma-flame/15 border border-dharma-flame/40 text-dharma-ivory'
                          : 'hover:bg-dharma-ink-3/60 text-dharma-ivory-dim border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-dharma-ink border border-dharma-line-dark">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-dharma-ivory">{item.title}</h4>
                          <span className="text-[11px] text-dharma-ivory-dim">{item.section}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-dharma-ink border border-dharma-line-dark text-dharma-flame">
                          {item.type}
                        </span>
                        <ArrowRight className="w-4 h-4 text-dharma-ivory-dim" />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer status bar */}
              <div className="px-6 py-3 border-t border-dharma-line-dark bg-dharma-ink-3/40 flex justify-between items-center text-xs text-dharma-ivory-dim">
                <span className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 rounded bg-dharma-ink border border-dharma-line-dark font-mono text-[10px]">↑↓</kbd> Navigate
                  <kbd className="px-1.5 py-0.5 rounded bg-dharma-ink border border-dharma-line-dark font-mono text-[10px]">↵</kbd> Select
                </span>
                <span className="flex items-center gap-1 text-dharma-flame font-medium">
                  <Sparkles className="w-3.5 h-3.5" /> Noerax Universal Search
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
