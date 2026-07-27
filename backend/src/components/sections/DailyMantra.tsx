import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Zap, Brain, Waves, Compass, Sparkles, VolumeX, Sun, Share2 } from "lucide-react";

const mantras = [
  {
    text: "You have the right to perform your prescribed duty, but you are not entitled to the fruits of action.",
    source: "Bhagavad Gita",
    icon: <Zap className="w-6 h-6 text-dharma-flame" />,
  },
  {
    text: "The mind acts like an enemy for those who do not control it.",
    source: "Bhagavad Gita",
    icon: <Brain className="w-6 h-6 text-amber-400" />,
  },
  {
    text: "We are shaped by our thoughts; we become what we think. When the mind is pure, joy follows like a shadow that never leaves.",
    source: "Dhammapada",
    icon: <Waves className="w-6 h-6 text-cyan-400" />,
  },
  {
    text: "Peace comes from within. Do not seek it without.",
    source: "Gautama Buddha",
    icon: <Compass className="w-6 h-6 text-emerald-400" />,
  },
  {
    text: "When the mind is silent, the universe surrenders.",
    source: "Lao Tzu",
    icon: <Sparkles className="w-6 h-6 text-purple-400" />,
  },
  {
    text: "The quieter you become, the more you can hear.",
    source: "Ram Dass",
    icon: <VolumeX className="w-6 h-6 text-indigo-400" />,
  },
  {
    text: "Your own self-realization is the greatest service you can render the world.",
    source: "Ramana Maharshi",
    icon: <Sun className="w-6 h-6 text-dharma-gold" />,
  },
];

function TypewriterText({ text, onDone }: { text: string; onDone: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayed('');
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index >= text.length) {
      onDone();
      return;
    }
    const timeout = setTimeout(() => {
      setDisplayed(prev => prev + text[index]);
      setIndex(prev => prev + 1);
    }, 22);
    return () => clearTimeout(timeout);
  }, [index, text, onDone]);

  return (
    <>
      {displayed}
      {index < text.length && (
        <span className="animate-blink text-dharma-flame ml-0.5">|</span>
      )}
    </>
  );
}

export function DailyMantra() {
  const [current, setCurrent] = useState(() => Math.floor(Math.random() * mantras.length));
  const [direction, setDirection] = useState(1);
  const [typing, setTyping] = useState(true);

  const go = (dir: number) => {
    setDirection(dir);
    setTyping(true);
    setCurrent(prev => (prev + dir + mantras.length) % mantras.length);
  };

  const mantra = mantras[current];

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="py-36 bg-dharma-ink relative overflow-hidden flex items-center justify-center min-h-[70vh]"
    >
      {/* Breathing glow rings */}
      {[500, 700, 900].map((size, i) => (
        <div
          key={i}
          className="absolute rounded-full border pointer-events-none"
          style={{
            width: size,
            height: size,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            borderColor: 'rgba(56,189,248,0.08)',
            animation: `breathe ${6 + i * 2}s ease-in-out ${i * 1.2}s infinite`,
          }}
        />
      ))}

      {/* Background Sanskrit symbols */}
      {['✦', '☯', '✦', '✧', '✦'].map((sym, i) => (
        <span
          key={i}
          className="absolute text-dharma-ivory/[0.02] font-serif select-none pointer-events-none"
          style={{
            fontSize: `${80 + i * 30}px`,
            top: `${10 + i * 18}%`,
            left: `${5 + i * 22}%`,
            animation: `float-particle ${12 + i * 4}s ease-in-out ${i * 2}s infinite`,
          }}
        >
          {sym}
        </span>
      ))}

      {/* Central glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-dharma-flame/5 blur-[100px] rounded-full pointer-events-none animate-breathe" />

      <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="inline-block text-dharma-flame text-xs font-semibold tracking-[0.3em] uppercase mb-8 opacity-80"
        >
          Daily Reflection
        </motion.span>

        {/* Icon Badge */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`icon-${current}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-16 h-16 rounded-2xl bg-dharma-ink-2 border border-dharma-line-dark shadow-xl flex items-center justify-center mx-auto mb-8"
          >
            {mantra.icon}
          </motion.div>
        </AnimatePresence>

        {/* Typewriter quote */}
        <div className="min-h-[200px] flex items-center justify-center mb-10">
          <AnimatePresence mode="wait">
            <motion.h2
              key={`mantra-${current}`}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.4 }}
              className="font-serif text-2xl md:text-4xl lg:text-5xl text-dharma-ivory leading-snug md:leading-tight"
            >
              "
              <TypewriterText
                text={mantra.text}
                onDone={() => setTyping(false)}
              />
              "
            </motion.h2>
          </AnimatePresence>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="w-12 h-px bg-dharma-gold/40" />
          <div className="w-12 h-px bg-dharma-gold/40" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => go(-1)}
            className="w-12 h-12 rounded-full border border-dharma-line-dark bg-dharma-ink-2 hover:border-dharma-flame/40 hover:bg-dharma-ink-3 transition-colors flex items-center justify-center text-dharma-ivory-dim hover:text-dharma-ivory"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          {/* Dots */}
          <div className="flex gap-2">
            {mantras.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setTyping(true); setCurrent(i); }}
                className="transition-all duration-300"
              >
                <div className={`rounded-full transition-all duration-300 ${
                  i === current ? 'w-6 h-2 bg-dharma-flame' : 'w-2 h-2 bg-dharma-ivory/20 hover:bg-dharma-ivory/40'
                }`} />
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => go(1)}
            className="w-12 h-12 rounded-full border border-dharma-line-dark bg-dharma-ink-2 hover:border-dharma-flame/40 hover:bg-dharma-ink-3 transition-colors flex items-center justify-center text-dharma-ivory-dim hover:text-dharma-ivory cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          {/* Export Social Media Quote Card Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-quote-modal', { detail: { quote: mantra.text, source: mantra.source } }));
            }}
            className="w-12 h-12 rounded-full border border-dharma-line-dark bg-dharma-ink-2 hover:border-dharma-flame/40 hover:bg-dharma-flame/10 transition-colors flex items-center justify-center text-dharma-flame cursor-pointer shadow-md"
            title="Export Social Media Quote Card"
          >
            <Share2 className="w-4 h-4 text-dharma-flame" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.4 }}
            onClick={() => { setTyping(true); setCurrent(Math.floor(Math.random() * mantras.length)); }}
            className="w-12 h-12 rounded-full border border-dharma-line-dark bg-dharma-ink-2 hover:border-dharma-flame/40 hover:bg-dharma-ink-3 transition-colors flex items-center justify-center text-dharma-ivory-dim hover:text-dharma-flame ml-2"
            title="Random mantra"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}




