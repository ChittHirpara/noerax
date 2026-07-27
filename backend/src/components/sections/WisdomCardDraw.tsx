import React, { useState } from 'react';
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
    <section id="wisdom-card" className="py-28 bg-dharma-ink relative overflow-hidden border-t border-dharma-line-dark">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-dharma-flame/5 blur-[140px] pointer-events-none rounded-full" />

      <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-dharma-flame/30 bg-dharma-flame/10 text-dharma-flame text-xs font-semibold uppercase tracking-widest mb-6"
        >
          <Sparkles className="w-3.5 h-3.5" /> Daily Ritual
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-4xl md:text-5xl text-dharma-ivory mb-4"
        >
          Draw Your Daily Card of Clarity
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-dharma-ivory-dim text-lg max-w-xl mx-auto mb-12"
        >
          Shuffle the ancient wisdom deck and draw a card for actionable mindfulness today.
        </motion.p>

        {/* 3D Card Area */}
        <div className="flex justify-center mb-10 perspective-1000">
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0, scale: isShuffling ? [1, 0.95, 1.05, 1] : 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md h-[440px] relative cursor-pointer"
            style={{ transformStyle: 'preserve-3d' }}
            onClick={() => {
              if (!currentCard) drawCard();
              else setIsFlipped(!isFlipped);
            }}
          >
            {/* FRONT OF CARD (Back of deck design) */}
            <div
              className="absolute inset-0 rounded-3xl p-8 bg-dharma-ink-2 border-2 border-dharma-flame/30 shadow-2xl flex flex-col items-center justify-between overflow-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="w-full flex justify-between items-center text-xs text-dharma-flame font-mono">
                <span>NOERAX DECK</span>
                <span>432 HZ</span>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-dharma-flame/10 border border-dharma-flame/30 flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <Layers className={`w-10 h-10 text-dharma-flame ${isShuffling ? 'animate-spin' : ''}`} />
                </div>
                <h3 className="font-serif text-2xl text-dharma-ivory mb-2">Tap to Draw</h3>
                <p className="text-xs text-dharma-ivory-dim">Unveil today's wisdom guidance</p>
              </div>

              <div className="text-xs text-dharma-ivory-dim/60 font-mono">01 / 05</div>
            </div>

            {/* BACK OF CARD (Revealed Wisdom) */}
            <div
              className="absolute inset-0 rounded-3xl p-8 bg-dharma-ink-2 border-2 border-dharma-flame/50 shadow-2xl flex flex-col justify-between overflow-hidden text-left"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-semibold text-dharma-flame uppercase tracking-wider">
                    Wisdom Card
                  </span>
                  <Sparkles className="w-4 h-4 text-dharma-flame" />
                </div>
                <h3 className="font-serif text-2xl text-dharma-ivory mb-3">{currentCard?.title}</h3>
                <p className="font-serif italic text-dharma-ivory/90 text-sm mb-4 leading-relaxed bg-dharma-ink-3/60 p-3 rounded-xl border border-dharma-line-dark">
                  "{currentCard?.quote}"
                </p>
                <p className="text-xs text-dharma-ivory-dim leading-relaxed mb-4">
                  {currentCard?.insight}
                </p>
              </div>

              <div className="pt-3 border-t border-dharma-line-dark">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Today's Micro-Practice
                </span>
                <p className="text-xs text-dharma-ivory font-medium">
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
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-dharma-flame text-white font-semibold rounded-full shadow-lg shadow-dharma-flame/30 hover:bg-dharma-saffron transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
          {currentCard ? 'Draw Another Card' : 'Draw Card of the Day'}
        </button>

      </div>
    </section>
  );
}
