import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

interface WisdomCard {
  id: number;
  title: string;
  source: string;
  quote: string;
  insight: string;
  microPractice: string;
}

const WISDOM_DECK: WisdomCard[] = [
  {
    id: 1,
    title: 'The Art of Non-Attachment',
    source: 'Bhagavad Gita 2.47',
    quote: 'Focus entirely on your action, never on the fruit of the outcome.',
    insight: 'Anxiety arises when your mind lives in future expectations rather than current presence.',
    microPractice: 'Take 3 deep breaths. Name one outcome you will surrender control over today.'
  },
  {
    id: 2,
    title: 'Unshakable Inner Stillness',
    source: 'Patanjali Yoga Sutras 1.2',
    quote: 'Yoga is the quiet settling of the mind into its essential nature.',
    insight: 'Thoughts are like clouds passing in the sky; you are the sky, not the storm.',
    microPractice: 'Close your eyes for 60 seconds. Observe your thoughts without judging them.'
  },
  {
    id: 3,
    title: 'The Master of Self-Control',
    source: 'Dhammapada 103',
    quote: 'Though one may conquer a thousand men in battle, conquer oneself is greatest victory.',
    insight: 'True power is emotional mastery over your own internal reactions.',
    microPractice: 'Before reacting to any frustration today, pause for 5 seconds before speaking.'
  },
  {
    id: 4,
    title: 'Embracing Impermanence',
    source: 'Tao Te Ching 76',
    quote: 'The hard and rigid will break; the soft and flexible will prevail.',
    insight: 'Resistance creates suffering. Adaptability creates effortless flow.',
    microPractice: 'Identify one change happening around you and choose to flow with it.'
  },
  {
    id: 5,
    title: 'The Power of Choice',
    source: 'Meditations (Marcus Aurelius)',
    quote: 'You have power over your mind - not outside events. Realize this, and find strength.',
    insight: 'No person or event can disturb your peace unless you give them permission.',
    microPractice: 'Repeat silently: "My peace is my own choice."'
  }
];

export function WisdomCardDraw() {
  const [currentCard, setCurrentCard] = useState<WisdomCard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });

  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Tilt angle max 12 deg
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ x: rotateX, y: rotateY, glareX, glareY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  };

  const drawCard = () => {
    setIsShuffling(true);
    setIsFlipped(false);
    setTimeout(() => {
      const random = WISDOM_DECK[Math.floor(Math.random() * WISDOM_DECK.length)];
      setCurrentCard(random);
      setIsShuffling(false);
      setTimeout(() => setIsFlipped(true), 150);
    }, 600);
  };

  return (
    <section id="wisdom-card" className="py-20 sm:py-28 bg-[#070709] text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-cyan-500/10 blur-[150px] pointer-events-none rounded-full" />

      <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center relative z-10">
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/[0.03] text-white/80 text-xs font-mono uppercase tracking-widest mb-6 backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> Holographic Wisdom Deck
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif italic text-3xl sm:text-4xl md:text-5xl text-white mb-3"
          style={{ fontFamily: "'Instrument Serif', 'Playfair Display', serif" }}
        >
          Card of Daily Clarity
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-white/50 text-sm sm:text-base max-w-lg mx-auto mb-10 font-light"
        >
          Hover or tilt the holographic deck. Tap to draw your timeless mental model for today.
        </motion.p>

        {/* 3D Card Area */}
        <div className="flex justify-center mb-10" style={{ perspective: 1200 }}>
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{
              rotateX: tilt.x,
              rotateY: isFlipped ? 180 + tilt.y : tilt.y,
              scale: isShuffling ? [1, 0.95, 1.05, 1] : 1,
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-full max-w-sm sm:max-w-md h-[420px] sm:h-[440px] relative cursor-pointer group"
            style={{ transformStyle: 'preserve-3d' }}
            onClick={() => {
              if (!currentCard) drawCard();
              else setIsFlipped(!isFlipped);
            }}
          >
            {/* Holographic Sheen Overlay */}
            <div
              className="absolute inset-0 rounded-3xl z-20 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.4) 0%, rgba(56,189,248,0.2) 30%, transparent 70%)`,
                mixBlendMode: 'overlay',
              }}
            />

            {/* FRONT OF CARD (Back of deck design) */}
            <div
              className="absolute inset-0 rounded-3xl p-8 liquid-glass-strong border border-white/15 shadow-2xl flex flex-col items-center justify-between overflow-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="w-full flex justify-between items-center text-xs text-cyan-300 font-mono">
                <span>NOERAX DECK</span>
                <span>432 HZ</span>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <Layers className={`w-9 h-9 text-cyan-300 ${isShuffling ? 'animate-spin' : ''}`} />
                </div>
                <h3 className="font-serif italic text-2xl text-white mb-1">Tap to Draw</h3>
                <p className="text-xs text-white/40 font-mono">Unveil today's wisdom guidance</p>
              </div>

              <div className="text-xs text-white/30 font-mono">01 / 05</div>
            </div>

            {/* BACK OF CARD (Revealed Wisdom) */}
            <div
              className="absolute inset-0 rounded-3xl p-7 sm:p-8 liquid-glass-strong border border-cyan-400/40 shadow-2xl flex flex-col justify-between overflow-hidden text-left"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-mono text-cyan-300 uppercase tracking-wider">
                    {currentCard?.source || 'Timeless Wisdom'}
                  </span>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                </div>
                <h3 className="font-serif italic text-2xl text-white mb-2">{currentCard?.title}</h3>
                <p className="font-serif italic text-white/90 text-sm mb-3 leading-relaxed bg-white/[0.03] p-3 rounded-xl border border-white/8">
                  &quot;{currentCard?.quote}&quot;
                </p>
                <p className="text-xs text-white/60 leading-relaxed mb-3 font-light">
                  {currentCard?.insight}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Today&apos;s Micro-Practice
                </span>
                <p className="text-xs text-white font-medium">
                  {currentCard?.microPractice}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Button */}
        <button
          onClick={drawCard}
          disabled={isShuffling}
          className="btn-liquid-primary !py-3.5 !px-8 !text-sm cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
          <span>{currentCard ? 'Draw Another Card' : 'Draw Card of the Day'}</span>
        </button>

      </div>
    </section>
  );
}

