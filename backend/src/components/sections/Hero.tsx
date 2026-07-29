import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { FloatingParticles } from "../ui/FloatingParticles";
import { MarqueeBar } from "../ui/MarqueeBar";

const MARQUEE_WORDS = [
  "Clarity", "Purpose", "Noerax", "Flow", "Stillness",
  "Mindfulness", "Presence", "Equanimity", "Awakening", "Balance",
];

// Word-by-word reveal for headline
function AnimatedHeadline({ text, className, delay = 0 }: { text: string; className: string; delay?: number }) {
  const words = text.split(' ');
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: delay + i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ display: 'inline-block', marginRight: '0.3em' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export function Hero() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section id="home" className="relative min-h-screen flex flex-col items-start overflow-hidden pt-32 pb-0">
      {/* Floating ambient particles */}
      <FloatingParticles count={28} />

      {/* Deep background radial glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-dharma-flame/8 blur-[140px] rounded-full animate-breathe" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-dharma-gold/6 blur-[120px] rounded-full" style={{ animation: 'breathe 7s ease-in-out 2s infinite' }} />
      </div>

      {/* Breathing Mandala Rings */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        {[900, 680, 480, 300].map((size, i) => (
          <motion.div
            key={i}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 120 + i * 20, repeat: Infinity, ease: 'linear' }}
            className="absolute rounded-full border"
            style={{
              width: size,
              height: size,
              borderColor: i === 0
                ? 'rgba(56,189,248,0.08)'
                : i === 1
                ? 'rgba(6,182,212,0.1)'
                : i === 2
                ? 'rgba(56,189,248,0.06)'
                : 'rgba(96,165,250,0.1)',
              animation: `breathe ${5 + i * 2}s ease-in-out ${i * 1.5}s infinite, ${i % 2 === 0 ? 'none' : 'none'}`,
            }}
          />
        ))}
        {/* Centre dot glow */}
        <div className="absolute w-4 h-4 rounded-full bg-dharma-flame/40 blur-sm animate-pulse" />
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 sm:px-8 md:px-16 relative z-10 flex flex-col items-start text-left h-full justify-center flex-1 pb-20">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-3 mb-8 sm:mb-12"
        >
          <span className="flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full border border-dharma-flame/30 bg-dharma-flame/10 text-dharma-flame text-[10px] sm:text-xs font-semibold tracking-[0.15em] sm:tracking-[0.2em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-dharma-flame animate-pulse" />
            The Digital Sanctuary
          </span>
        </motion.div>

        {/* Headline */}
        <h1 className="font-serif text-3xl sm:text-5xl md:text-7xl lg:text-8xl leading-tight tracking-tight mb-6 max-w-4xl">
          <AnimatedHeadline
            text="Learn how life actually works."
            className="block text-dharma-ivory"
            delay={0.1}
          />
          <AnimatedHeadline
            text="The syllabus no one handed Gen Z."
            className="block gradient-text italic text-2xl sm:text-4xl md:text-6xl lg:text-7xl mt-2"
            delay={0.5}
          />
        </h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="text-base sm:text-xl md:text-2xl text-dharma-ivory-dim max-w-2xl font-light tracking-wide leading-relaxed mb-8 sm:mb-12"
        >
          Real frameworks for real decisions.<br />
          <span className="text-dharma-flame font-medium">Not therapy. Not religion.</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-16 sm:mb-20 w-full sm:w-auto"
        >
          <div className="relative w-full sm:w-auto">
            {/* Pulsing rings */}
            <span className="absolute inset-0 rounded-full bg-dharma-flame/30 animate-pulse-ring" />
            <span className="absolute inset-0 rounded-full bg-dharma-flame/20 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(user ? '/chat' : '/auth')}
              className="relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 bg-dharma-flame text-white rounded-full text-base sm:text-lg font-semibold shadow-lg shadow-dharma-flame/30 transition-shadow hover:shadow-dharma-flame/50 hover:shadow-xl z-10 cursor-pointer"
            >
              Start Learning <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const el = document.getElementById('library');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                navigate('/reading-room');
              }
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full border border-dharma-line-dark text-dharma-ivory-dim hover:text-dharma-ivory hover:border-dharma-ivory/20 text-base sm:text-lg font-medium transition-colors cursor-pointer"
          >
            Explore Library
          </motion.button>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.8 }}
          className="flex flex-wrap items-center gap-3 sm:gap-6 text-[10px] sm:text-xs text-dharma-ivory-dim/60 font-medium tracking-[0.15em] sm:tracking-[0.25em] uppercase"
        >
          <div className="flex -space-x-2">
            {['S', 'A', 'R', 'J', 'M'].map((l, i) => (
              <div key={i} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-dharma-ink-3 border border-dharma-line-dark flex items-center justify-center text-[9px] sm:text-[10px] text-dharma-ivory-dim font-medium">
                {l}
              </div>
            ))}
          </div>
          <span>Trusted by 12k+ seekers worldwide</span>
        </motion.div>
      </div>

      {/* Bottom marquee bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        className="w-full border-t border-dharma-line-dark py-4 bg-dharma-ink/80 backdrop-blur-sm"
      >
        <MarqueeBar items={MARQUEE_WORDS} speed={30} />
      </motion.div>
    </section>
  );
}




