import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp, Sparkles, Mic, MicOff, Compass, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { MarqueeBar } from "../ui/MarqueeBar";

const MARQUEE_WORDS = [
  "Clarity", "Purpose", "Noerax", "Flow", "Stillness",
  "Mindfulness", "Presence", "Equanimity", "Awakening", "Balance",
];

const ROTATING_PROMPTS = [
  "What does the Gita say about overthinking & focus?",
  "How do I practice Nishkama Karma (detached action)?",
  "How to navigate a high-stakes career crossroads?",
  "How to master emotional discipline & mental stillness?",
  "What do ancient scriptures teach about finding your purpose?",
  "What decision or situation are you trying to figure out today?",
];

const CAPSULE_TOPICS = [
  { label: "Talk with Noerax", prompt: "Namaste Noerax, I'd like your guidance on what's on my mind today." },
  { label: "Overthinking & Focus", prompt: "What does timeless wisdom say about dealing with overthinking and regaining focus?" },
  { label: "Career & Purpose", prompt: "How do ancient teachings guide someone through a hard career crossroads and finding purpose?" },
  { label: "Detached Action", prompt: "How can I practice detached action (Nishkama Karma) in modern work and daily life?" },
  { label: "Inner Calm", prompt: "Guide me through finding emotional stillness and inner peace amidst daily stress." },
  { label: "Explore Library →", isLink: true, href: "#library" },
];

export function ChatbotHero() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [input, setInput] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  // Rotate placeholder questions every 3.8s when user hasn't typed anything
  useEffect(() => {
    if (input.trim() || isFocused) return;
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % ROTATING_PROMPTS.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [input, isFocused]);

  // Handle input change with auto-growth
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 60), 220)}px`;
    }
  };

  // Submit prompt: sends to /chat or prompts login
  const handleSubmit = (customText?: string) => {
    const textToSend = (customText || input.trim() || ROTATING_PROMPTS[promptIndex]).trim();
    if (!textToSend) return;

    // Save prompt to sessionStorage
    sessionStorage.setItem("pending_chat_prompt", textToSend);

    if (!user) {
      navigate("/auth?redirect=/chat");
    } else {
      navigate("/chat");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Toggle voice dictation
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Google Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    }
  };

  const handlePillClick = (item: typeof CAPSULE_TOPICS[0]) => {
    if (item.isLink) {
      const el = document.getElementById("library") || document.getElementById("guides");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate("/#library");
      }
      return;
    }
    handleSubmit(item.prompt);
  };

  return (
    <section
      id="chatbot"
      className="relative w-full min-h-[85vh] sm:min-h-[88vh] flex flex-col justify-center items-center bg-[#000000] text-white font-sans selection:bg-white/20 selection:text-white overflow-hidden pt-28 sm:pt-36 pb-16 sm:pb-20"
    >
      {/* Subtle Ambient Radial Glow (Clean Dark Aesthetic) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[550px] bg-gradient-to-b from-white/[0.04] via-dharma-flame/[0.015] to-transparent blur-[140px] pointer-events-none rounded-full" />

      {/* Main Centered Content */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-6 max-w-5xl mx-auto">
        
        {/* Main Headline — Exactly like OpenAI: "What can I help with?" */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-7 sm:mb-9"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] font-semibold text-white tracking-[-0.025em] font-sans">
            What can I help with?
          </h1>
        </motion.div>

        {/* Large Chat Input Container — Styled after OpenAI's Prompt Bar */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="w-full max-w-[740px]"
        >
          <div
            onClick={() => textareaRef.current?.focus()}
            className={`relative rounded-[26px] sm:rounded-[28px] bg-[#1e1e21] border transition-all duration-300 shadow-[0_16px_48px_rgba(0,0,0,0.6)] cursor-text flex flex-col ${
              isFocused
                ? "border-white/30 shadow-[0_16px_56px_rgba(255,255,255,0.06)] ring-1 ring-white/10"
                : "border-white/[0.1] hover:border-white/[0.18]"
            }`}
          >
            {/* Textarea Area */}
            <div className="relative w-full pt-4 sm:pt-5 px-5 sm:px-6">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                rows={2}
                className="w-full bg-transparent border-none text-white text-base sm:text-[17px] font-sans leading-relaxed resize-none focus:outline-none placeholder-transparent select-text"
              />

              {/* Dynamic Animated Placeholder when empty */}
              {!input && (
                <div className="absolute top-4 sm:top-5 left-5 sm:left-6 right-5 sm:right-6 pointer-events-none select-none overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={promptIndex}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 0.45, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="text-white text-base sm:text-[17px] font-sans leading-relaxed truncate"
                    >
                      {ROTATING_PROMPTS[promptIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Bottom Controls Row inside the Box */}
            <div className="px-4 sm:px-5 pb-3.5 sm:pb-4 pt-1 flex items-center justify-between pointer-events-auto">
              {/* Left Utilities */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleListening();
                  }}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    isListening
                      ? "bg-red-500/20 text-red-400 animate-pulse"
                      : "text-white/40 hover:text-white hover:bg-white/[0.06]"
                  }`}
                  title={isListening ? "Stop Listening" : "Voice Dictation"}
                >
                  {isListening ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
                </button>

                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/40 text-xs select-none">
                  <Sparkles className="w-3 h-3 text-dharma-flame" />
                  <span>Noerax Guide</span>
                </div>
              </div>

              {/* Right Send Button — Up Arrow inside circle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmit();
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  input.trim()
                    ? "bg-white text-black hover:bg-neutral-200 active:scale-95 shadow-md"
                    : "bg-white/[0.08] text-white/40 hover:bg-white/[0.15] hover:text-white"
                }`}
                title="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Capsule Topics Row below prompt box — OpenAI Style Pills */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-6 sm:mt-7 max-w-3xl"
        >
          {CAPSULE_TOPICS.map((topic, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handlePillClick(topic)}
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 text-white/70 hover:text-white text-xs sm:text-[13px] font-medium transition-all duration-150 cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <span>{topic.label}</span>
            </button>
          ))}
        </motion.div>

      </div>
    </section>
  );
}

// 4 Fullscreen Background Videos for Cinematic Hero
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
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: delay + i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ display: "inline-block", marginRight: "0.3em" }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// Section 2: Previous First Section (Cinematic Video Hero)
export function CinematicHero() {
  const navigate = useNavigate();
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
      {/* 1. BACKGROUND VIDEO LAYER */}
      {VIDEOS.map((vid, idx) => (
        <video
          key={vid.id}
          autoPlay={activeVideo === idx}
          muted
          loop
          playsInline
          preload={activeVideo === idx || (activeVideo + 1) % VIDEOS.length === idx ? "metadata" : "none"}
          src={vid.url}
          style={{ willChange: "opacity, transform" }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            activeVideo === idx ? "opacity-100 z-0" : "opacity-0 -z-10 pointer-events-none"
          }`}
        />
      ))}

      {/* 2. TRANSPARENT PNG OVERLAY */}
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
        <img
          src="https://soft-zoom-63098134.figma.site/_assets/v11/0b4a435b2df2747593c43d7a1c9b4578f7d8d90c.png"
          alt="Cinematic Overlay"
          className="w-full h-full object-cover animate-train-bob"
        />
      </div>

      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-black/90 z-[1] pointer-events-none" />

      {/* 3. CONTENT LAYER */}
      <div className="relative z-[2] w-full flex-1 flex flex-col justify-between px-4 sm:px-8 md:px-12 pt-20 sm:pt-24 pb-2">
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto py-2 px-2">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-4 sm:mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-dharma-flame/30 bg-dharma-flame/10 text-dharma-flame text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-dharma-flame animate-pulse" />
              The Digital Sanctuary
            </span>
          </motion.div>

          {/* Headline */}
          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight tracking-tight mb-4 max-w-4xl">
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
          </h2>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl text-dharma-ivory-dim max-w-2xl leading-relaxed mb-6 sm:mb-8 font-light"
          >
            Real frameworks for real decisions.<br />
            <span className="text-dharma-flame font-medium">Not therapy. Not religion.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 w-full sm:w-auto pt-2"
          >
            {/* Primary Start Learning Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                const el = document.getElementById("library") || document.getElementById("guides") || document.getElementById("struggles");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                } else {
                  navigate("/#library");
                }
              }}
              className="btn-liquid-primary w-full sm:w-auto min-h-[48px] h-[48px] px-8 text-sm flex items-center justify-center gap-2"
            >
              Start Learning <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            {/* Secondary Explore AI Companion Button */}
            <div className="relative group w-full sm:w-auto flex items-center">
              <span className="absolute -top-3.5 -left-2 z-10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-black bg-gradient-to-r from-cyan-400 to-sky-300 rounded-md shadow-md -rotate-6 group-hover:rotate-0 transition-transform duration-300 pointer-events-none">
                NEW
              </span>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/ai-companion")}
                className="btn-liquid-secondary w-full sm:w-auto min-h-[48px] h-[48px] px-7 text-sm flex items-center justify-center gap-2"
              >
                <span className="sleek-mvp-text">Explore AI Companion</span>
              </motion.button>

              <span className="absolute -top-3.5 -right-2 z-10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 rounded-md shadow-md rotate-6 group-hover:rotate-0 transition-transform duration-300 pointer-events-none">
                COMING SOON
              </span>
            </div>
          </motion.div>

          {/* Social Proof Pill */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-4"
          >
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-dharma-ink-2 border border-dharma-line-dark shadow-md">
              <div className="flex -space-x-1.5">
                {["A", "K", "P", "J", "M"].map((l, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-full border-2 border-dharma-ink-2 flex items-center justify-center text-[9px] font-bold text-white bg-gradient-to-br ${
                      [
                        "from-orange-500 to-amber-500",
                        "from-pink-500 to-rose-500",
                        "from-emerald-500 to-teal-500",
                        "from-blue-500 to-indigo-500",
                        "from-violet-500 to-purple-500",
                      ][i]
                    }`}
                  >
                    {l}
                  </div>
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

        {/* BOTTOM MARQUEE BAR */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 1 }}
          className="w-full border-t border-dharma-line-dark pt-3 pb-1 bg-dharma-ink/80 backdrop-blur-sm"
        >
          <MarqueeBar items={MARQUEE_WORDS} speed={30} />
        </motion.footer>
      </div>
    </section>
  );
}

// Default export renders Section 1 (ChatbotHero) + Section 2 (CinematicHero)
export function Hero() {
  return (
    <>
      <ChatbotHero />
      <CinematicHero />
    </>
  );
}

