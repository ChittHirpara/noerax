import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

const CARD_VIDEOS = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_030111_a9e15665-d379-4a7f-8116-695bbe452ad1.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_171347_f640c30d-ec21-426a-98bc-77e07c2c60cb.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_104800_bc43ae09-f494-43e3-97d7-2f8c1692cfd7.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_115655_b4d9cd77-feed-43cd-a198-af78ebdf1f7a.mp4',
];

const CARD_DETAILS = [
  {
    quote: "every other app just tells you to breathe. noerax actually explains WHY you're stressed and what to do about it. finally.",
    name: "James T.",
    location: "London, UK",
    platform: "𝕏 Twitter",
    avatar: "J",
    color: "from-blue-500 to-purple-500",
    brand: "NOERAX PRIME",
    handle: "@jamest_ldn",
    id: "VERIFIED SEEKER #0041"
  },
  {
    quote: "my anxiety spirals used to last 3 hours minimum. noerax cuts it to like 20 minutes now. not even joking.",
    name: "Priya M.",
    location: "Bangalore, India",
    platform: "◎ Instagram",
    avatar: "P",
    color: "from-emerald-500 to-teal-500",
    brand: "NOERAX CLARITY",
    handle: "@priya_m_blr",
    id: "VERIFIED SEEKER #0128"
  },
  {
    quote: "i'm not spiritual at all but the gita explanations actually make sense?? never thought 5000 year old advice would slap this hard",
    name: "Karan B.",
    location: "Delhi, India",
    platform: "𝕏 Twitter",
    avatar: "K",
    color: "from-pink-500 to-rose-500",
    brand: "NOERAX WISDOM",
    handle: "@karan_b_delhi",
    id: "VERIFIED SEEKER #0089"
  },
  {
    quote: "the journal feature caught patterns about myself that took me 2 years of therapy to understand. it's genuinely different.",
    name: "Maya L.",
    location: "Toronto, Canada",
    platform: "✦ WhatsApp",
    avatar: "M",
    color: "from-violet-500 to-indigo-500",
    brand: "NOERAX FOCUS",
    handle: "@maya_l_to",
    id: "VERIFIED SEEKER #0312"
  },
  {
    quote: "bro i told noerax i was scared to talk to my dad for 3 years. it gave me an actual script. the conversation happened. it worked.",
    name: "Aryan S.",
    location: "Mumbai, India",
    platform: "✦ WhatsApp",
    avatar: "A",
    color: "from-orange-500 to-yellow-500",
    brand: "NOERAX SCRIPT",
    handle: "@aryan_s_bom",
    id: "VERIFIED SEEKER #0054"
  },
];

export function Testimonials() {
  const cardCount = 5;
  const cardsRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frameId = useRef<number>(0);
  
  // Continuous scroll progress
  const progress = useRef<number>(0);

  // Track mouse coordinates for interactive 3D parallax tilt with inertia damping
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Responsive state containing card dimensions
  const [metrics, setMetrics] = useState({
    cardW: 360,
    cardH: 226, // 1.59 standard credit card ratio
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const ry = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      mouse.current.targetX = Math.max(-1, Math.min(1, rx));
      mouse.current.targetY = Math.max(-1, Math.min(1, ry));
    };

    const handleMouseLeave = () => {
      mouse.current.targetX = 0;
      mouse.current.targetY = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      let cardW = Math.round(w * 0.18 + 150);
      cardW = Math.min(380, Math.max(260, cardW));
      const cardH = Math.round(cardW / 1.5925);
      setMetrics({ cardW, cardH });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute 3D Horizontal cylinder position & rotations at 60fps
  const renderLoop = () => {
    // Horizontal flow speed (increased for faster continuous 3D rotation)
    progress.current += 0.0045;

    // Inertia damping logic
    mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.08;
    mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.08;

    const cards = cardsRefs.current;
    const w = window.innerWidth;
    const { cardW } = metrics;

    const continuousProgress = progress.current;
    const roundedIndex = Math.round(continuousProgress);
    const diffFromRound = continuousProgress - roundedIndex; // [-0.5, 0.5]
    
    // Non-linear magnetic step logic with brief center pause
    const easedDiff = Math.sign(diffFromRound) * Math.pow(Math.abs(diffFromRound) * 2, 4.2) / 2;
    const virtualActiveIndex = roundedIndex + easedDiff;

    for (let i = 0; i < cardCount; i++) {
      const card = cards[i];
      if (!card) continue;

      let offset = i - virtualActiveIndex;
      const halfCount = cardCount / 2;
      while (offset > halfCount) offset -= cardCount;
      while (offset < -halfCount) offset += cardCount;

      const absOffset = Math.abs(offset);
      const sign = Math.sign(offset);

      if (absOffset > 3.0) {
        card.style.visibility = 'hidden';
        continue;
      } else {
        card.style.visibility = 'visible';
      }

      const gap = 48;
      const peekAmount = -60; // Push peeking edge past screen boundary
      const D = 1350; // Perspective distance

      let x = 0;
      let z = 0;
      let rot = 0;

      if (absOffset <= 1) {
        // Smoothstep 0 to 1 (Center card to adjacent)
        const t = absOffset;
        const easedT = t * t * (3 - 2 * t);

        const targetX = cardW + gap;
        x = sign * (easedT * targetX);
        z = 400 + easedT * (220 - 400);
        rot = easedT * 128;
      } else if (absOffset <= 2) {
        // Smoothstep 1 to 2 (Adjacent to peeking edge)
        const t = absOffset - 1;
        const easedT = t * t * (3 - 2 * t);

        const xStart = cardW + gap;
        const zStart = 220;
        const rotStart = 128;

        const zEnd = -60;
        const rotEnd = 170;

        const sEnd = D / (D - zEnd);
        const xEnd = (w / 2 - peekAmount) / sEnd - (cardW / 2);

        const currentX = xStart + easedT * (xEnd - xStart);
        x = sign * currentX;

        z = zStart + easedT * (zEnd - zStart);
        rot = rotStart + easedT * (rotEnd - rotStart);
      } else {
        // Smoothstep 2 to 3 (Peeking to offscreen)
        const t = Math.min(absOffset - 2, 1);
        const easedT = t * t * (3 - 2 * t);

        const zStart = -60;
        const rotStart = 170;
        const zEnd3 = -250;
        const rotEnd3 = 195;

        const sEnd2 = D / (D - zStart);
        const xEnd2 = (w / 2 - peekAmount) / sEnd2 - (cardW / 2);

        const sEnd3 = D / (D - zEnd3);
        const xEnd3 = (w / 2 + 120) / sEnd3 + (cardW / 2);

        const currentX = xEnd2 + easedT * (xEnd3 - xEnd2);
        x = sign * currentX;

        z = zStart + easedT * (zEnd3 - zStart);
        rot = rotStart + easedT * (rotEnd3 - rotStart);
      }

      const localCardRotation = -sign * rot;
      const centerFactor = Math.max(0, 1 - absOffset);

      const maxTiltY = 16;
      const maxTiltX = 14;

      const activeTiltX = -mouse.current.y * maxTiltX * centerFactor;
      const activeTiltY = mouse.current.x * maxTiltY * centerFactor;

      const totalRotY = localCardRotation + activeTiltY;
      const totalRotX = activeTiltX;

      card.style.zIndex = Math.round(z).toString();
      card.style.opacity = '1';

      // Inject 3D translation matrix for horizontal cylinder rotation
      card.style.transform = `translateX(${x.toFixed(2)}px) translateZ(${z.toFixed(2)}px) rotateY(${totalRotY.toFixed(2)}deg) rotateX(${totalRotX.toFixed(2)}deg)`;
    }
  };

  useEffect(() => {
    const tick = () => {
      renderLoop();
      frameId.current = requestAnimationFrame(tick);
    };

    frameId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId.current);
  }, [metrics]);

  // Slices for 3D volumetric depth layer stacking
  const thicknessLayers = [-1.47, -0.73, 0, 0.73, 1.47];

  return (
    <section id="testimonials" className="relative w-full bg-[#000000] text-white py-24 sm:py-32 overflow-hidden border-t border-white/10 select-none">
      
      {/* Centered Header Block */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 text-center mb-12 sm:mb-16 relative z-30">
        <span className="inline-block text-xs font-semibold uppercase tracking-[2px] mb-4 bg-gradient-to-r from-[#F5C344] via-[#F28482] to-[#B567C2] bg-clip-text text-transparent select-none">
          COMMUNITY VOICES
        </span>
        <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white mb-4 leading-tight">
          Loved by seekers <span className="font-serif italic bg-gradient-to-r from-sky-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">everywhere.</span>
        </h2>
        <p className="text-white/60 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Thousands of Gen Z seekers finding clarity, purpose, and peace through Noerax daily.
        </p>
      </div>

      {/* 3D Perspective Stage Container */}
      <div className="relative w-full h-[320px] sm:h-[380px] flex items-center justify-center">
        
        {/* 3D perspective camera space */}
        <div
          className="relative w-full h-full flex items-center justify-center pointer-events-none"
          style={{ perspective: '1350px' }}
        >
          {/* Dynamic 3D coordinate viewport */}
          <div
            className="absolute"
            style={{
              width: `${metrics.cardW}px`,
              height: `${metrics.cardH}px`,
              transformStyle: 'preserve-3d',
            }}
          >
            {Array.from({ length: cardCount }).map((_, i) => (
              <div
                key={i}
                ref={(el) => { cardsRefs.current[i] = el; }}
                className="absolute inset-0"
                style={{
                  width: `${metrics.cardW}px`,
                  height: `${metrics.cardH}px`,
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'visible',
                }}
              >
                {/* Dense parallel volumetric thickness slicing */}
                {thicknessLayers.map((zOffset, layerIdx) => {
                  const isFrontFace = layerIdx === thicknessLayers.length - 1;
                  const isBackFace = layerIdx === 0;

                  const videoSrc = CARD_VIDEOS[i % CARD_VIDEOS.length];
                  const details = CARD_DETAILS[i % CARD_DETAILS.length];

                  // Middle structural slice
                  if (!isFrontFace && !isBackFace) {
                    return (
                      <div
                        key={layerIdx}
                        className="absolute inset-0 rounded-[20px] border border-[#808080] pointer-events-none overflow-hidden"
                        style={{
                          backgroundColor: '#808080',
                          transform: `translateZ(${zOffset}px)`,
                        }}
                      />
                    );
                  }

                  // Front face slice (Seeker Review Card)
                  if (isFrontFace) {
                    return (
                      <div
                        key={layerIdx}
                        className="absolute inset-0 rounded-[20px] border border-white/20 pointer-events-none overflow-hidden bg-[#0a0a0c]"
                        style={{
                          transform: `translateZ(${zOffset}px)`,
                          backfaceVisibility: 'hidden',
                          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), 0 20px 50px rgba(0,0,0,0.85)',
                        }}
                      >
                        {/* Video Background */}
                        <video
                          src={videoSrc}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover rounded-[20px]"
                        />

                        {/* Dark Glass Overlay */}
                        <div className="absolute inset-0 p-5 sm:p-6 text-white h-full w-full font-sans z-10 bg-black/60 backdrop-blur-[3px] flex flex-col justify-between">
                          
                          {/* Top Row: Stars + Platform Badge */}
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1 text-[#F5C344] text-xs sm:text-sm">
                              {Array(5).fill(0).map((_, idx) => (
                                <span key={idx}>★</span>
                              ))}
                            </div>

                            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/70 border border-white/20 text-white/90 backdrop-blur-md">
                              {details.platform}
                            </span>
                          </div>

                          {/* Middle: Review Quote */}
                          <p className="text-white/95 text-xs sm:text-[13px] leading-relaxed font-sans tracking-tight line-clamp-3">
                            "{details.quote}"
                          </p>

                          {/* Bottom Row: User Avatar + Name + Location */}
                          <div className="flex items-center gap-2.5 pt-2.5 border-t border-white/15">
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br ${details.color} flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-md ring-1 ring-white/30`}>
                              {details.avatar}
                            </div>
                            <div className="flex flex-col">
                              <h4 className="text-white font-semibold text-xs leading-none mb-0.5">{details.name}</h4>
                              <p className="text-white/50 text-[10px] font-mono leading-none">{details.location}</p>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  }

                  // Back face slice (Verified Seeker Badge & Handle)
                  if (isBackFace) {
                    return (
                      <div
                        key={layerIdx}
                        className="absolute inset-0 rounded-[20px] border border-white/20 pointer-events-none overflow-hidden bg-[#0a0a0c]"
                        style={{
                          transform: `translateZ(${zOffset}px) rotateY(180deg)`,
                          backfaceVisibility: 'hidden',
                          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)',
                        }}
                      >
                        {/* Blurred Video Background */}
                        <div className="absolute inset-0 pointer-events-none" style={{ filter: 'blur(16px)', transform: 'scale(1.15)' }}>
                          <video
                            src={videoSrc}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>

                        {/* Top Glass Stripe */}
                        <div className="absolute left-0 right-0 top-4 sm:top-5 h-7 sm:h-8 bg-black/80 backdrop-blur-md z-10 flex items-center justify-between px-4 sm:px-5">
                          <span className="text-[9px] font-mono tracking-widest text-sky-300 font-bold uppercase">
                            {details.brand}
                          </span>
                          <span className="text-[9px] font-mono text-white/50">
                            {details.id}
                          </span>
                        </div>

                        {/* Seeker Details */}
                        <div 
                          className="absolute left-4 sm:left-6 bottom-4 sm:bottom-5 z-20 flex flex-col gap-1 text-left font-mono"
                        >
                          <div className="text-xs sm:text-sm font-semibold tracking-wider text-white select-none">
                            {details.handle}
                          </div>
                          <div className="text-[8px] sm:text-[10px] font-medium text-white/70 tracking-wide flex items-center gap-2 select-none">
                            <span className="uppercase">{details.name}</span>
                            <span className="text-emerald-400 font-bold">✓ VERIFIED</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
