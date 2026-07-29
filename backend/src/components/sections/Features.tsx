import { motion } from "motion/react";
import { Sparkles, Moon, Sun, MessageSquare } from "lucide-react";
import React, { useRef } from "react";

const features = [
  {
    icon: <Moon className="w-7 h-7 text-dharma-flame" />,
    title: "Nightly Debrief",
    desc: "Lying awake replaying the day? Break down what actually happened — and what you'd do differently — before it turns into 2am spiraling.",
    gradient: "from-orange-500/10 to-transparent",
    glow: "rgba(56,189,248,0.15)",
  },
  {
    icon: <Sun className="w-7 h-7 text-dharma-gold" />,
    title: "Morning Framework",
    desc: "Waking up already anxious about the day? One framework to know what actually matters today, before your phone decides for you.",
    gradient: "from-yellow-500/10 to-transparent",
    glow: "rgba(251,191,36,0.15)",
  },
  {
    icon: <MessageSquare className="w-7 h-7 text-cyan-400" />,
    title: "Conflict Script",
    desc: "Dreading a hard conversation? A script to say what you actually mean — without blowing up or shutting down.",
    gradient: "from-cyan-500/10 to-transparent",
    glow: "rgba(34,211,238,0.15)",
  },
  {
    icon: <Sparkles className="w-7 h-7 text-dharma-ivory" />,
    title: "Personalized Noerax",
    desc: "Overthinking the same decision on loop? AI that learns how you think and hands you the exact framework for your situation — not generic advice.",
    gradient: "from-white/5 to-transparent",
    glow: "rgba(255,255,255,0.1)",
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
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      id="features"
      className="py-32 bg-dharma-ink-2 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-dharma-flame/10 to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block text-dharma-flame text-xs font-semibold tracking-[0.3em] uppercase mb-4"
          >
            Practical Decision Tools
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-4xl md:text-5xl text-dharma-ivory mb-6"
          >
            Frameworks for <span className="gradient-text">Real Life Decisions</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-dharma-ivory-dim text-lg max-w-2xl mx-auto"
          >
            Practical toolkits built for Gen Z overthinking, tough conversations, and daily decisions.
          </motion.p>
        </div>


        <SpotlightSection>
          <div className="grid md:grid-cols-2 gap-5">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.6,
                  delay: idx * 0.12,
                  type: 'spring',
                  stiffness: 100,
                  damping: 15,
                }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative p-8 rounded-3xl border border-dharma-line-dark overflow-hidden cursor-default"
                style={{
                  background: 'rgba(24,24,27,0.8)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                {/* Gradient top overlay */}
                <div className={`absolute top-0 left-0 right-0 h-40 bg-gradient-to-b ${feature.gradient} pointer-events-none`} />

                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 60px ${feature.glow}` }}
                />

                {/* Animated border on hover */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ border: `1px solid ${feature.glow}` }}
                />

                <div className="relative z-10">
                  {/* Icon with pulse ring */}
                  <div className="relative inline-flex mb-6">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="w-14 h-14 rounded-2xl bg-dharma-ink flex items-center justify-center border border-dharma-line-dark group-hover:border-dharma-flame/30 transition-colors"
                    >
                      {feature.icon}
                    </motion.div>
                  </div>

                  <h3 className="text-xl font-semibold text-dharma-ivory mb-3 group-hover:text-white transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-dharma-ivory-dim leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </SpotlightSection>
      </div>
    </motion.section>
  );
}




