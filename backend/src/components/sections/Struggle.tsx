import { motion, useMotionValue, useTransform } from "motion/react";
import { useInView } from "motion/react";
import React, { useRef, useEffect, useState } from "react";
import { Brain, Flame, Smartphone } from "lucide-react";

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

interface TiltCardProps {
  title: string;
  desc: string;
  stat: string;
  statLabel: string;
  delay: number;
  icon: React.ReactNode;
  statNum: number;
  statSuffix: string;
}

function TiltCard({ title, desc, stat, statLabel, delay, icon, statNum, statSuffix }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(nx);
    y.set(ny);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative p-8 rounded-2xl bg-dharma-ink-2 border border-dharma-line-dark hover:border-dharma-flame/40 transition-colors duration-500 cursor-default overflow-hidden"
    >
      {/* Inner glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 0%, rgba(56,189,248,0.1), transparent 70%)' }}
      />

      {/* Icon */}
      <div className="mb-6" style={{ transform: 'translateZ(20px)' }}>
        {icon}
      </div>

      {/* Glitch title */}
      <h3
        className="glitch-text font-serif text-2xl text-dharma-ivory mb-3"
        data-text={title}
        style={{ transform: 'translateZ(20px)' }}
      >
        {title}
      </h3>

      <p className="text-dharma-ivory-dim leading-relaxed mb-8" style={{ transform: 'translateZ(10px)' }}>
        {desc}
      </p>

      {/* Stat */}
      <div className="border-t border-dharma-line-dark pt-6" style={{ transform: 'translateZ(15px)' }}>
        <span className="block text-3xl font-bold gradient-text mb-1">
          <AnimatedCounter target={statNum} suffix={statSuffix} />
        </span>
        <span className="text-xs text-dharma-ivory-dim/60 font-medium uppercase tracking-widest">
          {statLabel}
        </span>
      </div>
    </motion.div>
  );
}

const cards = [
  {
    title: "Overthinking",
    desc: "Paralyzed by endless choices and 'what-ifs', losing touch with the present moment.",
    stat: "73%",
    statLabel: "of Gen Z feel overwhelmed daily",
    icon: (
      <div className="w-12 h-12 rounded-xl bg-dharma-flame/10 border border-dharma-flame/20 flex items-center justify-center text-dharma-flame">
        <Brain className="w-6 h-6" />
      </div>
    ),
    delay: 0.1,
    statNum: 73,
    statSuffix: "%",
  },
  {
    title: "Burnout",
    desc: "Running a race with no finish line, confusing productivity with inherent self-worth.",
    stat: "4/5",
    statLabel: "young adults report chronic burnout",
    icon: (
      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
        <Flame className="w-6 h-6" />
      </div>
    ),
    delay: 0.2,
    statNum: 82,
    statSuffix: "%",
  },
  {
    title: "Disconnection",
    desc: "Scrolling through thousands of lives while feeling detached from our own inner voice.",
    stat: "6hr",
    statLabel: "average daily screen time in Gen Z",
    icon: (
      <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
        <Smartphone className="w-6 h-6" />
      </div>
    ),
    delay: 0.3,
    statNum: 6,
    statSuffix: "hr",
  },
];

export function Struggle() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      id="philosophy"
      className="py-32 bg-dharma-ink-2 relative overflow-hidden"
    >
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="inline-block text-dharma-flame text-xs font-semibold tracking-[0.3em] uppercase mb-4 opacity-80">
            The Skill Gap
          </span>
          <h2 className="font-serif text-4xl md:text-6xl text-dharma-ivory mb-6">
            The Missing Syllabus for <span className="gradient-text">Life</span>
          </h2>
          <p className="text-dharma-ivory-dim text-lg md:text-xl max-w-2xl mx-auto">
            Nobody teaches you how to make a hard decision, handle conflict, or know what you want. School gives you degrees, but no one handed you a syllabus for life.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6" style={{ perspective: '1000px' }}>
          {cards.map((card, idx) => (
            <TiltCard key={idx} {...card} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}




