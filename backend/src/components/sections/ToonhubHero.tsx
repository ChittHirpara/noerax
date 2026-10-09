import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

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

export function ToonhubHero({ onSelectCharacter }: { onSelectCharacter?: (char: ToonhubCharacter) => void }) {
  const navigateRouter = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  // Preload all 4 images on mount via new Image()
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

  // 650ms animation lock navigation
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
    return 'back'; // (activeIndex + 2) % 4
  };

  const activeChar = IMAGES[activeIndex];

  const handleDiscover = () => {
    if (onSelectCharacter) {
      onSelectCharacter(activeChar);
    } else {
      // Connect companion personality directly to chat
      navigateRouter('/chat?bot=' + encodeURIComponent(activeChar.name));
    }
  };

  const noiseSvg = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E";

  return (
    <div
      style={{
        backgroundColor: IMAGES[activeIndex].bg,
        transition: 'background-color 650ms cubic-bezier(0.4,0,0.2,1)',
        fontFamily: "'Inter', sans-serif",
      }}
      className="relative w-full overflow-hidden select-none"
    >
      <div className="relative w-full overflow-hidden" style={{ height: '100vh' }}>
        {/* Top-Right Quick Navigation Bar */}
        <div className="absolute top-6 right-4 sm:right-8 z-[70] flex items-center gap-3">
          <Link
            to="/"
            className="px-3.5 py-1.5 rounded-full bg-black/25 hover:bg-black/40 border border-white/20 text-white text-xs font-medium tracking-wider backdrop-blur-md transition-all flex items-center gap-1.5 shadow-lg"
          >
            <ChevronLeft size={14} /> Sanctuary
          </Link>
          <button
            onClick={handleDiscover}
            className="px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-semibold tracking-wider hover:bg-white/90 transition-all flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
            <Sparkles size={13} className="text-amber-500" /> Chat with {activeChar.name}
          </button>
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

        {/* 2. Giant ghost text "3D SHAPE" */}
        <div
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none"
          style={{
            zIndex: 2,
            top: '18%',
            fontFamily: "'Anton', sans-serif",
            fontSize: 'clamp(90px, 28vw, 380px)',
            fontWeight: 900,
            color: '#FFFFFF',
            opacity: 1,
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          3D SHAPE
        </div>

        {/* 3. Top-left brand label "TOONHUB" */}
        <div
          className="absolute top-6 left-4 sm:left-8 text-xs font-semibold uppercase text-white tracking-[0.18em]"
          style={{ zIndex: 60, opacity: 0.9 }}
        >
          TOONHUB
        </div>

        {/* 4. Carousel */}
        <div className="absolute inset-0" style={{ zIndex: 3 }}>
          {IMAGES.map((img, index) => {
            const role = getRole(index);
            let roleStyle: React.CSSProperties = {};

            if (role === 'center') {
              roleStyle = {
                transform: "translateX(-50%) scale(" + (isMobile ? 1.25 : 1.68) + ")",
                filter: 'none',
                opacity: 1,
                zIndex: 20,
                left: '50%',
                height: isMobile ? '60%' : '92%',
                bottom: isMobile ? '22%' : 0,
              };
            } else if (role === 'left') {
              roleStyle = {
                transform: 'translateX(-50%) scale(1)',
                filter: 'blur(2px)',
                opacity: 0.85,
                zIndex: 10,
                left: isMobile ? '20%' : '30%',
                height: isMobile ? '16%' : '28%',
                bottom: isMobile ? '32%' : '12%',
              };
            } else if (role === 'right') {
              roleStyle = {
                transform: 'translateX(-50%) scale(1)',
                filter: 'blur(2px)',
                opacity: 0.85,
                zIndex: 10,
                left: isMobile ? '80%' : '70%',
                height: isMobile ? '16%' : '28%',
                bottom: isMobile ? '32%' : '12%',
              };
            } else {
              // back
              roleStyle = {
                transform: 'translateX(-50%) scale(1)',
                filter: 'blur(4px)',
                opacity: 1,
                zIndex: 5,
                left: '50%',
                height: isMobile ? '13%' : '22%',
                bottom: isMobile ? '32%' : '12%',
              };
            }

            return (
              <div
                key={img.src}
                style={{
                  position: 'absolute',
                  aspectRatio: '0.6 / 1',
                  transition:
                    'transform 650ms cubic-bezier(0.4,0,0.2,1), filter 650ms cubic-bezier(0.4,0,0.2,1), opacity 650ms cubic-bezier(0.4,0,0.2,1), left 650ms cubic-bezier(0.4,0,0.2,1)',
                  willChange: 'transform, filter, opacity',
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
                />
              </div>
            );
          })}
        </div>

        {/* 5. Bottom-left text + nav buttons */}
        <div
          className="absolute bottom-6 left-4 sm:bottom-20 sm:left-24"
          style={{ zIndex: 60, maxWidth: '320px' }}
        >
          <p
            className="font-bold uppercase tracking-widest mb-2 sm:mb-3 text-base sm:text-[22px] text-white opacity-95"
            style={{ letterSpacing: '0.02em' }}
          >
            TOONHUB FIGURINES
          </p>
          <p className="hidden sm:block text-xs sm:text-sm text-white opacity-85 leading-[1.6] mb-4 sm:mb-5">
            The artwork is stunning, shipped fully prepared. The finish is a vision, the 3D craft is
            flawless. Many thanks! Wishing you the win. Order now.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('prev')}
              aria-label="Previous figurine"
              className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-transparent border-2 border-white text-white cursor-pointer hover:scale-[1.08] hover:bg-white/[0.12] transition-all duration-150 active:scale-95"
            >
              <ArrowLeft size={26} strokeWidth={2.25} />
            </button>
            <button
              type="button"
              onClick={() => navigate('next')}
              aria-label="Next figurine"
              className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-transparent border-2 border-white text-white cursor-pointer hover:scale-[1.08] hover:bg-white/[0.12] transition-all duration-150 active:scale-95"
            >
              <ArrowRight size={26} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {/* 6. Bottom-right link "DISCOVER IT" */}
        <a
          onClick={handleDiscover}
          className="absolute bottom-6 right-4 sm:bottom-20 sm:right-10 flex items-center gap-2 text-white uppercase no-underline cursor-pointer group transition-opacity duration-200 hover:opacity-100"
          style={{
            zIndex: 60,
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
      </div>
    </div>
  );
}
