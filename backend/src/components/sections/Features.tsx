import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Moon, Sun, MessageSquare } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: <Moon className="w-6 h-6 text-dharma-flame" />,
    iconBg: "bg-dharma-flame/10 border-dharma-flame/30 text-dharma-flame",
    title: "Nightly Debrief",
    tag: "Bedtime Clarity",
    desc: "Lying awake replaying the day? Break down what actually happened — and what you'd do differently — before it turns into 2am spiraling.",
    gradient: "from-sky-500/15 via-sky-500/5 to-transparent",
    glow: "rgba(56,189,248,0.2)",
    actionText: "Start Debrief",
    actionLink: "/chat",
    beforeAfter: {
      before: "Lying awake replaying what you said at 3pm",
      after: "Asleep by 11pm. Head clear. Tomorrow sorted.",
    },
  },
  {
    icon: <Sun className="w-6 h-6 text-amber-400" />,
    iconBg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    title: "Morning Framework",
    tag: "Daily Intent",
    desc: "Waking up already anxious about the day? One framework to know what actually matters today, before your phone decides for you.",
    gradient: "from-amber-500/15 via-amber-500/5 to-transparent",
    glow: "rgba(251,191,36,0.2)",
    actionText: "Set Intention",
    actionLink: "/chat",
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-cyan-400" />,
    iconBg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
    title: "Conflict Script",
    tag: "Communication",
    desc: "Dreading a hard conversation? A script to say what you actually mean — without blowing up or shutting down.",
    gradient: "from-cyan-500/15 via-cyan-500/5 to-transparent",
    glow: "rgba(34,211,238,0.2)",
    actionText: "Get Script",
    actionLink: "/chat",
  },
  {
    icon: <Sparkles className="w-6 h-6 text-purple-400" />,
    iconBg: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    title: "Personalized Noerax",
    tag: "AI Mentor",
    desc: "Overthinking the same decision on loop? AI that learns how you think and hands you the exact framework for your situation — not generic advice.",
    gradient: "from-purple-500/15 via-purple-500/5 to-transparent",
    glow: "rgba(192,132,252,0.2)",
    actionText: "Chat with Noerax",
    actionLink: "/chat",
  },
];

function SpotlightSection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--x', `${e.clientX - rect.left}px`);
    ref.current.style.setProperty('--y', `${e.clientY - rect.top}px`);
  };

  return (
    <div ref={ref} onMouseMove={handleMouseMove} className="relative spotlight">
      {children}
    </div>
  );
}

export function Features() {
  const [showAfter, setShowAfter] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle before/after on first card every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => setShowAfter((v) => !v), 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="features"
      className="py-32 bg-dharma-ink-2 relative overflow-hidden"
    >
      {/* Deep ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-dharma-flame/5 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-dharma-gold/5 blur-[160px] pointer-events-none rounded-full" />

      <div className="container mx-auto px-4 sm:px-6 max-w-5xl relative z-10">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-dharma-flame text-xs font-semibold tracking-[0.3em] uppercase mb-4"
          >
            Practical Decision Tools
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl sm:text-5xl text-dharma-ivory mb-5"
          >
            Frameworks for <span className="gradient-text">Real Life Decisions</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-dharma-ivory-dim text-base sm:text-lg max-w-2xl mx-auto"
          >
            Practical toolkits built for Gen Z overthinking, tough conversations, and daily decisions.
          </motion.p>
        </div>

        <SpotlightSection>
          <div ref={containerRef} className="grid md:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                whileHover={{ y: -6 }}
                className="group relative p-7 sm:p-8 rounded-3xl border border-dharma-line-dark/80 bg-dharma-ink/90 backdrop-blur-xl flex flex-col justify-between transition-all duration-300 hover:border-dharma-flame/40 hover:shadow-2xl hover:shadow-dharma-flame/10"
              >
                {/* Top ambient color glow */}
                <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${feature.gradient} rounded-t-3xl pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity`} />

                <div className="relative z-10">
                  {/* Top Bar: Icon + Tag */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl border ${feature.iconBg} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300`}>
                      {feature.icon}
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full bg-dharma-ink-3/80 border border-dharma-line-dark text-dharma-ivory-dim">
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl text-dharma-ivory mb-3 group-hover:text-dharma-flame transition-colors font-medium">
                    {feature.title}
                  </h3>
                  
                  <p className="text-dharma-ivory-dim text-sm leading-relaxed mb-6">
                    {feature.desc}
                  </p>

                  {/* Before / After toggle — on first card */}
                  {'beforeAfter' in feature && feature.beforeAfter && (
                    <div className="mb-6 p-3.5 rounded-2xl bg-dharma-ink-2/80 border border-dharma-line-dark">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={showAfter ? 'after' : 'before'}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center gap-2.5"
                        >
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                            showAfter
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {showAfter ? 'AFTER' : 'BEFORE'}
                          </span>
                          <span className="text-xs text-dharma-ivory/90 leading-snug">
                            {showAfter ? feature.beforeAfter.after : feature.beforeAfter.before}
                          </span>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="relative z-10 pt-4 border-t border-dharma-line-dark/60 flex items-center justify-between">
                  <span className="text-xs text-dharma-ivory-dim group-hover:text-dharma-ivory transition-colors">
                    Ready to practice?
                  </span>
                  <a
                    href={feature.actionLink}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-dharma-flame group-hover:text-dharma-saffron transition-colors"
                  >
                    <span>{feature.actionText}</span>
                    <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </SpotlightSection>
      </div>
    </section>
  );
}




