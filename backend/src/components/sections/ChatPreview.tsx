import { motion, AnimatePresence } from "motion/react";
import { Send, User, Sparkles, Loader2, RotateCcw, Maximize2, CheckCircle2, Zap, ShieldCheck } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const SUGGESTED = [
  "I'm feeling overwhelmed and overthinking 💭",
  "Help me think through a hard decision ✨",
  "How to handle a difficult conflict peacefully 🕊️",
  "I feel stuck and unsure about my next step 🧭",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-5 py-4">
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay }}
          className="w-2 h-2 rounded-full bg-dharma-flame/60"
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
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      id="guides"
      className="py-32 bg-dharma-ink relative overflow-hidden"
    >
      {/* Intense Glowing Background Backlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[550px] bg-dharma-flame/15 blur-[160px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left: Highlighted Copy */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5"
          >
            {/* Highlight Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dharma-flame/15 border border-dharma-flame/40 text-dharma-flame text-xs font-bold tracking-widest uppercase mb-6 shadow-xl shadow-dharma-flame/10">
              <Sparkles className="w-4 h-4" /> HUMAN-LIKE WISDOM GUIDE
            </span>

            {/* Giant Highlighted Headline */}
            <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-dharma-ivory mb-6 leading-[1.1]">
              A warm, human space to <span className="gradient-text">unravel hard choices.</span>
            </h2>

            <p className="text-dharma-ivory-dim text-lg sm:text-xl leading-relaxed mb-8 font-light">
              You don't have to figure it out alone. Noerax listens to what you mean, understands your situation, and brings <span className="text-dharma-ivory font-medium border-b border-dharma-flame/50 pb-0.5">calm, human wisdom &amp; actionable perspective 🌿</span>.
            </p>

            {/* Feature Highlights Checklist */}
            <div className="space-y-4 mb-10">
              {[
                { title: 'Empathetic & Human-Like', desc: 'Responds to who you are, not just a category. Speaks naturally in your language. ❤️' },
                { title: 'Practical & Timeless Wisdom', desc: 'Gives clear perspectives without preaching, lecture walls, or forced positivity. ✨' },
                { title: '100% Private & Confidential', desc: 'Your reflections, decisions, and personal thoughts stay completely secure. 🛡️' }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-dharma-ink-2/60 border border-dharma-line-dark/60 p-3.5 sm:p-4 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5 text-dharma-flame shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-dharma-ivory">{item.title}</h4>
                    <p className="text-[11px] sm:text-xs text-dharma-ivory-dim/80 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Curriculum Tags */}
            <div className="flex flex-wrap gap-2">
              {['Human Touch ✨', 'Decision-Making 🧭', 'Inner Calm 🕊️', 'Career Clarity 🎯', 'Focus 💡'].map(tag => (
                <span key={tag} className="px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-dharma-ink-2 border border-dharma-line-dark text-dharma-ivory-dim text-[11px] sm:text-xs font-semibold">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right: Live Chat Interface Box (Enlarged with Glow) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-7 relative"
          >
            <div className="bg-dharma-ink-2/95 backdrop-blur-2xl rounded-3xl border border-dharma-flame/30 shadow-[0_0_60px_rgba(249,115,22,0.15)] overflow-hidden flex flex-col h-[520px] sm:h-[600px] lg:h-[640px]">

              {/* Chat Header */}
              <div className="flex items-center justify-between px-6 py-4.5 border-b border-dharma-line-dark bg-dharma-ink-3/80">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-dharma-flame/20 border border-dharma-flame/40 flex items-center justify-center shadow-md">
                      <Sparkles className="w-5 h-5 text-dharma-flame" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-dharma-ink-2" />
                  </div>
                  <div>
                    <h4 className="text-dharma-ivory font-serif font-semibold text-base flex items-center gap-2">
                      Noerax AI Mentor
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-dharma-flame/20 text-dharma-flame border border-dharma-flame/30 uppercase font-sans font-bold">Interactive</span>
                    </h4>
                    <p className="text-emerald-400 text-xs font-medium flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                      Live Assistant · Groq Streaming Engine
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(user ? '/chat' : '/auth')}
                    className="px-4 py-2 rounded-full border border-dharma-flame/40 bg-dharma-flame/15 text-dharma-flame hover:bg-dharma-flame hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-md"
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
                    className="p-2 rounded-full text-dharma-ivory-dim hover:text-dharma-ivory hover:bg-dharma-ivory/5 transition-colors"
                    title="Reset Preview"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Messages */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 space-y-5">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${
                        msg.role === 'ai'
                          ? 'bg-dharma-flame/10 border border-dharma-flame/20'
                          : 'bg-dharma-ink-3 border border-dharma-line-dark'
                      }`}>
                        {msg.role === 'ai'
                          ? <Sparkles className="w-4 h-4 text-dharma-flame" />
                          : <User className="w-4 h-4 text-dharma-ivory-dim" />
                        }
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'ai'
                          ? 'bg-dharma-ink-3 text-dharma-ivory rounded-tl-sm border border-dharma-line-dark'
                          : 'bg-dharma-flame text-white rounded-tr-sm'
                      }`}>
                        {msg.content || (
                          <span className="text-dharma-ivory-dim italic text-xs">Reflecting...</span>
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
                      <div className="w-8 h-8 rounded-full bg-dharma-flame/10 border border-dharma-flame/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-dharma-flame" />
                      </div>
                      <div className="bg-dharma-ink-3 border border-dharma-line-dark rounded-2xl rounded-tl-sm">
                        <TypingDots />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>



              {/* Input */}
              <div className="p-4 border-t border-dharma-line-dark bg-dharma-ink/60">
                <div className="flex gap-3 items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What decision or situation are you trying to figure out today?"
                    className="flex-1 bg-dharma-ink-3 border border-dharma-line-dark rounded-full px-5 py-3 text-sm text-dharma-ivory placeholder:text-dharma-ivory-dim/50 focus:outline-none focus:border-dharma-flame/40 transition-colors"
                    disabled={isLoading}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="w-11 h-11 rounded-full bg-dharma-flame text-white flex items-center justify-center hover:bg-dharma-saffron transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-dharma-flame/20"
                  >
                    {isLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" />
                    }
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Decorative shadow behind card */}
            <div className="absolute -inset-2 bg-dharma-flame/5 blur-2xl rounded-3xl -z-10" />
          </motion.div>

        </div>
      </div>
    </motion.section>
  );
}




