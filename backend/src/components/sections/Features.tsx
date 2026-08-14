import { motion } from "motion/react";
import { Sparkles, Moon, Sun, MessageSquare } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

interface FeatureCardProps {
  title: string;
  tag: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  delay: number;
  actionText: string;
  actionLink: string;
}

function FeatureCard({
  title,
  tag,
  description,
  icon,
  gradient,
  delay,
  actionText,
  actionLink,
}: FeatureCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, ease: "easeOut", delay }}
      className="relative flex flex-col justify-start items-start w-full max-w-[280px] md:max-w-[300px] group mx-auto"
    >
      {/* Glow Background (Crucial) */}
      <div
        className="absolute inset-0 w-full h-[300px] md:h-[320px] opacity-60 rounded-[40px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: gradient,
          filter: "blur(45px)",
        }}
      />

      {/* Foreground Card with Gradient Border (Crucial) */}
      <div
        className="self-stretch h-[300px] md:h-[320px] rounded-[40px] z-10 overflow-hidden relative border-[8px] border-transparent shadow-2xl transition-transform duration-300 group-hover:-translate-y-1.5"
        style={{
          background: `linear-gradient(#1A1A1C, #1A1A1C) padding-box, ${gradient} border-box`,
        }}
      >
        {/* Content Inner Layout */}
        <div className="w-full h-full p-6 flex flex-col justify-between text-left">
          
          {/* Top Row: Icon + Tag Badge */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/90 p-2 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                {icon}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/15 backdrop-blur-md">
                {tag}
              </span>
            </div>

            {/* Title & Description */}
            <h3 className="text-white font-medium text-xl mb-2 tracking-tight">
              {title}
            </h3>
            <p className="text-gray-400 text-[13px] sm:text-[14px] leading-[1.6] font-normal selection:bg-white/20">
              {description}
            </p>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-gray-500 font-medium">
              Ready to practice?
            </span>
            <button
              onClick={() => navigate(actionLink)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <span>{actionText}</span>
              <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

export function Features() {
  const cardsData = [
    {
      title: "Nightly Debrief",
      tag: "BEDTIME CLARITY",
      description:
        "Lying awake replaying the day? Break down what actually happened — and what you'd do differently — before it turns into 2am spiraling.",
      icon: <Moon size={28} strokeWidth={2.5} />,
      gradient: "linear-gradient(137deg, #FF3D77 0%, #FFB1CE 45%, #FF9D3C 100%)",
      delay: 0.1,
      actionText: "Start Debrief",
      actionLink: "/chat",
    },
    {
      title: "Morning Framework",
      tag: "DAILY INTENT",
      description:
        "Waking up already anxious about the day? One framework to know what actually matters today, before your phone decides for you.",
      icon: <Sun size={28} strokeWidth={2.5} />,
      gradient: "linear-gradient(137deg, #FFFFFF 0%, #7DD3FC 45%, #06B6D4 100%)",
      delay: 0.2,
      actionText: "Set Intention",
      actionLink: "/chat",
    },
    {
      title: "Conflict Script",
      tag: "COMMUNICATION",
      description:
        "Dreading a hard conversation? A script to say what you actually mean — without blowing up or shutting down.",
      icon: <MessageSquare size={28} strokeWidth={2.5} />,
      gradient: "linear-gradient(137deg, #4361EE 0%, #E0AEFF 45%, #F72585 100%)",
      delay: 0.3,
      actionText: "Get Script",
      actionLink: "/chat",
    },
    {
      title: "Personalized Noerax",
      tag: "AI MENTOR",
      description:
        "Overthinking the same decision on loop? AI that learns how you think and hands you the exact framework for your situation — not generic advice.",
      icon: <Sparkles size={28} strokeWidth={2.5} />,
      gradient: "linear-gradient(137deg, #F598F2 0%, #C084FC 45%, #38BDF8 100%)",
      delay: 0.4,
      actionText: "Chat with Noerax",
      actionLink: "/chat",
    },
  ];

  return (
    <section
      id="features"
      className="min-h-screen bg-[#0A0A0B] text-white font-sans flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden py-24 sm:py-32 border-t border-white/10"
    >
      {/* Subtle Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-900/10 blur-[180px] pointer-events-none rounded-full" />

      <div className="w-full max-w-[1240px] mx-auto text-center relative z-10">
        
        {/* Header Block */}
        <div className="text-center mb-16 sm:mb-20">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-semibold uppercase tracking-[2px] mb-4 bg-gradient-to-r from-[#F5C344] via-[#F28482] to-[#B567C2] bg-clip-text text-transparent select-none"
          >
            PRACTICAL DECISION TOOLS
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl text-white font-medium tracking-tight mb-5"
          >
            Frameworks for <span className="font-serif italic bg-gradient-to-r from-sky-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Real Life Decisions</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Practical toolkits built for Gen Z overthinking, tough conversations, and daily decisions.
          </motion.p>
        </div>

        {/* 4 Glowing Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 w-full items-center justify-center">
          {cardsData.map((card, idx) => (
            <FeatureCard key={idx} {...card} />
          ))}
        </div>

      </div>
    </section>
  );
}
