import { motion, AnimatePresence } from "motion/react";
import { Send, User, Sparkles, Loader2, RotateCcw, Maximize2, CheckCircle2 } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const SUGGESTED = [
  "Why do I overthink every small thing?",
  "What if I make the wrong decision?",
  "What if nothing works out?",
  "How do I make the first move?",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-5 py-4">
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay }}
          className="w-2 h-2 rounded-full bg-dharma-flame/80"
        />
      ))}
    </div>
  );
}

export function ChatPreview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hey there! ✨ What are you trying to figure out today?\n\nTell me whatever decision, situation, or feelings are on your mind — I'm right here with you. 🤍" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length > 1 && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length, isLoading]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMsg: Message = { role: 'user', content: messageText };
    const history = messages.filter(m => m.role === 'user' || m.role === 'ai');

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, history }),
      });

      if (!response.ok) throw new Error('Failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';

      setMessages(prev => [...prev, { role: 'ai', content: '' }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                aiContent += data.text;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'ai', content: aiContent };
                  return updated;
                });
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'ai', content: "Here is a gentle perspective to center yourself: ✨\n\n1. Take a slow, deep breath. 🌿\n2. Ask what you'd say to a close friend facing this exact moment.\n3. Remember you don't have to solve everything today — just focus on one small next step. 🤍" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reset = () => {
    setMessages([{ role: 'ai', content: "Hey there! ✨ What are you trying to figure out today?\n\nTell me whatever decision, situation, or feelings are on your mind — I'm right here with you. 🤍" }]);
    setInput('');
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      id="guides"
      className="py-24 sm:py-32 bg-[#060608] relative overflow-hidden text-white"
    >
      {/* Background Video Layer - Vivid & Clear */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-85 scale-100"
        />
        {/* Soft Edge Blending Masks */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060608] via-transparent to-[#060608]" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Glowing Backlight Orbs */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-dharma-flame/15 blur-[180px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-purple-600/10 blur-[180px] pointer-events-none rounded-full" />

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left: Highlighted Copy with Pop-in Animations */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-5"
          >
            {/* Pop-in Highlight Badge */}
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dharma-flame/20 border border-dharma-flame/40 text-dharma-flame text-xs font-bold tracking-widest uppercase mb-6 shadow-lg shadow-dharma-flame/10 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 animate-spin-slow" /> HUMAN-LIKE WISDOM GUIDE
            </motion.span>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-serif text-3xl sm:text-5xl md:text-6xl text-white mb-6 leading-[1.1] tracking-tight"
            >
              A warm, human space to <span className="bg-gradient-to-r from-sky-400 via-purple-300 to-pink-400 bg-clip-text text-transparent italic font-serif">unravel hard choices.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-white/70 text-base sm:text-lg leading-relaxed mb-8 font-light"
            >
              You don't have to figure it out alone. Noerax listens to what you mean, understands your situation, and brings <span className="text-white font-medium border-b border-dharma-flame/60 pb-0.5">calm, human wisdom &amp; actionable perspective 🌿</span>.
            </motion.p>

            {/* Staggered Checklist */}
            <div className="space-y-4 mb-10">
              {[
                { title: 'Empathetic & Human-Like', desc: 'Responds to who you are, not just a category. Speaks naturally in your language. ❤️' },
                { title: 'Practical & Timeless Wisdom', desc: 'Gives clear perspectives without preaching, lecture walls, or forced positivity. ✨' },
                { title: '100% Private & Confidential', desc: 'Your reflections, decisions, and personal thoughts stay completely secure. 🛡️' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-3.5 bg-black/40 border border-white/15 p-4 rounded-2xl backdrop-blur-md hover:border-dharma-flame/40 transition-all group"
                >
                  <CheckCircle2 className="w-5 h-5 text-dharma-flame shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    <p className="text-xs text-white/60 mt-0.5">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Curriculum Tags */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex flex-wrap gap-2"
            >
              {['Human Touch ✨', 'Decision-Making 🧭', 'Inner Calm 🕊️', 'Career Clarity 🎯', 'Focus 💡'].map(tag => (
                <span key={tag} className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 text-white/70 text-xs font-semibold backdrop-blur-md hover:border-white/30 transition-colors">
                  {tag}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Live Chat Interface Box with Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-7 relative"
          >
            <div className="liquid-glass rounded-3xl bg-black/65 backdrop-blur-2xl border border-white/20 shadow-[0_0_80px_rgba(249,115,22,0.18)] overflow-hidden flex flex-col h-[520px] sm:h-[600px] lg:h-[640px]">

              {/* Chat Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-black/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-dharma-flame/20 border border-dharma-flame/40 flex items-center justify-center shadow-md">
                      <Sparkles className="w-5 h-5 text-dharma-flame" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-black" />
                  </div>
                  <div>
                    <h4 className="text-white font-serif font-semibold text-base flex items-center gap-2">
                      Noerax AI Guide
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-dharma-flame/20 text-dharma-flame border border-dharma-flame/40 uppercase font-sans font-bold">Interactive</span>
                    </h4>
                    <p className="text-emerald-400 text-xs font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                      Live Assistant · Online
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(user ? '/chat' : '/auth?redirect=/chat')}
                    className="btn-liquid-primary !px-3.5 !py-1.5 !text-xs gap-1.5"
                    title="Open Fullscreen AI Workspace"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Fullscreen Chat</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1, rotate: -180 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    onClick={reset}
                    className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    title="Reset Preview"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Messages Feed */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 space-y-5">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 shadow-md ${
                        msg.role === 'ai'
                          ? 'bg-dharma-flame/20 border border-dharma-flame/40'
                          : 'bg-white/10 border border-white/20'
                      }`}>
                        {msg.role === 'ai'
                          ? <Sparkles className="w-4 h-4 text-dharma-flame" />
                          : <User className="w-4 h-4 text-white/80" />
                        }
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'ai'
                          ? 'bg-black/60 text-white rounded-tl-sm border border-white/15 shadow-inner backdrop-blur-md'
                          : 'bg-dharma-flame text-white rounded-tr-sm shadow-lg shadow-dharma-flame/20 font-medium'
                      }`}>
                        {msg.content || (
                          <span className="text-white/50 italic text-xs">Reflecting...</span>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-dharma-flame/20 border border-dharma-flame/40 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-dharma-flame" />
                      </div>
                      <div className="bg-black/60 border border-white/15 rounded-2xl rounded-tl-sm backdrop-blur-md">
                        <TypingDots />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Suggestion Chips Above Input */}
              {messages.length <= 1 && !isLoading && (
                <div className="px-5 py-3 border-t border-white/10 bg-black/40 backdrop-blur-md">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-dharma-flame" /> Suggested Topics
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SUGGESTED.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(prompt)}
                        className="text-left px-3.5 py-2.5 rounded-xl border border-white/15 bg-black/50 hover:bg-black/80 hover:border-dharma-flame/60 text-white text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer flex items-center justify-between group shadow-sm"
                      >
                        <span>{prompt}</span>
                        <span className="text-dharma-flame opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Bar */}
              <div className="p-4 border-t border-white/15 bg-black/60 backdrop-blur-md">
                <div className="flex gap-3 items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What decision or situation are you trying to figure out today?"
                    className="flex-1 bg-black/60 border border-white/20 rounded-full px-5 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-dharma-flame/60 transition-colors"
                    disabled={isLoading}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="w-11 h-11 rounded-full bg-dharma-flame text-white flex items-center justify-center hover:bg-dharma-saffron transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-dharma-flame/30"
                  >
                    {isLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" />
                    }
                  </motion.button>
                </div>
              </div>

            </div>

            {/* Glowing Ambient Halo */}
            <div className="absolute -inset-2 bg-dharma-flame/10 blur-3xl rounded-3xl -z-10" />
          </motion.div>

        </div>
      </div>
    </motion.section>
  );
}
