import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowUpRight, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

// ContactButton Component
export function ContactButton({ label = "Contact Me", onClick }: { label?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)',
        boxShadow: '0px 4px 4px rgba(181, 1, 167, 0.25), inset 4px 4px 12px #7721B1',
        outline: '2px solid #FFFFFF',
        outlineOffset: '-3px',
      }}
      className="rounded-full px-8 py-3 sm:px-10 sm:py-3.5 md:px-12 md:py-4 text-white font-medium uppercase tracking-widest text-xs sm:text-sm md:text-base cursor-pointer hover:opacity-90 transition-all duration-300 transform active:scale-95 shadow-lg flex items-center gap-2"
    >
      <span>{label}</span>
      <ArrowUpRight className="w-4 h-4" />
    </button>
  );
}

// FadeIn Component
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  className?: string;
  as?: any;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  className = "",
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "50px", amount: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Magnet Mouse-Following Component
interface MagnetProps {
  children: React.ReactNode;
  padding?: number;
  strength?: number;
  className?: string;
}

export function Magnet({ children, padding = 150, strength = 3, className = "" }: MagnetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia('(pointer: coarse)').matches) return;

    let ticking = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!element) return;
          const rect = element.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          const distanceX = e.clientX - centerX;
          const distanceY = e.clientY - centerY;
          const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

          const maxRadius = Math.max(rect.width, rect.height) / 2 + padding;

          if (distance < maxRadius) {
            setIsHovered(true);
            setPosition({
              x: distanceX / strength,
              y: distanceY / strength,
            });
          } else {
            setIsHovered(false);
            setPosition({ x: 0, y: 0 });
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [padding, strength]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: isHovered ? 'transform 0.3s ease-out' : 'transform 0.6s ease-in-out',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}

// Character-by-Character Scroll Reveal Text Animation
export function AnimatedText({ text, className = "" }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.2'],
  });

  const words = text.split(' ');

  return (
    <p ref={containerRef} className={`${className} flex flex-wrap justify-center gap-x-1.5 gap-y-1`}>
      {words.map((word, wIdx) => {
        const chars = word.split('');
        return (
          <span key={wIdx} className="inline-block whitespace-nowrap">
            {chars.map((char, cIdx) => {
              const overallIndex = words.slice(0, wIdx).reduce((acc, w) => acc + w.length, 0) + cIdx;
              const totalChars = text.length;
              const start = overallIndex / totalChars;
              const end = start + (1 / totalChars);

              return (
                <CharacterKey
                  key={cIdx}
                  char={char}
                  range={[start, end]}
                  progress={scrollYProgress}
                />
              );
            })}
          </span>
        );
      })}
    </p>
  );
}

function CharacterKey({ char, range, progress }: { char: string; range: [number, number]; progress: any }) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return <motion.span style={{ opacity, willChange: 'opacity' }}>{char}</motion.span>;
}

// ============================================================================
// MARQUEE VIDEO DATA (Local /media Folder Videos)
// ============================================================================
const MARQUEE_VIDEOS = [
  "/media/video-1.mp4",
  "/media/video-2.mp4",
  "/media/video-3.mp4",
  "/media/video-4.mp4",
  "/media/video-5.mp4",
  "/media/video-6.mp4",
  "/media/video-7.mp4",
  "/media/video-8.mp4",
];

// ============================================================================
// MAIN AI COMPANION (3D CREATOR JACK PORTFOLIO) PAGE
// ============================================================================
export function AiCompanionPage() {
  const [scrollOffset, setScrollOffset] = useState(0);
  const marqueeRef = useRef<HTMLDivElement>(null);

  // Set Document Title
  useEffect(() => {
    document.title = "Noerax — AI Companion";
    return () => {
      document.title = "Noerax — Daily AI Guidance | Wisdom & Clarity";
    };
  }, []);

  // Optimized Scroll Listener using requestAnimationFrame
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (marqueeRef.current) {
            const rect = marqueeRef.current.getBoundingClientRect();
            const offset = (window.scrollY - (window.scrollY + rect.top) + window.innerHeight) * 0.3;
            setScrollOffset(offset);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#0C0C0C] text-[#D7E2EA] font-kanit min-h-screen overflow-x-clip selection:bg-[#B600A8] selection:text-white relative">
      
      {/* Floating Back to Noerax Button */}
      <div className="fixed top-5 left-5 z-50">
        <Link
          to="/"
          className="px-4 py-2 rounded-full bg-[#18181b]/80 border border-white/20 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white hover:text-[#0C0C0C] transition-all shadow-2xl flex items-center gap-1.5 backdrop-blur-md"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Noerax
        </Link>
      </div>

      {/* ====================================================================
          1. HERO SECTION
         ==================================================================== */}
      <section className="h-screen flex flex-col justify-between overflow-x-clip relative px-4 sm:px-6 md:px-10 pb-6 md:pb-10 pt-4">
        
        {/* Navbar */}
        <FadeIn delay={0} y={-20} className="w-full">
          <nav className="w-full flex items-center justify-between pt-6 md:pt-8 px-2 sm:px-6 md:px-10 text-[#D7E2EA] font-medium uppercase tracking-wider text-sm md:text-lg lg:text-[1.4rem]">
            <a onClick={() => scrollToSection('about')} className="cursor-pointer hover:opacity-70 transition-opacity duration-200">About</a>
            <a onClick={() => scrollToSection('services')} className="cursor-pointer hover:opacity-70 transition-opacity duration-200">Services</a>
            <a href="https://chat.whatsapp.com/CVCvK4znqHA5ZYvwABdv43" target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:text-emerald-400 transition-colors duration-200 flex items-center gap-1">Community ↗</a>
          </nav>
        </FadeIn>

        {/* Massive Hero Heading */}
        <div className="w-full z-0 mt-6 sm:mt-4 md:-mt-5 text-center overflow-visible px-2 sm:px-4">
          <FadeIn delay={0.15} y={40} className="w-full flex justify-center">
            <h1 className="hero-heading font-black uppercase tracking-tight leading-none whitespace-nowrap text-[9.2vw] sm:text-[9.8vw] md:text-[10.2vw] lg:text-[10.6vw] xl:text-[11vw] w-full text-center select-none">
              hi, i'm noerax
            </h1>
          </FadeIn>
        </div>

        {/* Centered Absolute Hero Portrait with Magnet Mouse Tracker */}
        <div className="absolute left-1/2 -translate-x-1/2 z-10 w-[280px] sm:w-[360px] md:w-[440px] lg:w-[520px] top-1/2 -translate-y-1/2 sm:top-auto sm:translate-y-0 sm:bottom-0 pointer-events-auto">
          <FadeIn delay={0.6} y={30} className="w-full flex justify-center">
            <Magnet padding={150} strength={3} className="w-full">
              <img
                src="https://shrug-person-78902957.figma.site/_components/v2/d24c01ad3a56fc65e942a1f501eb73db42d7cf9a/Rectangle_40443.81459862.png"
                alt="Jack 3D Creator Portrait"
                className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
              />
            </Magnet>
          </FadeIn>
        </div>

        {/* Bottom Bar */}
        <div className="w-full flex justify-between items-end pb-7 sm:pb-8 md:pb-10 z-20 relative px-2 sm:px-4">
          {/* Left Community Link for Early Access */}
          <FadeIn delay={0.35} y={20}>
            <a
              href="https://chat.whatsapp.com/CVCvK4znqHA5ZYvwABdv43"
              target="_blank"
              rel="noopener noreferrer"
              className="group block text-[#D7E2EA] font-light uppercase tracking-wide leading-snug text-[clamp(0.75rem,1.4vw,1.5rem)] max-w-[180px] sm:max-w-[240px] md:max-w-[280px] hover:text-white transition-colors cursor-pointer"
            >
              <span className="block text-emerald-400 font-semibold text-[10px] sm:text-xs tracking-widest mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                WhatsApp Community
              </span>
              <span>Join community for early access</span>
              <span className="inline-block ml-1 text-white/80 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">↗</span>
            </a>
          </FadeIn>

          {/* Right Community Button */}
          <FadeIn delay={0.5} y={20}>
            <ContactButton
              label="Join Community"
              onClick={() => window.open('https://chat.whatsapp.com/CVCvK4znqHA5ZYvwABdv43', '_blank', 'noopener,noreferrer')}
            />
          </FadeIn>
        </div>
      </section>

      {/* ====================================================================
          2. MARQUEE SECTION
         ==================================================================== */}
      {/* ====================================================================
          2. MARQUEE SECTION (Local /media Folder Videos)
         ==================================================================== */}
      <section ref={marqueeRef} className="bg-[#0C0C0C] pt-24 sm:pt-32 md:pt-40 pb-10 overflow-hidden relative hardware-accelerated">
        {/* Row 1: First 4 Videos (Moves Right on Scroll) */}
        <div className="flex gap-4 mb-4 overflow-hidden" style={{ willChange: 'transform' }}>
          <div
            className="flex gap-4 shrink-0 transition-transform ease-out duration-75"
            style={{ transform: `translateX(${scrollOffset - 200}px)` }}
          >
            {[...MARQUEE_VIDEOS.slice(0, 4), ...MARQUEE_VIDEOS.slice(0, 4)].map((url, idx) => (
              <div key={idx} className="w-[280px] h-[180px] sm:w-[420px] sm:h-[270px] rounded-2xl overflow-hidden shrink-0 shadow-2xl border border-white/10 bg-[#18181b] relative">
                <video
                  src={url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Remaining 4 Videos (Moves Left on Scroll) */}
        <div className="flex gap-4 overflow-hidden" style={{ willChange: 'transform' }}>
          <div
            className="flex gap-4 shrink-0 transition-transform ease-out duration-75"
            style={{ transform: `translateX(${-(scrollOffset - 200)}px)` }}
          >
            {[...MARQUEE_VIDEOS.slice(4), ...MARQUEE_VIDEOS.slice(4)].map((url, idx) => (
              <div key={idx} className="w-[280px] h-[180px] sm:w-[420px] sm:h-[270px] rounded-2xl overflow-hidden shrink-0 shadow-2xl border border-white/10 bg-[#18181b] relative">
                <video
                  src={url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. ABOUT SECTION
         ==================================================================== */}
      <section id="about" className="min-h-screen flex flex-col items-center justify-center relative px-5 sm:px-8 md:px-10 py-20 overflow-hidden">
        
        {/* 4 Decorative 3D Corner Elements */}
        {/* Top-Left Moon Icon */}
        <FadeIn delay={0.1} x={-80} y={0} duration={0.9} className="absolute top-[4%] left-[1%] sm:left-[2%] md:left-[4%] z-0 pointer-events-none">
          <img
            src="https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/moon_icon.11395d36.png"
            alt="3D Moon Icon"
            className="w-[120px] sm:w-[160px] md:w-[210px] h-auto object-contain opacity-90"
          />
        </FadeIn>

        {/* Bottom-Left 3D Object */}
        <FadeIn delay={0.25} x={-80} y={0} duration={0.9} className="absolute bottom-[8%] left-[3%] sm:left-[6%] md:left-[10%] z-0 pointer-events-none">
          <img
            src="https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/p59_1.4659672e.png"
            alt="3D Sphere Object"
            className="w-[100px] sm:w-[140px] md:w-[180px] h-auto object-contain opacity-90"
          />
        </FadeIn>

        {/* Top-Right Lego Icon */}
        <FadeIn delay={0.15} x={80} y={0} duration={0.9} className="absolute top-[4%] right-[1%] sm:right-[2%] md:right-[4%] z-0 pointer-events-none">
          <img
            src="https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/lego_icon-1.703bb594.png"
            alt="3D Lego Icon"
            className="w-[120px] sm:w-[160px] md:w-[210px] h-auto object-contain opacity-90"
          />
        </FadeIn>

        {/* Bottom-Right 3D Group */}
        <FadeIn delay={0.3} x={80} y={0} duration={0.9} className="absolute bottom-[8%] right-[3%] sm:right-[6%] md:right-[10%] z-0 pointer-events-none">
          <img
            src="https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/Group_134-1.2e04f3ce.png"
            alt="3D Group Object"
            className="w-[130px] sm:w-[170px] md:w-[220px] h-auto object-contain opacity-90"
          />
        </FadeIn>

        {/* Content Container */}
        <div className="max-w-4xl text-center z-10 flex flex-col items-center gap-10 sm:gap-14 md:gap-16">
          <FadeIn delay={0} y={40}>
            <h2 className="hero-heading font-black uppercase leading-none tracking-tight text-[clamp(3rem,12vw,160px)]">
              About me
            </h2>
          </FadeIn>

          <div className="flex flex-col items-center gap-16 sm:gap-20 md:gap-24">
            <AnimatedText
              text="Noerax is a human-like conversational companion built to help you think clearly through hard decisions, emotional pressure, and life's noisy moments. Rooted in deep empathy, practical guidance, and timeless wisdom, Noerax listens to what you mean so you never have to carry things alone. Let's find clarity together!"
              className="text-[#D7E2EA] font-medium leading-relaxed max-w-[560px] text-[clamp(1rem,2vw,1.35rem)] text-center"
            />

            <FadeIn delay={0.2} y={20}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <ContactButton label="Talk to Noerax" onClick={() => window.location.href = '/chat'} />
                <a
                  href="https://chat.whatsapp.com/CVCvK4znqHA5ZYvwABdv43"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full px-8 py-3 sm:px-10 sm:py-3.5 md:px-12 md:py-4 border border-emerald-400/60 bg-emerald-500/10 text-emerald-300 font-medium uppercase tracking-widest text-xs sm:text-sm md:text-base hover:bg-emerald-500/25 transition-all duration-300 transform active:scale-95 shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <span>Join Community</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. SERVICES SECTION
         ==================================================================== */}
      <section id="services" className="bg-white text-[#0C0C0C] rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32 relative z-10">
        <div className="max-w-5xl mx-auto">
          
          <h2 className="font-black uppercase text-center text-[clamp(3rem,12vw,160px)] mb-16 sm:mb-20 md:mb-28 leading-none tracking-tight">
            Services
          </h2>

          <div className="divide-y divide-[rgba(12,12,12,0.15)] border-t border-b border-[rgba(12,12,12,0.15)]">
            {[
              {
                num: "01",
                name: "Think Before Responding",
                desc: "Understands your situation, context, and what you actually mean before giving an answer. It doesn't just react to your words — it thinks through the situation first."
              },
              {
                num: "02",
                name: "Understand Emotions",
                desc: "Picks up on the emotions behind your words, even when you don't directly say how you feel. It responds based on what you're actually experiencing, not just what you typed."
              },
              {
                num: "03",
                name: "Expresses Emotions",
                desc: "Communicates with natural emotional expression instead of sounding robotic or emotionless. Its tone can feel supportive, excited, curious, serious, or playful depending on the conversation."
              },
              {
                num: "04",
                name: "Remembers You",
                desc: "Remembers important details from your previous conversations and the context you've shared. So every conversation doesn't feel like starting over with a stranger."
              }
            ].map((service, i) => (
              <FadeIn key={service.num} delay={i * 0.1} y={20} className="py-8 sm:py-10 md:py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-12">
                <span className="font-black text-[clamp(3rem,10vw,140px)] text-[#0C0C0C] leading-none shrink-0 min-w-[120px]">
                  {service.num}
                </span>

                <div className="flex-1 space-y-2">
                  <h3 className="font-medium uppercase text-[clamp(1rem,2.2vw,2.1rem)] text-[#0C0C0C] tracking-wide">
                    {service.name}
                  </h3>
                  <p className="font-light leading-relaxed max-w-2xl text-[clamp(0.85rem,1.6vw,1.25rem)] opacity-60">
                    {service.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}
