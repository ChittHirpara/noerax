import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, Instagram, Linkedin, X, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import noeraxLogo from "../../assets/noerax-logo.png";

export function Footer() {
  const navigate = useNavigate();
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [timeString, setTimeString] = useState("");

  // Live 24-hour clock (CUP / IST time)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(now);
      setTimeString(`IST ${formatted}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { num: "01", label: "AI COMPANION", path: "/ai-companion" },
    { num: "02", label: "FRAMEWORKS", target: "features" },
    { num: "03", label: "DIGITAL SANCTUARY", target: "home" },
    { num: "04", label: "DAILY CARD", path: "/daily-card" },
  ];

  const handleNavClick = (link: { num: string; label: string; path?: string; target?: string }) => {
    if (link.path) {
      navigate(link.path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (link.target) {
      const el = document.getElementById(link.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative bg-black text-white font-sans overflow-hidden border-t border-white/20 rounded-t-[3.5rem] sm:rounded-t-[5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.9)] pt-14 sm:pt-20 pb-8 mt-12">
      
      {/* Background Video Layer */}
      <video
        autoPlay
        muted
        loop
        playsInline
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081127_0992a171-d3c6-4978-8213-0ec5df8b6d63.mp4"
        className="absolute inset-0 w-full h-full object-cover opacity-75 z-0 pointer-events-none"
      />

      {/* Train Window Train-Bob Motion Overlay */}
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden opacity-90">
        <img
          src="https://soft-zoom-63098134.figma.site/_assets/v11/0b4a435b2df2747593c43d7a1c9b4578f7d8d90c.png"
          alt="Train Window Overlay"
          className="w-full h-full object-cover animate-train-bob"
        />
      </div>

      {/* Subtle Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60 z-[1] pointer-events-none" />

      {/* Background ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#F598F2]/5 blur-[160px] pointer-events-none rounded-full" />

      {/* Main Container (max-width 1340px) */}
      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 md:px-8 relative z-10 flex flex-col justify-between gap-12 md:gap-16">
        
        {/* ==================================================================
            1. TOP HEADER BAR: Live Clock, Support Email & Availability Dot
           ================================================================== */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          {/* Availability Indicator */}
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-dot-pulse absolute inline-flex h-full w-full rounded-full bg-[#F598F2] opacity-75 shadow-[0_0_10px_#F598F2]" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F598F2]" />
            </span>
            <span className="text-xs sm:text-sm text-white/80 font-medium tracking-tight">
              Available for guidance & Gen Z partnerships
            </span>
          </div>

          {/* Right: Contact Email & Live Clock */}
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-white/70 font-mono tracking-tight">
            <a
              href="mailto:nancykushwah768@gmail.com"
              className="hover:text-[#F598F2] transition-colors font-sans font-medium"
            >
              nancykushwah768@gmail.com
            </a>
            <span className="text-white/20">|</span>
            <span className="text-white/90 font-medium">
              {timeString || "IST 00:00:00"}
            </span>
          </div>
        </div>

        {/* ==================================================================
            2. MAIN 4-COLUMN LINKS & BRANDING SECTION
           ================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-10 py-2 border-b border-white/10">
          
          {/* Column 1 & 2: Brand Logo, Tagline, Social Icons & CTA Button */}
          <div className="lg:col-span-2 flex flex-col items-start gap-4">
            <img src={noeraxLogo} alt="Noerax Logo" className="h-12 sm:h-14 w-auto object-contain -ml-2" />
            <p className="text-xs sm:text-sm text-dharma-ivory-dim max-w-sm leading-relaxed font-light">
              Ancient wisdom translated for the modern mind.<br />
              Find clarity in the chaos of the digital age.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-1">
              <button
                onClick={() => navigate('/chat')}
                className="btn-fill-hover inline-flex items-center gap-2 px-5 py-2.5 border border-white text-white rounded-full text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer shadow-md"
              >
                <span>start a conversation</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              
              <div className="flex items-center gap-2">
                <a
                  href="https://www.instagram.com/noerax.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-[#F598F2] hover:bg-[#F598F2]/10 transition-all cursor-pointer shadow-sm"
                  title="Instagram"
                >
                  <Instagram className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://www.linkedin.com/company/dharmax-ai/"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-[#F598F2] hover:bg-[#F598F2]/10 transition-all cursor-pointer shadow-sm"
                  title="LinkedIn"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 3: PLATFORM */}
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-white/50 font-semibold mb-3">
              PLATFORM
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-dharma-ivory-dim">
              <li>
                <button onClick={() => scrollToSection('home')} className="hover:text-white transition-colors cursor-pointer">
                  Philosophy
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('library')} className="hover:text-white transition-colors cursor-pointer">
                  Library
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('journal')} className="hover:text-white transition-colors cursor-pointer">
                  Notes
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors cursor-pointer">
                  Features
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: RESOURCES */}
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-white/50 font-semibold mb-3">
              RESOURCES
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-dharma-ivory-dim">
              <li>
                <button onClick={() => navigate('/ai-companion')} className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5">
                  AI Companion <span className="px-1 py-0.2 text-[8px] font-black uppercase text-black bg-cyan-300 rounded">NEW</span>
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors cursor-pointer">
                  Frameworks
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/daily-card')} className="hover:text-white transition-colors cursor-pointer">
                  Daily Card
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: COMPANY */}
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-white/50 font-semibold mb-3">
              COMPANY
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-dharma-ivory-dim">
              <li>
                <button onClick={() => scrollToSection('home')} className="hover:text-white transition-colors cursor-pointer">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => setLegalModal('privacy')} className="hover:text-white transition-colors cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => setLegalModal('terms')} className="hover:text-white transition-colors cursor-pointer">
                  Terms of Service
                </button>
              </li>
              <li>
                <a href="mailto:nancykushwah768@gmail.com" className="hover:text-white transition-colors cursor-pointer">
                  Contact
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* ==================================================================
            3. COMPACT GIANT TITLE & COPYRIGHT BAR
           ================================================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          
          {/* Sleek Compact Brand Name */}
          <div className="flex items-baseline">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold uppercase text-white tracking-tight select-none">
              NOERAX<span className="text-[#F598F2] drop-shadow-[0_0_12px_rgba(245,152,242,0.9)]">.</span>
            </h1>
          </div>

          {/* Legal Links & Copyright */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-5 text-xs text-white/50">
            <button
              onClick={() => setLegalModal('privacy')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setLegalModal('terms')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <span>&copy; {new Date().getFullYear()} NOERAX. ALL RIGHTS RESERVED.</span>
          </div>

        </div>

      </div>

      {/* ====================================================================
          LEGAL MODAL (Privacy Policy & Terms of Service)
         ==================================================================== */}
      <AnimatePresence>
        {legalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
            onClick={() => setLegalModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0C0C0C] text-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl border border-white/10 relative my-8 max-h-[80vh] overflow-y-auto"
            >
              <button
                onClick={() => setLegalModal(null)}
                className="absolute top-5 right-5 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="w-6 h-6 text-[#F598F2]" />
                <h2 className="text-2xl font-semibold tracking-tight">
                  {legalModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
                </h2>
              </div>

              {legalModal === 'privacy' ? (
                <div className="space-y-4 text-sm text-white/70 leading-relaxed">
                  <p>At <strong>Noerax</strong>, your privacy is deeply respected. We process your data to deliver AI guidance, emotional reflections, and store your daily progress securely.</p>
                  <h4 className="text-white font-semibold text-base mt-4">1. Information We Collect</h4>
                  <p>We collect your account credentials, preferences, and chat reflections. All data is encrypted via standard JWT and secure HTTPS protocols.</p>
                  <h4 className="text-white font-semibold text-base mt-4">2. AI Engine Usage</h4>
                  <p>Your chat reflections are processed via secure server-to-server API calls to Gemini AI. We do not sell your personal data or reflections to third parties.</p>
                  <h4 className="text-white font-semibold text-base mt-4">3. Account Control</h4>
                  <p>You may request full deletion of your account and stored data at any time by contacting nancykushwah768@gmail.com.</p>
                </div>
              ) : (
                <div className="space-y-4 text-sm text-white/70 leading-relaxed">
                  <p>Welcome to <strong>Noerax</strong>. By accessing our platform, you agree to these Terms of Service.</p>
                  <h4 className="text-white font-semibold text-base mt-4">1. AI Guidance Disclaimer</h4>
                  <p>Noerax provides philosophical insights, decision frameworks, and AI reflection tools. It is not a replacement for professional medical advice or clinical mental health therapy.</p>
                  <h4 className="text-white font-semibold text-base mt-4">2. User Conduct</h4>
                  <p>You agree to use Noerax for lawful purposes and refrain from submitting harmful, illegal, or abusive content to our AI engines.</p>
                  <h4 className="text-white font-semibold text-base mt-4">3. Intellectual Property</h4>
                  <p>All design assets, code, and proprietary algorithms belong to Noerax Inc.</p>
                </div>
              )}

              <button
                onClick={() => setLegalModal(null)}
                className="w-full py-3 bg-[#F598F2] text-black font-semibold rounded-xl mt-8 hover:bg-pink-300 transition-colors cursor-pointer"
              >
                I Understand
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </footer>
  );
}
