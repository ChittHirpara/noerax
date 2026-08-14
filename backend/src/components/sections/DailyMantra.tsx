import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Zap, Brain, Waves, Compass, Sparkles, VolumeX, Sun, Share2 } from "lucide-react";
import Hls from "hls.js";

const HLS_SRC = "https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8";

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
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize HLS video background stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true });
      hls.loadSource(HLS_SRC);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = HLS_SRC;
    }
  }, []);

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
      id="daily-reflection"
      className="py-32 bg-black relative overflow-hidden flex items-center justify-center min-h-[85vh] text-white"
    >
      {/* Background Glowing Flow HLS Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-75 scale-105"
      />

      {/* Top and Bottom Seamless Gradient Edge Fades */}
      <div
        className="absolute top-0 left-0 right-0 z-[1] pointer-events-none"
        style={{ height: "220px", background: "linear-gradient(to bottom, #000000, transparent)" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 z-[1] pointer-events-none"
        style={{ height: "220px", background: "linear-gradient(to top, #000000, transparent)" }}
      />
      <div
        className="absolute inset-y-0 left-0 z-[1] pointer-events-none"
        style={{ width: "140px", background: "linear-gradient(to right, rgba(0,0,0,0.7), transparent)" }}
      />
      <div
        className="absolute inset-y-0 right-0 z-[1] pointer-events-none"
        style={{ width: "140px", background: "linear-gradient(to left, rgba(0,0,0,0.7), transparent)" }}
      />

      {/* Breathing Ambient Backlight Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-dharma-flame/15 blur-[140px] rounded-full pointer-events-none z-[2] animate-breathe" />

      {/* Main Interactive Content Card */}
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center relative z-10">
        
        {/* Liquid Glass Floating Container */}
        <div className="liquid-glass-strong rounded-3xl sm:rounded-[36px] p-6 sm:p-10 md:p-14 border border-white/15 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-white text-xs font-semibold tracking-[0.25em] uppercase mb-8 shadow-sm backdrop-blur-md"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-dharma-flame animate-pulse" />
            Daily Reflection
          </motion.div>

          {/* Icon Badge */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`icon-${current}`}
              initial={{ scale: 0, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 shadow-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl"
            >
              {mantra.icon}
            </motion.div>
          </AnimatePresence>

          {/* Typewriter quote text */}
          <div className="min-h-[160px] sm:min-h-[180px] flex items-center justify-center mb-6">
            <AnimatePresence mode="wait">
              <motion.h2
                key={`mantra-${current}`}
                initial={{ opacity: 0, x: direction * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -30 }}
                transition={{ duration: 0.35 }}
                className="font-serif italic text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white leading-relaxed md:leading-tight tracking-tight drop-shadow-md"
                style={{ fontFamily: "'Instrument Serif', 'Playfair Display', serif" }}
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

          {/* Author / Source Tag */}
          <div className="mb-8">
            <span className="text-sm sm:text-base font-medium tracking-wide text-white/70 uppercase">
              — {mantra.source}
            </span>
          </div>

          {/* Decorative subtle divider */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-white/30" />
            <span className="text-xs text-white/40">✦</span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-white/30" />
          </div>

          {/* Controls & Share Actions */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            {/* Previous Quote Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => go(-1)}
              className="btn-liquid-secondary !w-11 !h-11 sm:!w-12 sm:!h-12 !p-0 !rounded-full flex items-center justify-center shadow-lg"
              title="Previous Quote"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>

            {/* Indicator Dots */}
            <div className="flex gap-1.5 px-2">
              {mantras.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setTyping(true); setCurrent(i); }}
                  className="transition-all duration-300 py-2 cursor-pointer"
                  title={`Quote ${i + 1}`}
                >
                  <div className={`rounded-full transition-all duration-300 ${
                    i === current ? 'w-6 h-2 bg-dharma-flame' : 'w-2 h-2 bg-white/25 hover:bg-white/50'
                  }`} />
                </button>
              ))}
            </div>

            {/* Next Quote Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => go(1)}
              className="btn-liquid-secondary !w-11 !h-11 sm:!w-12 sm:!h-12 !p-0 !rounded-full flex items-center justify-center shadow-lg"
              title="Next Quote"
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
              className="btn-liquid-primary !w-11 !h-11 sm:!w-12 sm:!h-12 !p-0 !rounded-full flex items-center justify-center shadow-lg"
              title="Export Social Media Quote Card"
            >
              <Share2 className="w-4 h-4" />
            </motion.button>

            {/* Random Mantra Shuffle Button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.4 }}
              onClick={() => { setTyping(true); setCurrent(Math.floor(Math.random() * mantras.length)); }}
              className="btn-liquid-secondary !w-11 !h-11 sm:!w-12 sm:!h-12 !p-0 !rounded-full flex items-center justify-center ml-1 shadow-lg"
              title="Random Quote"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
          </div>

        </div>

      </div>
    </motion.section>
  );
}





