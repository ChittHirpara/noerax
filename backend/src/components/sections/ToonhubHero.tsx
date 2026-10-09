import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Sparkles,
  X,
  Send,
  Music,
  RotateCcw,
  MessageCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ToonhubCharacter {
  src: string;
  bg: string;
  panel: string;
  name: string;
  personality: string;
  description: string;
}

export const IMAGES: ToonhubCharacter[] = [
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png',
    bg: '#F4845F',
    panel: '#F79B7F',
    name: 'Ember',
    personality: 'The Hype & Fire Motivator',
    description: 'High energy, unyielding optimism, and the friend who pumps you up before any challenge.',
  },
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/2.b977faab.png',
    bg: '#6BBF7A',
    panel: '#85CC92',
    name: 'Sage',
    personality: 'The Calm & Grounded Realist',
    description: 'Brings stillness to mental storms, grounded clarity, and steady, thoughtful presence.',
  },
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/3.4df853b4.png',
    bg: '#E882B4',
    panel: '#ED9DC4',
    name: 'Luna',
    personality: 'The Gentle & Empathetic Soul',
    description: 'Understands emotions deeply, holds space without judgement, and listens with warmth.',
  },
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/4.4457fbce.png',
    bg: '#6EB5FF',
    panel: '#8DC4FF',
    name: 'Nova',
    personality: 'The Witty & Sharp Strategist',
    description: 'Playful humor, quick internet brain, sharp perspectives, and practical solutions.',
  },
];

const GREETINGS: Record<string, string> = {
  Ember: "Yo! Ready to lock in? Tell me what's on your mind — we're tackling it head on today! 💥",
  Sage: "Hey there. Take a slow breath... no rush here. What's weighing on your mind today? 🌿",
  Luna: "Hey bestie! You don't have to carry anything alone. Tell me how you're really feeling right now 🌸",
  Nova: "Yo what's good! What is the latest plot twist in your life? Spill the tea 👀",
};

const QUICK_PROMPTS: Record<string, string[]> = {
  Ember: [
    "Need motivation to start my goals",
    "I'm procrastinating so bad rn",
    "Hype me up for my big day",
  ],
  Sage: [
    "My mind won't stop overthinking",
    "How do I find calm in chaos?",
    "Need perspective on a hard choice",
  ],
  Luna: [
    "Feeling really lonely lately",
    "Just had a rough breakup",
    "Need someone who actually listens",
  ],
  Nova: [
    "Give me an honest reality check",
    "Why are people so weird lately?",
    "How to deal with drama peacefully",
  ],
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
}

export function ToonhubHero({ onSelectCharacter }: { onSelectCharacter?: (char: ToonhubCharacter) => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  // Chat overlay state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Preload all 4 images on mount
  useEffect(() => {
    IMAGES.forEach((item) => {
      const img = new Image();
      img.src = item.src;
    });
  }, []);

  // Update mobile status on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeChar = IMAGES[activeIndex];

  // Initialize or reset companion messages when active character changes or chat opens
  useEffect(() => {
    const defaultGreeting = GREETINGS[activeChar.name] || GREETINGS.Ember;
    const defaultSuggestions = QUICK_PROMPTS[activeChar.name] || QUICK_PROMPTS.Ember;
    setMessages([
      {
        id: 'welcome-' + activeChar.name,
        role: 'assistant',
        content: defaultGreeting,
        suggestions: defaultSuggestions,
      },
    ]);
  }, [activeIndex]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming, isChatOpen]);

  // Navigation with 650ms animation lock
  const navigate = (direction: 'next' | 'prev') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (direction === 'next' ? (prev + 1) % 4 : (prev + 3) % 4));
    setTimeout(() => {
      setIsAnimating(false);
    }, 650);
  };

  // Roles derived from activeIndex
  const getRole = (index: number): 'center' | 'left' | 'right' | 'back' => {
    if (index === activeIndex) return 'center';
    if (index === (activeIndex + 3) % 4) return 'left';
    if (index === (activeIndex + 1) % 4) return 'right';
    return 'back';
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
    if (onSelectCharacter) {
      onSelectCharacter(activeChar);
    }
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  // Helper to parse suggestions from AI stream
  const parseSuggestions = (raw: string): { cleanText: string; suggestions: string[] } => {
    const matchIndex = raw.search(/SUGGESTIONS\s*:/i);
    if (matchIndex === -1) return { cleanText: raw.trim(), suggestions: [] };
    const cleanText = raw.slice(0, matchIndex).trim();
    const block = raw.slice(matchIndex).replace(/SUGGESTIONS\s*:/i, '').trim();
    let suggestions: string[] = [];
    try {
      const parsed = JSON.parse(block);
      if (Array.isArray(parsed)) {
        suggestions = parsed.map((s) => String(s).trim()).filter(Boolean);
      }
    } catch {
      const quoted = block.match(/"([^"]+)"|'([^']+)'/g);
      if (quoted) {
        suggestions = quoted.map((m) => m.slice(1, -1).trim()).filter((s) => s.length > 3);
      }
    }
    return { cleanText, suggestions: suggestions.slice(0, 3) };
  };

  // Send message to live backend API
  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend !== undefined ? textToSend : input).trim();
    if (!promptText || isStreaming) return;

    setInput('');
    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: promptText,
    };

    const aiMsgPlaceholder: ChatMessage = {
      id: 'ai-' + Date.now(),
      role: 'assistant',
      content: '',
      suggestions: [],
    };

    const updated = [...messages, userMsg, aiMsgPlaceholder];
    setMessages(updated);
    setIsStreaming(true);

    try {
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome-' + activeChar.name)
        .map((m) => ({
          role: m.role === 'assistant' ? 'ai' : 'user',
          content: m.content,
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          history: historyPayload,
          botName: activeChar.name,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Chat request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamed = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.text) {
                streamed += parsed.text;
                setMessages((prev) => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last && last.role === 'assistant') {
                    const { cleanText } = parseSuggestions(streamed);
                    copy[copy.length - 1] = { ...last, content: cleanText || streamed };
                  }
                  return copy;
                });
              }
            } catch {}
          }
        }
      }

      // Final pass to extract clean text and suggestions
      const { cleanText, suggestions } = parseSuggestions(streamed);
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.role === 'assistant') {
          copy[copy.length - 1] = {
            ...last,
            content: cleanText || streamed,
            suggestions: suggestions.length > 0 ? suggestions : QUICK_PROMPTS[activeChar.name] || [],
          };
        }
        return copy;
      });
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last) {
          copy[copy.length - 1] = {
            ...last,
            content: "my brain lagged for a second 💀 hit me with that again?",
          };
        }
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const noiseSvg =
    "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E";

  return (
    <div
      style={{
        backgroundColor: activeChar.bg,
        transition: 'background-color 650ms cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: "'Inter', sans-serif",
      }}
      className="relative w-full overflow-hidden select-none"
    >
      {/* Dynamic Keyframe Animations for Figurine Dance & Music Effects */}
      <style>{`
        @keyframes toonhubDance {
          0% {
            transform: translateY(0px) rotate(0deg) scale(1.04);
          }
          15% {
            transform: translateY(-22px) rotate(-4deg) scale(1.08);
          }
          30% {
            transform: translateY(2px) rotate(2.5deg) scale(1.02);
          }
          45% {
            transform: translateY(-32px) rotate(4.5deg) scale(1.1);
          }
          60% {
            transform: translateY(-6px) rotate(-3deg) scale(1.04);
          }
          75% {
            transform: translateY(-20px) rotate(-3.5deg) scale(1.08);
          }
          88% {
            transform: translateY(-2px) rotate(2deg) scale(1.03);
          }
          100% {
            transform: translateY(0px) rotate(0deg) scale(1.04);
          }
        }

        @keyframes toonhubShadow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.35;
          }
          45% {
            transform: scale(0.65);
            opacity: 0.15;
          }
          75% {
            transform: scale(0.85);
            opacity: 0.25;
          }
        }

        @keyframes floatMusicNote {
          0% {
            transform: translateY(0) scale(0.5) rotate(0deg);
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
          100% {
            transform: translateY(-90px) scale(1.1) rotate(20deg);
            opacity: 0;
          }
        }

        .animate-toonhub-dance {
          animation: toonhubDance 2.2s ease-in-out infinite;
          transform-origin: bottom center;
        }

        .animate-toonhub-shadow {
          animation: toonhubShadow 2.2s ease-in-out infinite;
        }

        .note-float-1 {
          animation: floatMusicNote 2.4s ease-out infinite;
        }
        .note-float-2 {
          animation: floatMusicNote 2.8s ease-out infinite 0.6s;
        }
        .note-float-3 {
          animation: floatMusicNote 2.1s ease-out infinite 1.2s;
        }
      `}</style>

      <div className="relative w-full overflow-hidden" style={{ height: '100vh' }}>
        {/* Top Header Bar */}
        <div className="absolute top-6 inset-x-0 px-4 sm:px-8 z-[70] flex items-center justify-between pointer-events-auto">
          {/* Top-Left: Back link & TOONHUB brand label */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-3 py-1.5 rounded-full bg-black/25 hover:bg-black/45 border border-white/20 text-white text-xs font-medium tracking-wider backdrop-blur-md transition-all flex items-center gap-1 shadow-lg"
            >
              <ChevronLeft size={14} /> Back
            </Link>
            <span className="text-xs font-bold uppercase text-white tracking-[0.2em] opacity-95">
              TOONHUB
            </span>
          </div>

          {/* Top-Right: Toggle Chat Pill */}
          <div className="flex items-center gap-2">
            {!isChatOpen ? (
              <button
                onClick={handleOpenChat}
                className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold tracking-wider hover:bg-white/90 hover:scale-105 transition-all flex items-center gap-1.5 shadow-xl cursor-pointer"
              >
                <Sparkles size={13} className="text-amber-500 fill-amber-500" /> Chat with {activeChar.name}
              </button>
            ) : (
              <button
                onClick={handleCloseChat}
                className="px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 text-white text-xs font-medium tracking-wider backdrop-blur-md transition-all flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <X size={14} /> Close Chat
              </button>
            )}
          </div>
        </div>

        {/* 1. Grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 50,
            opacity: 0.4,
            backgroundImage: "url('" + noiseSvg + "')",
            backgroundSize: '200px 200px',
          }}
        />

        {/* 2. Giant ghost text "COMPANION" */}
        <div
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none z-10 transition-opacity duration-500"
          style={{
            top: '16%',
            fontFamily: "'Anton', sans-serif",
            fontSize: 'clamp(70px, 21vw, 310px)',
            fontWeight: 900,
            color: '#FFFFFF',
            opacity: isChatOpen ? 0.16 : 1,
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          COMPANION
        </div>

        {/* ============================================================= */}
        {/* VIEW A: CHAT MODE ACTIVE (Split: Left Chat Panel + Right Dancing Figurine) */}
        {/* ============================================================= */}
        {isChatOpen && (
          <div className="absolute inset-0 z-40 flex flex-col md:flex-row items-stretch justify-between pt-20 pb-4 px-4 sm:px-8 pointer-events-auto">
            {/* LEFT SIDE: EMBEDDED REAL-TIME CHAT PANEL */}
            <div className="w-full md:w-[48%] lg:w-[44%] h-full flex flex-col rounded-3xl bg-black/50 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden relative z-50">
              {/* Panel Top Bar */}
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/40 shadow-inner bg-black/40 shrink-0">
                    <img src={activeChar.src} alt={activeChar.name} className="w-full h-full object-cover object-top" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm tracking-wide text-white">{activeChar.name}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-[11px] text-white/70 tracking-wide line-clamp-1">{activeChar.personality}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const defaultGreeting = GREETINGS[activeChar.name] || GREETINGS.Ember;
                      setMessages([
                        {
                          id: 'welcome-' + activeChar.name,
                          role: 'assistant',
                          content: defaultGreeting,
                          suggestions: QUICK_PROMPTS[activeChar.name] || [],
                        },
                      ]);
                    }}
                    title="Reset chat"
                    className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={handleCloseChat}
                    className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Chat Message Scroll Area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 scrollbar-thin scrollbar-thumb-white/20">
                {messages.map((m) => (
                  <div key={m.id} className="space-y-2">
                    <div className={'flex flex-col ' + (m.role === 'user' ? 'items-end' : 'items-start')}>
                      <div
                        className={
                          'max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-md ' +
                          (m.role === 'user'
                            ? 'bg-white text-black font-medium rounded-br-xs'
                            : 'bg-white/15 text-white backdrop-blur-md border border-white/15 rounded-bl-xs')
                        }
                      >
                        {m.content}
                      </div>
                    </div>

                    {/* Suggestions Pill Chips */}
                    {m.role === 'assistant' && m.suggestions && m.suggestions.length > 0 && !isStreaming && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {m.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendMessage(sug)}
                            className="text-[11px] px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/25 border border-white/15 text-white/90 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 text-left"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isStreaming && (
                  <div className="flex items-center gap-1.5 text-white/70 text-xs px-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.3s]" />
                    <span className="ml-1 text-[11px] font-medium tracking-wide">{activeChar.name} is typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-white/10 bg-white/[0.04]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2 rounded-full bg-black/40 border border-white/20 px-3.5 py-1.5 focus-within:border-white/50 transition-all shadow-inner"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={'Talk with ' + activeChar.name + '...'}
                    disabled={isStreaming}
                    className="flex-1 bg-transparent text-white placeholder-white/50 text-xs sm:text-sm focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isStreaming}
                    className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0 disabled:opacity-40 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    <Send size={14} className="ml-0.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT SIDE: ANIMATED DANCING FIGURINE STAGE */}
            <div className="hidden md:flex flex-1 h-full items-end justify-center relative overflow-visible pointer-events-none">
              {/* Floating Music Emojis & Sparkles around the dancing character */}
              <div className="absolute top-[20%] right-[32%] text-2xl note-float-1 pointer-events-none">🎵</div>
              <div className="absolute top-[28%] left-[28%] text-2xl note-float-2 pointer-events-none">🎶</div>
              <div className="absolute top-[18%] right-[15%] text-xl note-float-3 pointer-events-none">✨</div>
              <div className="absolute top-[40%] right-[20%] text-lg note-float-1 pointer-events-none">🎧</div>

              {/* Dancing Status Badge */}
              <div className="absolute top-[14%] right-[22%] z-30 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold tracking-wider flex items-center gap-1.5 shadow-xl">
                <Music size={13} className="text-white animate-spin [animation-duration:3s]" />
                <span>{activeChar.name} is dancing!</span>
              </div>

              {/* Ambient Spotlight Glow behind the dancing character */}
              <div
                className="absolute w-[440px] h-[440px] rounded-full blur-[80px] pointer-events-none"
                style={{
                  backgroundColor: activeChar.panel,
                  opacity: 0.6,
                  bottom: '8%',
                }}
              />

              {/* The Dancing 3D Figurine Image */}
              <div
                className="relative z-30 animate-toonhub-dance"
                style={{
                  height: '84%',
                  aspectRatio: '0.75 / 1',
                  marginBottom: '2%',
                }}
              >
                <img
                  src={activeChar.src}
                  alt={activeChar.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'bottom center',
                  }}
                  draggable={false}
                  className="drop-shadow-[0_25px_45px_rgba(0,0,0,0.45)]"
                />
              </div>

              {/* Rhythmic Pulsing Ground Shadow */}
              <div
                className="absolute w-[260px] h-[34px] rounded-full bg-black/40 blur-[10px] animate-toonhub-shadow"
                style={{ bottom: '2%' }}
              />
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW B: STANDARD FULL CAROUSEL (When Chat is Closed) */}
        {/* ============================================================= */}
        {!isChatOpen && (
          <>
            {/* 4. Carousel (Layered IN FRONT of "COMPANION": z-20) */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              {IMAGES.map((img, index) => {
                const role = getRole(index);
                let roleStyle: React.CSSProperties = {};

                if (role === 'center') {
                  roleStyle = {
                    transform: 'translateX(-50%) scale(' + (isMobile ? 1.08 : 1.1) + ')',
                    transformOrigin: 'bottom center',
                    filter: 'none',
                    opacity: 1,
                    zIndex: 35,
                    left: '50%',
                    height: isMobile ? '64%' : '84%',
                    bottom: isMobile ? '16%' : '1%',
                  };
                } else if (role === 'left') {
                  roleStyle = {
                    transform: 'translateX(-50%) scale(1)',
                    transformOrigin: 'bottom center',
                    filter: 'blur(2px)',
                    opacity: 0.85,
                    zIndex: 15,
                    left: isMobile ? '18%' : '26%',
                    height: isMobile ? '18%' : '32%',
                    bottom: isMobile ? '24%' : '12%',
                  };
                } else if (role === 'right') {
                  roleStyle = {
                    transform: 'translateX(-50%) scale(1)',
                    transformOrigin: 'bottom center',
                    filter: 'blur(2px)',
                    opacity: 0.85,
                    zIndex: 15,
                    left: isMobile ? '82%' : '74%',
                    height: isMobile ? '18%' : '32%',
                    bottom: isMobile ? '24%' : '12%',
                  };
                } else {
                  // back
                  roleStyle = {
                    transform: 'translateX(-50%) scale(1)',
                    transformOrigin: 'bottom center',
                    filter: 'blur(4px)',
                    opacity: 0.9,
                    zIndex: 5,
                    left: '50%',
                    height: isMobile ? '14%' : '24%',
                    bottom: isMobile ? '26%' : '15%',
                  };
                }

                return (
                  <div
                    key={img.src}
                    className="pointer-events-auto"
                    style={{
                      position: 'absolute',
                      aspectRatio: '0.75 / 1',
                      transition:
                        'transform 650ms cubic-bezier(0.4, 0, 0.2, 1), filter 650ms cubic-bezier(0.4, 0, 0.2, 1), opacity 650ms cubic-bezier(0.4, 0, 0.2, 1), left 650ms cubic-bezier(0.4, 0, 0.2, 1), height 650ms cubic-bezier(0.4, 0, 0.2, 1)',
                      willChange: 'transform, filter, opacity, left',
                      ...roleStyle,
                    }}
                  >
                    <img
                      src={img.src}
                      alt={"Figurine " + (index + 1)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'bottom center',
                      }}
                      draggable={false}
                      className="drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)]"
                    />
                  </div>
                );
              })}
            </div>

            {/* 5. Bottom-left text + nav buttons */}
            <div className="absolute bottom-6 left-4 sm:bottom-16 sm:left-20 z-[60] max-w-[340px] pointer-events-auto">
              <p
                className="font-bold uppercase tracking-widest mb-1.5 sm:mb-2 text-base sm:text-[22px] text-white opacity-95"
                style={{ letterSpacing: '0.02em' }}
              >
                TOONHUB FIGURINES
              </p>
              <p className="hidden sm:block text-xs sm:text-sm text-white/85 leading-relaxed mb-4">
                The artwork is stunning, shipped fully prepared. The finish is a vision, the 3D craft is
                flawless. Many thanks! Wishing you the win. Order now.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('prev')}
                  aria-label="Previous figurine"
                  className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-transparent border-2 border-white text-white cursor-pointer hover:scale-[1.08] hover:bg-white/[0.12] transition-all duration-150 active:scale-95 shadow-md"
                >
                  <ArrowLeft size={26} strokeWidth={2.25} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('next')}
                  aria-label="Next figurine"
                  className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-transparent border-2 border-white text-white cursor-pointer hover:scale-[1.08] hover:bg-white/[0.12] transition-all duration-150 active:scale-95 shadow-md"
                >
                  <ArrowRight size={26} strokeWidth={2.25} />
                </button>
                <button
                  type="button"
                  onClick={handleOpenChat}
                  className="ml-1 px-4 py-3 sm:px-5 sm:py-4 rounded-full bg-white text-black font-semibold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-white/90 hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
                >
                  <MessageCircle size={15} />
                  <span>Chat Now</span>
                </button>
              </div>
            </div>

            {/* 6. Bottom-right link "DISCOVER IT" */}
            <a
              onClick={handleOpenChat}
              className="absolute bottom-6 right-4 sm:bottom-16 sm:right-10 z-[60] flex items-center gap-2 text-white uppercase no-underline cursor-pointer group transition-opacity duration-200 hover:opacity-100 pointer-events-auto"
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 'clamp(20px, 4vw, 56px)',
                fontWeight: 400,
                color: '#FFFFFF',
                opacity: 0.95,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              <span>DISCOVER IT</span>
              <ArrowRight
                className="w-5 h-5 sm:w-8 sm:h-8 transition-transform group-hover:translate-x-1.5"
                strokeWidth={2.25}
              />
            </a>
          </>
        )}
      </div>
    </div>
  );
}
