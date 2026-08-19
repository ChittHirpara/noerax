import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { MarqueeBar } from "../ui/MarqueeBar";

const MARQUEE_WORDS = [
  "Clarity", "Purpose", "Noerax", "Flow", "Stillness",
  "Mindfulness", "Presence", "Equanimity", "Awakening", "Balance",
];

// 4 Fullscreen Background Videos
const VIDEOS = [
  {
    id: 0,
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081127_0992a171-d3c6-4978-8213-0ec5df8b6d63.mp4",
  },
  {
    id: 1,
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_092026_dd05b805-ea0f-40b2-8c52-332b88502592.mp4",
  },
  {
    id: 2,
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081042_df7202bf-bd80-4b2b-bbc6-1f09ba2870e9.mp4",
  },
  {
    id: 3,
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_080959_4cac5234-3573-464e-a5b7-76b94b8a7d61.mp4",
  },
];

// Word-by-word reveal for headline (Original Typography)
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
  const [activeVideo, setActiveVideo] = useState(0);

  // Automatic continuous video cycling every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVideo((prev) => (prev + 1) % VIDEOS.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="home" className="relative w-full min-h-screen flex flex-col justify-between overflow-x-hidden bg-black font-sans selection:bg-[#38bdf8] selection:text-black">
      
      {/* ====================================================================
          1. BACKGROUND VIDEO LAYER (Optimized Cycling)
         ==================================================================== */}
      {VIDEOS.map((vid, idx) => (
        <video
          key={vid.id}
          autoPlay={activeVideo === idx}
          muted
          loop
          playsInline
          preload={activeVideo === idx || (activeVideo + 1) % VIDEOS.length === idx ? "metadata" : "none"}
          src={vid.url}
          style={{ willChange: 'opacity, transform' }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            activeVideo === idx ? "opacity-100 z-0" : "opacity-0 -z-10 pointer-events-none"
          }`}
        />
      ))}

      {/* ====================================================================
          2. TRANSPARENT PNG OVERLAY (Train-Bob Motion Animation) z-index 1
         ==================================================================== */}
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
        <img
          src="https://soft-zoom-63098134.figma.site/_assets/v11/0b4a435b2df2747593c43d7a1c9b4578f7d8d90c.png"
          alt="Cinematic Overlay"
          className="w-full h-full object-cover animate-train-bob"
        />
      </div>

      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80 z-[1] pointer-events-none" />

      {/* ====================================================================
          3. CONTENT LAYER (Flex Column Full Viewport Height) z-index 2
         ==================================================================== */}
      <div className="relative z-[2] w-full flex-1 flex flex-col justify-between px-4 sm:px-8 md:px-12 pt-20 sm:pt-24 pb-2">

        {/* ------------------------------------------------------------------
            HERO MAIN CONTENT (Centered)
           ------------------------------------------------------------------ */}
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto py-2 px-2">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-4 sm:mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-dharma-flame/30 bg-dharma-flame/10 text-dharma-flame text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-dharma-flame animate-pulse" />
              The Digital Sanctuary
            </span>
          </motion.div>

          {/* Headline (Original Animated Headline Typography) */}
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight tracking-tight mb-4 max-w-4xl">
            <AnimatedHeadline
              text="Learn how life actually works."
              className="block text-dharma-ivory"
              delay={0.1}
            />
            <AnimatedHeadline
              text="The syllabus no one handed Gen Z."
              className="block gradient-text italic text-2xl sm:text-4xl md:text-5xl lg:text-6xl mt-2"
              delay={0.5}
            />
          </h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="text-base sm:text-lg md:text-xl text-dharma-ivory-dim max-w-2xl leading-relaxed mb-6 sm:mb-8 font-light"
          >
            Real frameworks for real decisions.<br />
            <span className="text-dharma-flame font-medium">Not therapy. Not religion.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-6 sm:mb-8 w-full sm:w-auto justify-center"
          >
            {/* Primary Start Learning Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { const el = document.getElementById('library') || document.getElementById('guides') || document.getElementById('struggles'); if (el) { el.scrollIntoView({ behavior: 'smooth' }); } else { navigate('/#library'); } }}
              className="btn-liquid-primary w-full sm:w-auto"
            >
              Start Learning <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            {/* Secondary Explore AI Companion Button — wrapper handles overflow-visible for floating tags */}
            <div className="relative group w-full sm:w-auto mt-3">
              {/* Tilted NEW Tag — outside button so it's not clipped */}
              <span className="absolute -top-3.5 -left-2 z-10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-black bg-gradient-to-r from-cyan-400 to-sky-300 rounded-md shadow-md -rotate-6 group-hover:rotate-0 transition-transform duration-300 pointer-events-none">
                NEW
              </span>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/ai-companion')}
                className="btn-liquid-secondary w-full"
              >
                <span className="sleek-mvp-text">Explore AI Companion</span>
              </motion.button>

              {/* Tilted COMING SOON Tag — outside button so it's not clipped */}
              <span className="absolute -top-3.5 -right-2 z-10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 rounded-md shadow-md rotate-6 group-hover:rotate-0 transition-transform duration-300 pointer-events-none">
                COMING SOON
              </span>
            </div>
          </motion.div>

          {/* Social Proof Pill */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.8 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-4"
          >
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-dharma-ink-2 border border-dharma-line-dark shadow-md">
              <div className="flex -space-x-1.5">
                {['A', 'K', 'P', 'J', 'M'].map((l, i) => (
                  <div key={i} className={`w-6 h-6 rounded-full border-2 border-dharma-ink-2 flex items-center justify-center text-[9px] font-bold text-white bg-gradient-to-br ${
                    ['from-orange-500 to-amber-500', 'from-pink-500 to-rose-500', 'from-emerald-500 to-teal-500', 'from-blue-500 to-indigo-500', 'from-violet-500 to-purple-500'][i]
                  }`}>{l}</div>
                ))}
              </div>
              <span className="text-xs text-dharma-ivory-dim font-medium">
                3,200+ using Noerax right now
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-dharma-ivory-dim/70">
              <span className="text-dharma-flame">"</span>
              <span>finally something that actually helps</span>
              <span className="text-dharma-flame">"</span>
              <span className="text-[11px] opacity-50">— Aryan, Mumbai</span>
            </div>
          </motion.div>

        </div>

        {/* ------------------------------------------------------------------
            BOTTOM MARQUEE BAR
           ------------------------------------------------------------------ */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="w-full border-t border-dharma-line-dark pt-3 pb-1 bg-dharma-ink/80 backdrop-blur-sm"
        >
          <MarqueeBar items={MARQUEE_WORDS} speed={30} />
        </motion.footer>

      </div>

    </section>
  );
}
