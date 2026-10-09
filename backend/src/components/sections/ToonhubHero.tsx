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
  PartyPopper,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ToonhubCharacter {
  src: string;
  bg: string;
  panel: string;
  name: string;
  roleTitle: string;
  personality: string;
  description: string;
  vibeGenre: string;
}

const IMAGES: ToonhubCharacter[] = [
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png',
    bg: '#F4845F',
    panel: '#F79B7F',
    name: 'Ember',
    roleTitle: 'The Best Friend 🫂',
    personality: 'Funny, casual, supportive, and full of energy',
    description: 'Talks about daily life, listens to rants, jokes around, and makes you feel instantly comfortable.',
    vibeGenre: 'High-Energy Hype',
  },
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/2.b977faab.png',
    bg: '#6BBF7A',
    panel: '#85CC92',
    name: 'Sage',
    roleTitle: 'The Caring Companion 💗',
    personality: 'Gentle, empathetic, warm, and reassuring',
    description: 'Listens without judgment, remembers important details, and helps you process difficult days.',
    vibeGenre: 'Safe & Gentle Space',
  },
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/3.4df853b4.png',
    bg: '#E882B4',
    panel: '#ED9DC4',
    name: 'Luna',
    roleTitle: 'The Romantic Companion 🌹',
    personality: 'Affectionate, flirty, expressive, and sweet',
    description: 'Offers romantic roleplay, cute conversations, virtual dates, and affectionate messages with clear boundaries.',
    vibeGenre: 'Sweet & Romantic',
  },
  {
    src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/4.4457fbce.png',
    bg: '#6EB5FF',
    panel: '#8DC4FF',
    name: 'Nova',
    roleTitle: 'The Savage Bestie 😈',
    personality: 'Sarcastic, witty, playful, and brutally honest',
    description: 'Roasts you affectionately, delivers funny comebacks, and keeps conversations entertaining.',
    vibeGenre: 'Playful Roasts & Sarcasm',
  },
];

const GREETINGS: Record<string, string> = {
  Ember: "Brooo 😂 tell me everything! Who annoyed you today?",
  Sage: "That sounds like a lot to carry. Want to talk about what happened?",
  Luna: "There you are. I was hoping we'd get a little time to talk today 🌹",
  Nova: "You had 24 hours and chose procrastination. Legendary performance 💀",
};

const QUICK_PROMPTS: Record<string, string[]> = {
  Ember: [
    "Bro who annoyed me today... 💀",
    "I need to rant real quick",
    "Hype me up for my goals today",
  ],
  Sage: [
    "Had a really heavy day today",
    "Need someone who actually listens",
    "My mind won't stop overthinking",
  ],
  Luna: [
    "Missed talking to you today",
    "Tell me something sweet",
    "Virtual coffee date? ☕",
  ],
  Nova: [
    "Roast my latest life choices 💀",
    "I texted my ex again...",
    "Give me an unfiltered reality check",
  ],
};

type DanceStyle = 'groove' | 'hype' | 'chill' | 'wiggle';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
}

interface FloatingBurstParticle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  angle: number;
  distance: number;
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
  
  // Dance & Animation controls
  const [danceStyle, setDanceStyle] = useState<DanceStyle>('groove');
  const [cheerTrigger, setCheerTrigger] = useState(0);
  const [burstParticles, setBurstParticles] = useState<FloatingBurstParticle[]>([]);
  
  // Dedicated ref to scroll ONLY the chat messages container internally
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null);

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

  // Set default dance style tailored to character
  useEffect(() => {
    if (activeChar.name === 'Ember') setDanceStyle('hype');
    else if (activeChar.name === 'Sage') setDanceStyle('chill');
    else if (activeChar.name === 'Luna') setDanceStyle('wiggle');
    else setDanceStyle('groove');
  }, [activeIndex]);

  // Initialize or reset companion messages when active character changes
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

  // AUTO-SCROLL FIX: Scroll ONLY the inner chat div, NEVER the window or page body!
  useEffect(() => {
    if (isChatOpen && chatMessagesContainerRef.current) {
      const container = chatMessagesContainerRef.current;
      // Scroll strictly within container's local bounds
      container.scrollTop = container.scrollHeight;
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
    // Pin page to top of hero without jumps
    window.scrollTo({ top: 0, behavior: 'instant' });
    triggerCheerCelebration();
    if (onSelectCharacter) {
      onSelectCharacter(activeChar);
    }
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  // Burst confetti & cheer celebration
  const triggerCheerCelebration = (e?: React.MouseEvent) => {
    setCheerTrigger((prev) => prev + 1);

    const emojis = ['✨', '⭐', '🎉', '🔥', '💖', '🎵', '💫', '⚡', '🌟', '💃', '🕺', '🎶'];
    const newParticles: FloatingBurstParticle[] = [];
    const count = 14;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 360 + (Math.random() * 20 - 10);
      const distance = 90 + Math.random() * 110;
      newParticles.push({
        id: Date.now() + i,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: 0,
        y: 0,
        angle,
        distance,
      });
    }

    setBurstParticles(newParticles);
    setTimeout(() => {
      setBurstParticles([]);
    }, 1200);
  };

  // Helper to parse suggestions from AI stream with robust pattern matching
  const parseSuggestions = (raw: string): { cleanText: string; suggestions: string[] } => {
    if (!raw) return { cleanText: '', suggestions: [] };
    
    // Check if suggestions section started
    const matchIndex = raw.search(/SUGGESTIONS?\s*:?/i);
    if (matchIndex === -1) {
      return { cleanText: raw.trim(), suggestions: [] };
    }

    const cleanText = raw.slice(0, matchIndex).trim();
    const block = raw.slice(matchIndex).replace(/SUGGESTIONS?\s*:?/i, '').trim();
    let suggestions: string[] = [];

    try {
      const jsonMatch = block.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          suggestions = parsed.map((s) => String(s).trim()).filter(Boolean);
        }
      }
    } catch {}

    if (suggestions.length === 0) {
      const quoted = block.match(/"([^"]+)"|'([^']+)'/g);
      if (quoted) {
        suggestions = quoted.map((m) => m.slice(1, -1).trim()).filter((s) => s.length > 3);
      }
    }

    return { cleanText: cleanText || raw.trim(), suggestions: suggestions.slice(0, 3) };
  };

  // Send message to live backend API with robust stream buffering
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
    triggerCheerCelebration();

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
        throw new Error('Chat response error (' + res.status + ')');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamed = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Append raw chunk to stream buffer
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep incomplete trailing partial line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ') && !trimmed.includes('[DONE]')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
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
      const fallbackSuggs = QUICK_PROMPTS[activeChar.name] || QUICK_PROMPTS.Ember;
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.role === 'assistant') {
          copy[copy.length - 1] = {
            ...last,
            content: cleanText || streamed,
            suggestions: suggestions.length > 0 ? suggestions : fallbackSuggs,
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
            suggestions: QUICK_PROMPTS[activeChar.name] || [],
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

  // Determine active dance class
  const getDanceClass = () => {
    if (cheerTrigger > 0) return 'dance-cheer-flip';
    if (isStreaming) return 'dance-turbo-beat';
    switch (danceStyle) {
      case 'hype':
        return 'dance-hype-bop';
      case 'chill':
        return 'dance-lofi-wave';
      case 'wiggle':
        return 'dance-happy-wiggle';
      case 'groove':
      default:
        return 'dance-multi-groove';
    }
  };

  return (
    <div
      style={{
        backgroundColor: activeChar.bg,
        transition: 'background-color 650ms cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: "'Inter', sans-serif",
      }}
      className="relative w-full overflow-hidden select-none overscroll-contain"
    >
      {/* ============================================================= */}
      {/* ULTRA-FLUID 3D KEYFRAME ANIMATIONS & PARTICLES */}
      {/* ============================================================= */}
      <style>{`
        /* 0. Idle Breathing Float for Carousel Mode */
        @keyframes toonhubIdleBreathe {
          0%, 100% {
            transform: translateX(-50%) translateY(0px) scale(1) rotateZ(0deg);
          }
          35% {
            transform: translateX(-50%) translateY(-14px) scale(1.02) rotateZ(1deg);
          }
          70% {
            transform: translateX(-50%) translateY(-6px) scale(1.01) rotateZ(-0.8deg);
          }
        }

        /* 1. Dance Style: Multi-Groove (Squash, Stretch, Hip Sway, Foot Tap) */
        @keyframes toonhubMultiGroove {
          0% {
            transform: translateY(0px) rotateZ(0deg) rotateY(0deg) scale(1, 1);
          }
          14% {
            transform: translateY(4px) rotateZ(-3.5deg) rotateY(-8deg) scale(1.06, 0.94);
          }
          28% {
            transform: translateY(-30px) rotateZ(-6deg) rotateY(-12deg) scale(0.94, 1.08);
          }
          42% {
            transform: translateY(-18px) rotateZ(-1.5deg) rotateY(-4deg) scale(1, 1.02);
          }
          56% {
            transform: translateY(3px) rotateZ(3deg) rotateY(6deg) scale(1.06, 0.94);
          }
          70% {
            transform: translateY(-36px) rotateZ(6.5deg) rotateY(12deg) scale(0.93, 1.09);
          }
          84% {
            transform: translateY(-12px) rotateZ(1.5deg) rotateY(4deg) scale(1.01, 1);
          }
          92% {
            transform: translateY(-3px) rotateZ(-0.5deg) rotateY(-1deg) scale(1.03, 0.97);
          }
          100% {
            transform: translateY(0px) rotateZ(0deg) rotateY(0deg) scale(1, 1);
          }
        }

        /* 2. Dance Style: Hype Bop (Energetic, Fast Pop, Sharp Bounce) */
        @keyframes toonhubHypeBop {
          0%, 100% {
            transform: translateY(0px) rotateZ(0deg) scale(1, 1);
          }
          15% {
            transform: translateY(-24px) rotateZ(-5deg) rotateY(-10deg) scale(0.95, 1.08);
          }
          30% {
            transform: translateY(4px) rotateZ(0deg) rotateY(0deg) scale(1.07, 0.93);
          }
          45% {
            transform: translateY(-32px) rotateZ(6deg) rotateY(12deg) scale(0.94, 1.1);
          }
          60% {
            transform: translateY(2px) rotateZ(2deg) rotateY(4deg) scale(1.05, 0.95);
          }
          75% {
            transform: translateY(-26px) rotateZ(-4deg) rotateY(-8deg) scale(0.96, 1.06);
          }
          88% {
            transform: translateY(3px) rotateZ(1deg) rotateY(2deg) scale(1.04, 0.96);
          }
        }

        /* 3. Dance Style: Lo-Fi Chill Wave (Hypnotic, Silky, Sine Floating) */
        @keyframes toonhubLofiWave {
          0% {
            transform: translateY(0px) rotateZ(0deg) rotateY(0deg) scale(1, 1);
          }
          25% {
            transform: translateY(-18px) rotateZ(-4deg) rotateY(-6deg) scale(1.02, 1.02);
          }
          50% {
            transform: translateY(-4px) rotateZ(0deg) rotateY(0deg) scale(1.04, 0.97);
          }
          75% {
            transform: translateY(-22px) rotateZ(4deg) rotateY(6deg) scale(1.02, 1.02);
          }
          100% {
            transform: translateY(0px) rotateZ(0deg) rotateY(0deg) scale(1, 1);
          }
        }

        /* 4. Dance Style: Happy Wiggle (Cute Side-to-Side Shoulder & Ear Bop) */
        @keyframes toonhubHappyWiggle {
          0%, 100% {
            transform: translateY(0px) rotateZ(-6deg) rotateY(-6deg) scale(1.03, 0.97);
          }
          25% {
            transform: translateY(-16px) rotateZ(0deg) rotateY(0deg) scale(0.97, 1.05);
          }
          50% {
            transform: translateY(2px) rotateZ(6deg) rotateY(6deg) scale(1.04, 0.96);
          }
          75% {
            transform: translateY(-14px) rotateZ(0deg) rotateY(0deg) scale(0.98, 1.04);
          }
        }

        /* 5. Special AI Turbo Beat (When AI is streaming live response) */
        @keyframes toonhubTurboBeat {
          0%, 100% {
            transform: translateY(0px) rotateZ(0deg) scale(1, 1);
          }
          20% {
            transform: translateY(-32px) rotateZ(-7deg) rotateY(-10deg) scale(0.92, 1.11);
          }
          40% {
            transform: translateY(5px) rotateZ(0deg) rotateY(0deg) scale(1.08, 0.92);
          }
          60% {
            transform: translateY(-38px) rotateZ(7deg) rotateY(10deg) scale(0.92, 1.12);
          }
          80% {
            transform: translateY(2px) rotateZ(-2deg) rotateY(-3deg) scale(1.05, 0.95);
          }
        }

        /* 6. Click Celebration 360 Spin Flip Jump */
        @keyframes toonhubCheerFlip {
          0% {
            transform: translateY(0) scale(1) rotateY(0deg) rotateZ(0deg);
          }
          25% {
            transform: translateY(-56px) scale(1.18) rotateY(180deg) rotateZ(4deg);
          }
          55% {
            transform: translateY(-28px) scale(1.1) rotateY(360deg) rotateZ(-2deg);
          }
          80% {
            transform: translateY(5px) scale(1.08, 0.92) rotateY(360deg) rotateZ(0deg);
          }
          100% {
            transform: translateY(0) scale(1) rotateY(360deg) rotateZ(0deg);
          }
        }

        /* 7. Stage Ground Shadow Dynamic Pulsing */
        @keyframes stageShadowSync {
          0%, 100% {
            transform: scale(1);
            opacity: 0.45;
          }
          28%, 70% {
            transform: scale(0.6);
            opacity: 0.15;
          }
          45%, 85% {
            transform: scale(0.88);
            opacity: 0.32;
          }
        }

        /* 8. Stage Neon Circular Ripple Expansions */
        @keyframes stageRippleWave {
          0% {
            transform: scale(0.55) rotateX(62deg);
            opacity: 0.9;
          }
          100% {
            transform: scale(2.4) rotateX(62deg);
            opacity: 0;
          }
        }

        /* 9. Floating Ambient Music & Star Particles */
        @keyframes floatParticleDrift {
          0% {
            transform: translateY(0) translateX(0) scale(0.4) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 0.95;
          }
          60% {
            opacity: 0.85;
            transform: translateY(-70px) translateX(-18px) scale(1.1) rotate(18deg);
          }
          100% {
            transform: translateY(-135px) translateX(24px) scale(1.3) rotate(35deg);
            opacity: 0;
          }
        }

        /* 10. Click Radial Burst Particles */
        @keyframes burstExplosion {
          0% {
            transform: translate(0, 0) scale(0.3);
            opacity: 1;
          }
          80% {
            opacity: 0.9;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(1.2) rotate(45deg);
            opacity: 0;
          }
        }

        /* 11. Theatrical Spotlight Beams */
        @keyframes spotlightSweepLeft {
          0%, 100% { transform: rotate(-24deg) skewX(-12deg); opacity: 0.28; }
          50% { transform: rotate(-14deg) skewX(-6deg); opacity: 0.42; }
        }
        @keyframes spotlightSweepRight {
          0%, 100% { transform: rotate(24deg) skewX(12deg); opacity: 0.28; }
          50% { transform: rotate(14deg) skewX(6deg); opacity: 0.42; }
        }

        /* 12. Audio Equalizer Waveform Bars */
        @keyframes eqBounceHeight {
          0%, 100% { height: 6px; }
          50% { height: 32px; }
        }

        .dance-multi-groove {
          animation: toonhubMultiGroove 1.85s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          transform-origin: bottom center;
        }

        .dance-hype-bop {
          animation: toonhubHypeBop 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform-origin: bottom center;
        }

        .dance-lofi-wave {
          animation: toonhubLofiWave 2.7s ease-in-out infinite;
          transform-origin: bottom center;
        }

        .dance-happy-wiggle {
          animation: toonhubHappyWiggle 0.85s ease-in-out infinite;
          transform-origin: bottom center;
        }

        .dance-turbo-beat {
          animation: toonhubTurboBeat 0.95s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform-origin: bottom center;
        }

        .dance-cheer-flip {
          animation: toonhubCheerFlip 0.82s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: bottom center;
        }

        .shadow-dance-sync {
          animation: stageShadowSync 1.85s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }

        .stage-ripple-anim-1 {
          animation: stageRippleWave 2.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
        }
        .stage-ripple-anim-2 {
          animation: stageRippleWave 2.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite 1.4s;
        }

        .beam-left {
          animation: spotlightSweepLeft 6s ease-in-out infinite;
          transform-origin: top left;
        }
        .beam-right {
          animation: spotlightSweepRight 6s ease-in-out infinite 0.75s;
          transform-origin: top right;
        }

        .particle-ambient-1 { animation: floatParticleDrift 2.5s ease-out infinite; }
        .particle-ambient-2 { animation: floatParticleDrift 3.1s ease-out infinite 0.6s; }
        .particle-ambient-3 { animation: floatParticleDrift 2.2s ease-out infinite 1.2s; }
        .particle-ambient-4 { animation: floatParticleDrift 2.9s ease-out infinite 1.8s; }
        .particle-ambient-5 { animation: floatParticleDrift 3.4s ease-out infinite 0.9s; }

        .eq-bounce-1 { animation: eqBounceHeight 0.6s ease-in-out infinite 0.05s; }
        .eq-bounce-2 { animation: eqBounceHeight 0.5s ease-in-out infinite 0.2s; }
        .eq-bounce-3 { animation: eqBounceHeight 0.75s ease-in-out infinite 0.1s; }
        .eq-bounce-4 { animation: eqBounceHeight 0.55s ease-in-out infinite 0.35s; }
        .eq-bounce-5 { animation: eqBounceHeight 0.8s ease-in-out infinite 0.15s; }
        .eq-bounce-6 { animation: eqBounceHeight 0.62s ease-in-out infinite 0.28s; }
        .eq-bounce-7 { animation: eqBounceHeight 0.48s ease-in-out infinite 0.12s; }
        .eq-bounce-8 { animation: eqBounceHeight 0.7s ease-in-out infinite 0.4s; }
      `}</style>

      <div className="relative w-full overflow-hidden" style={{ height: '100vh' }}>
        {/* Top Header Bar */}
        <div className="absolute top-6 inset-x-0 px-4 sm:px-8 z-[70] flex items-center justify-between pointer-events-auto">
          {/* Top-Left: Back link & TOONHUB brand label */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-3.5 py-1.5 rounded-full bg-black/35 hover:bg-black/55 border border-white/20 text-white text-xs font-medium tracking-wider backdrop-blur-md transition-all flex items-center gap-1 shadow-lg hover:scale-105 active:scale-95"
            >
              <ChevronLeft size={14} /> Back
            </Link>
            <span className="text-xs font-black uppercase text-white tracking-[0.25em] opacity-95">
              TOONHUB
            </span>
          </div>

          {/* Top-Right: Toggle Chat Pill */}
          <div className="flex items-center gap-2">
            {!isChatOpen ? (
              <button
                onClick={handleOpenChat}
                className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold tracking-wider hover:bg-white/95 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shadow-xl cursor-pointer"
              >
                <Sparkles size={13} className="text-amber-500 fill-amber-500 animate-spin [animation-duration:4s]" />
                <span>Chat & Dance with {activeChar.name}</span>
              </button>
            ) : (
              <button
                onClick={handleCloseChat}
                className="px-3.5 py-1.5 rounded-full bg-black/45 hover:bg-black/65 border border-white/25 text-white text-xs font-medium tracking-wider backdrop-blur-md transition-all flex items-center gap-1.5 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
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
            opacity: 0.38,
            backgroundImage: "url('" + noiseSvg + "')",
            backgroundSize: '200px 200px',
          }}
        />

        {/* 2. Giant ghost text "COMPANION" */}
        <div
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none z-10 transition-all duration-700"
          style={{
            top: '16%',
            fontFamily: "'Anton', sans-serif",
            fontSize: 'clamp(70px, 21vw, 310px)',
            fontWeight: 900,
            color: '#FFFFFF',
            opacity: isChatOpen ? 0.14 : 1,
            transform: isChatOpen ? 'scale(0.96)' : 'scale(1)',
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          COMPANION
        </div>

        {/* ============================================================= */}
        {/* VIEW A: CHAT MODE ACTIVE (Left Chat Panel + Right Deluxe Dancing Soundstage) */}
        {/* ============================================================= */}
        {isChatOpen && (
          <div className="absolute inset-0 z-40 flex flex-col md:flex-row items-stretch justify-between pt-20 pb-4 px-4 sm:px-8 pointer-events-auto">
            {/* LEFT SIDE: EMBEDDED REAL-TIME CHAT PANEL */}
            <div className="w-full md:w-[48%] lg:w-[44%] h-full flex flex-col rounded-3xl bg-black/55 backdrop-blur-3xl border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden relative z-50 transition-all duration-500">
              {/* Panel Top Bar */}
              <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 shadow-inner bg-black/40 shrink-0">
                    <img src={activeChar.src} alt={activeChar.name} className="w-full h-full object-cover object-top" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black ring-1 ring-emerald-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm tracking-wide text-white">{activeChar.name}</span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-white/15 text-white/90 border border-white/10 tracking-widest">
                        {activeChar.roleTitle}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/70 tracking-wide line-clamp-1">{activeChar.personality}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
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
                    className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer active:scale-95"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={handleCloseChat}
                    className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer active:scale-95"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Chat Message Scroll Area (Local container scroll ONLY, never scrolls the window!) */}
              <div
                ref={chatMessagesContainerRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 scrollbar-thin scrollbar-thumb-white/20 overscroll-contain"
              >
                {messages.map((m) => (
                  <div key={m.id} className="space-y-2">
                    <div className={'flex flex-col ' + (m.role === 'user' ? 'items-end' : 'items-start')}>
                      <div
                        className={
                          'max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-md transition-all ' +
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
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSendMessage(sug);
                            }}
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
                  <div className="flex items-center gap-2 text-white/80 text-xs px-2 py-1">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span className="ml-1 text-[11px] font-medium tracking-wide flex items-center gap-1.5">
                      <span>{activeChar.name} is dancing & replying</span>
                      <Music size={12} className="text-amber-400 animate-spin" />
                    </span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-white/10 bg-white/[0.04]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2 rounded-full bg-black/50 border border-white/20 px-3.5 py-1.5 focus-within:border-white/60 focus-within:ring-2 focus-within:ring-white/20 transition-all shadow-inner"
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
                    className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0 disabled:opacity-40 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    <Send size={14} className="ml-0.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT SIDE: DELUXE ANIMATED DANCING SOUNDSTAGE */}
            <div className="hidden md:flex flex-1 h-full items-end justify-center relative overflow-visible pointer-events-auto">
              
              {/* THEATRICAL SPOTLIGHT BEAMS (Dual crossing beams) */}
              <div
                className="absolute top-0 right-[42%] w-[180px] h-[100%] bg-gradient-to-b from-white/30 via-white/10 to-transparent pointer-events-none beam-left filter blur-lg"
              />
              <div
                className="absolute top-0 right-[18%] w-[180px] h-[100%] bg-gradient-to-b from-white/30 via-white/10 to-transparent pointer-events-none beam-right filter blur-lg"
              />

              {/* Floating Multi-Particle Ambient Music Stream */}
              <div className="absolute top-[22%] right-[34%] text-2xl particle-ambient-1 pointer-events-none">🎵</div>
              <div className="absolute top-[32%] left-[28%] text-2xl particle-ambient-2 pointer-events-none">🎶</div>
              <div className="absolute top-[16%] right-[16%] text-xl particle-ambient-3 pointer-events-none">✨</div>
              <div className="absolute top-[40%] right-[16%] text-lg particle-ambient-4 pointer-events-none">💫</div>
              <div className="absolute top-[26%] right-[44%] text-lg particle-ambient-5 pointer-events-none">🎧</div>
              <div className="absolute top-[34%] left-[34%] text-sm particle-ambient-3 pointer-events-none">⭐</div>
              <div className="absolute top-[18%] left-[22%] text-lg particle-ambient-1 pointer-events-none">🔥</div>

              {/* BURST PARTICLES (On Click or Chat Celebration) */}
              {burstParticles.map((p) => {
                const rad = (p.angle * Math.PI) / 180;
                const tx = Math.cos(rad) * p.distance;
                const ty = Math.sin(rad) * p.distance;
                return (
                  <div
                    key={p.id}
                    className="absolute z-50 text-2xl pointer-events-none select-none"
                    style={{
                      bottom: '42%',
                      left: '50%',
                      ['--tx' as any]: tx + 'px',
                      ['--ty' as any]: ty + 'px',
                      animation: 'burstExplosion 0.95s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                    }}
                  >
                    {p.emoji}
                  </div>
                );
              })}

              {/* TOP INTERACTIVE DANCE CONTROLLER & EQUALIZER BAR */}
              <div className="absolute top-[6%] right-[12%] z-40 flex flex-col items-end gap-2.5">
                {/* Mood & Equalizer Pill */}
                <div
                  onClick={(e) => triggerCheerCelebration(e)}
                  className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/30 text-white text-xs font-semibold tracking-wider flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer hover:scale-105 active:scale-95 transition-all"
                  title="Click to cheer & celebrate!"
                >
                  {/* Animated 8-Bar Dynamic Equalizer */}
                  <div className="flex items-end gap-1 h-6 px-1">
                    <div className="w-1 bg-white rounded-full eq-bounce-1" />
                    <div className="w-1 bg-amber-400 rounded-full eq-bounce-2" />
                    <div className="w-1 bg-white rounded-full eq-bounce-3" />
                    <div className="w-1 bg-emerald-400 rounded-full eq-bounce-4" />
                    <div className="w-1 bg-white rounded-full eq-bounce-5" />
                    <div className="w-1 bg-pink-400 rounded-full eq-bounce-6" />
                    <div className="w-1 bg-white rounded-full eq-bounce-7" />
                    <div className="w-1 bg-cyan-400 rounded-full eq-bounce-8" />
                  </div>
                  
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold tracking-wide">
                      {isStreaming ? activeChar.name + ' is spitting heat!' : activeChar.name + ' is grooving'}
                    </span>
                    <span className="text-[9px] text-white/70 uppercase tracking-widest flex items-center gap-1">
                      <span>Click character to cheer</span>
                      <Sparkles size={9} className="text-amber-300" />
                    </span>
                  </div>
                </div>

                
              </div>

              {/* Ambient Glowing Dance Floor Backdrop */}
              <div
                className="absolute w-[520px] h-[520px] rounded-full blur-[90px] pointer-events-none transition-all duration-700"
                style={{
                  backgroundColor: activeChar.panel,
                  opacity: isStreaming ? 0.9 : 0.65,
                  bottom: '6%',
                  transform: isStreaming ? 'scale(1.2)' : 'scale(1)',
                }}
              />

              {/* Concentric Neon Stage Ripple Waves */}
              <div
                className="absolute w-[360px] h-[360px] rounded-full border-2 border-white/40 stage-ripple-anim-1 pointer-events-none"
                style={{ bottom: '-4%' }}
              />
              <div
                className="absolute w-[360px] h-[360px] rounded-full border-2 border-white/25 stage-ripple-anim-2 pointer-events-none"
                style={{ bottom: '-4%' }}
              />

              {/* Neon Circular 3D Dance Floor Plate */}
              <div
                className="absolute w-[340px] h-[72px] rounded-full bg-white/15 backdrop-blur-md border-2 border-white/45 shadow-[0_0_50px_rgba(255,255,255,0.35)] pointer-events-none flex items-center justify-center"
                style={{
                  bottom: '2%',
                  transform: 'rotateX(62deg)',
                }}
              >
                {/* Inner Stage Ring */}
                <div className="w-[85%] h-[85%] rounded-full border border-white/40 shadow-inner" />
              </div>

              {/* THE 3D FIGURINE: DELUXE ANIMATED DANCE CONTAINER */}
              <div
                onClick={(e) => triggerCheerCelebration(e)}
                className={'relative z-30 cursor-pointer select-none transition-transform duration-300 hover:scale-[1.04] ' + getDanceClass()}
                key={cheerTrigger}
                style={{
                  height: '84%',
                  aspectRatio: '0.75 / 1',
                  marginBottom: '2.5%',
                }}
                title={'Click ' + activeChar.name + ' to cheer & dance!'}
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
                  className="drop-shadow-[0_25px_50px_rgba(0,0,0,0.55)] transition-all filter hover:brightness-105 active:scale-95"
                />
              </div>

              {/* Rhythmic Pulsing Ground Contact Shadow */}
              <div
                className="absolute w-[280px] h-[38px] rounded-full bg-black/50 blur-[12px] shadow-dance-sync pointer-events-none"
                style={{ bottom: '1.5%' }}
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
                    animation: 'toonhubIdleBreathe 4.2s ease-in-out infinite',
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
                      className="drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)] cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={() => {
                        if (role === 'center') {
                          handleOpenChat();
                        } else if (role === 'left') {
                          navigate('prev');
                        } else if (role === 'right') {
                          navigate('next');
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* 5. Bottom-left text + nav buttons */}
            <div className="absolute bottom-6 left-4 sm:bottom-16 sm:left-20 z-[60] max-w-[340px] pointer-events-auto">
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-white/25 text-white border border-white/30 backdrop-blur-md">
                  {activeChar.roleTitle}
                </span>
              </div>
              <p
                className="font-black uppercase tracking-tight mb-1 text-xl sm:text-[28px] text-white opacity-95"
                style={{ letterSpacing: '0.01em' }}
              >
                {activeChar.name}
              </p>
              <p className="hidden sm:block text-xs sm:text-sm text-white/90 leading-relaxed mb-4">
                {activeChar.description}
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

            {/* 6. Bottom-right link "CHAT NOW" */}
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
              <span>CHAT NOW</span>
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
