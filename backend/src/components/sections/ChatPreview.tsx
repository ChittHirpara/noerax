import { motion, AnimatePresence } from "motion/react";
import { Send, User, Sparkles, Loader2, RotateCcw, Maximize2 } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const SUGGESTED = [
  "I feel anxious about my future",
  "How do I find my purpose?",
  "I'm exhausted and burnt out",
  "Help me let go of control",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-5 py-4">
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, delay }}
          className="w-2 h-2 rounded-full bg-dharma-ivory-dim"
        />
      ))}
    </div>
  );
}

export function ChatPreview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Namaste. I am Noerax — your guide through ancient wisdom and modern clarity.\n\nWhat is weighing on your mind today? Speak freely.' }
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

      if (!response.ok || !response.body) {
        throw new Error('Failed to connect');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';

      // Add a placeholder AI message to stream into
      setMessages(prev => [...prev, { role: 'ai', content: '' }]);
      setIsLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const { text } = JSON.parse(data);
              aiContent += text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'ai', content: aiContent };
                return updated;
              });
            } catch {}
          }
        }
      }
    } catch {
      setIsLoading(false);
      setMessages(prev => [...prev, { role: 'ai', content: 'The connection to ancient wisdom was interrupted. Please ensure your GEMINI_API_KEY is configured and try again.' }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reset = () => {
    setMessages([{ role: 'ai', content: 'Namaste. I am Noerax — your guide through ancient wisdom and modern clarity.\n\nWhat is weighing on your mind today? Speak freely.' }]);
    setInput('');
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      id="guides"
      className="py-24 bg-dharma-ink relative overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-dharma-flame/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block text-dharma-flame text-xs font-semibold tracking-[0.3em] uppercase mb-4">
              AI Guide
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-dharma-ivory mb-6">
              Find clarity in <span className="gradient-text">conversation.</span>
            </h2>
            <p className="text-dharma-ivory-dim text-lg mb-8 leading-relaxed">
              Noerax isn't just another chatbot. It's an intelligent companion trained on millennia of Eastern philosophy, stoicism, and modern psychology.
            </p>
            <p className="text-dharma-ivory-dim text-lg leading-relaxed mb-8">
              Whenever you feel lost, overwhelmed, or anxious, Noerax is there to help you re-center and find your own answers.
            </p>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-2">
              {['Vedanta', 'Buddhism', 'Stoicism', 'Taoism', 'Psychology'].map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full bg-dharma-ink-2 border border-dharma-line-dark text-dharma-ivory-dim text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right: Live Chat Interface */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-dharma-ink-2/90 backdrop-blur-xl rounded-3xl border border-dharma-line-dark shadow-2xl overflow-hidden flex flex-col h-[600px]">

              {/* Chat Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-dharma-line-dark bg-dharma-ink-3/50">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-dharma-flame/10 border border-dharma-flame/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-dharma-flame" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-dharma-ink-2" />
                  </div>
                  <div>
                    <h4 className="text-dharma-ivory font-semibold text-sm">Noerax Guide</h4>
                    <p className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                      Online · Powered by Gemini
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(user ? '/chat' : '/auth')}
                    className="p-2 rounded-full border border-dharma-line-dark bg-dharma-ink-3 text-dharma-flame hover:bg-dharma-flame/10 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    title="Open Fullscreen AI Chat Workspace"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Fullscreen Mode</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1, rotate: -180 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    onClick={reset}
                    className="p-2 rounded-full text-dharma-ivory-dim hover:text-dharma-ivory hover:bg-dharma-ivory/5 transition-colors"
                    title="New conversation"
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

              {/* Suggested prompts (shown when minimal messages) */}
              {messages.length <= 1 && (
                <div className="px-5 pb-2 flex flex-wrap gap-2">
                  {SUGGESTED.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="px-3 py-1.5 text-xs rounded-full border border-dharma-line-dark text-dharma-ivory-dim hover:border-dharma-flame/40 hover:text-dharma-ivory transition-colors bg-dharma-ink"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-dharma-line-dark bg-dharma-ink/60">
                <div className="flex gap-3 items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask for guidance..."
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




