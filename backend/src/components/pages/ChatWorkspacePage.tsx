import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, MessageSquare, Trash2, ArrowLeft, Send, Sparkles, 
  Mic, MicOff, Volume2, VolumeX, Copy, Check, Maximize2, Minimize2, 
  Search, PanelLeftClose, PanelLeft, Bot, User, RotateCcw, Edit2
} from 'lucide-react';
import noeraxLogo from '../../assets/noerax-logo.png';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

// Clean raw message without suggestions block
const stripSuggestions = (raw: string): string => {
  const index = raw.indexOf('SUGGESTIONS:');
  if (index !== -1) {
    return raw.slice(0, index).trim();
  }
  return raw.trim();
};

// Extract SUGGESTIONS: [...] block from AI text, return cleaned text + parsed suggestions
const parseSuggestions = (raw: string): { text: string; suggestions: string[] } => {
  const match = raw.match(/SUGGESTIONS:\s*(\[.*?\])/s);
  if (!match) return { text: stripSuggestions(raw), suggestions: [] };
  let suggestions: string[] = [];
  try {
    const parsed = JSON.parse(match[1]);
    if (Array.isArray(parsed)) suggestions = parsed.slice(0, 3).map(String);
  } catch {}
  const cleanText = stripSuggestions(raw);
  return { text: cleanText, suggestions };
};

// Helper function to format inline markdown (bold, italic, code)
const renderInlineFormatted = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const content = part.slice(2, -2);
      const isScripture = /source|geeta|gita|upanishad|ramayana|sutra|veda/i.test(content);
      return (
        <strong
          key={idx}
          className={isScripture ? 'text-amber-300 font-semibold tracking-wide' : 'text-white font-semibold'}
        >
          {content}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={idx} className="text-amber-100/90 italic font-serif">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={idx} className="bg-white/10 text-cyan-300 px-1.5 py-0.5 rounded text-[13px] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

// Rich Message Content Renderer for Scripture & Wisdom
const MessageContent: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return <span>...</span>;

  const cleaned = stripSuggestions(content);
  const blocks = cleaned.split(/\n\n+/);

  return (
    <div className="space-y-3.5 text-[14px] sm:text-[15px] leading-[1.75] text-[#ECECEC]">
      {blocks.map((block, blockIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Blockquote / Scripture Callout (starts with > or 📜 or 📖 or Source:)
        if (trimmed.startsWith('>') || trimmed.startsWith('📜') || trimmed.startsWith('📖') || /^source:/i.test(trimmed)) {
          const quoteLines = trimmed.replace(/^>\s*/gm, '').split('\n');
          return (
            <div
              key={blockIdx}
              className="my-3 pl-4 pr-3 py-2.5 rounded-r-xl border-l-3 border-amber-400/90 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent text-amber-100/95 font-sans shadow-sm"
            >
              {quoteLines.map((line, lIdx) => (
                <p key={lIdx} className={lIdx > 0 ? 'mt-1 text-sm text-amber-200/80' : 'font-medium text-amber-300'}>
                  {renderInlineFormatted(line)}
                </p>
              ))}
            </div>
          );
        }

        // Bullet list (starts with • or - or *)
        const lines = trimmed.split('\n');
        const isList = lines.length > 1 && lines.every((line) => /^[\s]*[•\-\*]\s+/.test(line));

        if (isList) {
          return (
            <ul key={blockIdx} className="space-y-2 my-2 pl-1">
              {lines.map((line, lIdx) => {
                const bulletText = line.replace(/^[\s]*[•\-\*]\s+/, '');
                return (
                  <li key={lIdx} className="flex items-start gap-2.5 text-slate-200">
                    <span className="text-amber-400 mt-1 text-xs shrink-0 select-none">✦</span>
                    <span className="flex-1 leading-relaxed">{renderInlineFormatted(bulletText)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Regular paragraph with potential single bullet or lines
        return (
          <div key={blockIdx} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              if (/^[\s]*[•\-\*]\s+/.test(line)) {
                const bulletText = line.replace(/^[\s]*[•\-\*]\s+/, '');
                return (
                  <div key={lIdx} className="flex items-start gap-2.5 my-1 pl-1 text-slate-200">
                    <span className="text-amber-400 mt-1 text-xs shrink-0 select-none">✦</span>
                    <span className="flex-1 leading-relaxed">{renderInlineFormatted(bulletText)}</span>
                  </div>
                );
              }
              return (
                <p key={lIdx} className="break-words">
                  {renderInlineFormatted(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

interface ChatSession {
  id: string;
  title: string;
  botName?: string;
  createdAt: string;
  messages: Message[];
}

const DEFAULT_WELCOME: Message = {
  id: 'msg-welcome',
  role: 'ai',
  content: "Hey. What's on your mind today?\n\nTell me whatever decision, situation, or feelings you're carrying right now. I'm here to listen and help you think clearly.",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

const SUGGESTED_PROMPTS = [
  "Why do I overthink every small thing?",
  "What if I make the wrong decision?",
  "What if nothing works out?",
  "How do I make the first move?",
];

export function ChatWorkspacePage() {
  const navigate = useNavigate();

  // Sessions state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessionSearch, setSessionSearch] = useState('');

  // Current Chat state
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditingBotName, setIsEditingBotName] = useState(false);
  const [botNameInput, setBotNameInput] = useState('');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const prevMessageCountRef = useRef<number>(0);
  const streamedContentRef = useRef<string>('');

  // Helper: scroll messages container to bottom WITHOUT touching window scroll (bypasses Lenis)
  const scrollToBottom = (smooth = true) => {
    const el = containerRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  };

  // Initialize or load sessions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('noerax_chat_sessions');
      if (stored) {
        const parsed: ChatSession[] = JSON.parse(stored);
        if (parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          return;
        }
      }
    } catch (e) {}

    // Initial default session if none exists
    const initialSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Conversation',
      botName: 'Noerax',
      createdAt: new Date().toISOString(),
      messages: [DEFAULT_WELCOME]
    };
    setSessions([initialSession]);
    setActiveSessionId(initialSession.id);
    localStorage.setItem('noerax_chat_sessions', JSON.stringify([initialSession]));
  }, []);

  // Save sessions to localStorage whenever sessions state changes
  const saveSessionsToStorage = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem('noerax_chat_sessions', JSON.stringify(updatedSessions));
    } catch (e) {}
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Auto scroll ONLY when a new message is added (not on every re-render / typing)
  useEffect(() => {
    const msgCount = activeSession?.messages?.length ?? 0;
    if (msgCount > prevMessageCountRef.current) {
      prevMessageCountRef.current = msgCount;
      scrollToBottom();
    }
  }, [activeSession?.messages?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Create a New Chat Session
  const createNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Conversation',
      botName: 'Noerax',
      createdAt: new Date().toISOString(),
      messages: [{ ...DEFAULT_WELCOME, id: `msg-${Date.now()}` }]
    };
    const updated = [newSession, ...sessions];
    saveSessionsToStorage(updated);
    setActiveSessionId(newSession.id);
    setInput('');
  };

  // Delete a Chat Session
  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== sessionId);
    if (updated.length === 0) {
      const fresh: ChatSession = {
        id: `session-${Date.now()}`,
        title: 'New Conversation',
        createdAt: new Date().toISOString(),
        messages: [DEFAULT_WELCOME]
      };
      saveSessionsToStorage([fresh]);
      setActiveSessionId(fresh.id);
    } else {
      saveSessionsToStorage(updated);
      if (activeSessionId === sessionId) {
        setActiveSessionId(updated[0].id);
      }
    }
  };

  // Toggle Speech Recognition
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Try Google Chrome.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
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

  // Speak AI text aloud
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Copy text helper
  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Send Message & Stream AI Response
  const handleSendMessage = async (customText?: string) => {
    const promptText = customText || input.trim();
    if (!promptText || isLoading || !activeSession) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update title if it's the default title
    let updatedTitle = activeSession.title;
    if (activeSession.title === 'New Conversation') {
      const words = promptText.split(' ').slice(0, 5).join(' ');
      updatedTitle = words.length > 30 ? `${words.slice(0, 30)}...` : words;
    }

    // Add user message to active session
    const updatedMessages = [...activeSession.messages, userMessage];
    let updatedSessions = sessions.map((s) =>
      s.id === activeSession.id ? { ...s, title: updatedTitle, messages: updatedMessages } : s
    );
    saveSessionsToStorage(updatedSessions);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = updatedMessages.map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptText, history: historyPayload, botName: activeSession?.botName || 'Noerax' })
      });

      if (!response.ok || !response.body) throw new Error(`AI stream failed: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      streamedContentRef.current = '';

      const aiMsgId = `msg-ai-${Date.now()}`;
      const placeholderAiMsg: Message = {
        id: aiMsgId,
        role: 'ai',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Append placeholder AI message to session
      setSessions((prev) => {
        const updated = prev.map((s) =>
          s.id === activeSession.id
            ? { ...s, title: updatedTitle, messages: [...updatedMessages, placeholderAiMsg] }
            : s
        );
        try { localStorage.setItem('noerax_chat_sessions', JSON.stringify(updated)); } catch {}
        return updated;
      });
      setIsLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                streamedContentRef.current += parsed.text;
                const latestContent = streamedContentRef.current;

                setSessions((prev) =>
                  prev.map((s) =>
                    s.id === activeSession.id
                      ? {
                          ...s,
                          messages: s.messages.map((m) =>
                            m.id === aiMsgId ? { ...m, content: latestContent } : m
                          ),
                        }
                      : s
                  )
                );
              }
            } catch (e) {}
          }
        }
      }

      // Parse suggestions out of the final streamed text and save clean version
      setSessions((prev) => {
        const updated = prev.map((s) => {
          if (s.id !== activeSession.id) return s;
          return {
            ...s,
            messages: s.messages.map((m) => {
              if (m.id !== aiMsgId) return m;
              const { text, suggestions } = parseSuggestions(m.content);
              return { ...m, content: text, suggestions };
            }),
          };
        });
        try { localStorage.setItem('noerax_chat_sessions', JSON.stringify(updated)); } catch {}
        return updated;
      });

      // Scroll to bottom after AI response is complete
      setTimeout(() => scrollToBottom(), 50);

    } catch (err) {
      console.error('Chat error:', err);
      setIsLoading(false);
      const errorMsg: Message = {
        id: `msg-err-${Date.now()}`,
        role: 'ai',
        content: 'Inner stillness interrupted. Please check your connection or API key and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSessions((prev) => {
        const updated = prev.map((s) =>
          s.id === activeSession.id
            ? { ...s, messages: [...s.messages, errorMsg] }
            : s
        );
        try { localStorage.setItem('noerax_chat_sessions', JSON.stringify(updated)); } catch {}
        return updated;
      });
    }
  };

  // Handle renaming bot for current chat and trigger proactive response
  const handleSaveBotName = async (newNameToSave?: string) => {
    setIsEditingBotName(false);
    const targetName = (newNameToSave !== undefined ? newNameToSave : botNameInput).trim();
    if (!targetName || !activeSession) return;
    const currentName = activeSession.botName || 'Noerax';
    if (targetName === currentName) return;

    // 1. Save new bot name to active session state
    const updatedSessions = sessions.map((s) =>
      s.id === activeSession.id ? { ...s, botName: targetName } : s
    );
    saveSessionsToStorage(updatedSessions);

    // 2. Trigger a proactive response from the renamed bot!
    setIsLoading(true);
    try {
      const promptText = `[PROACTIVE NOTICE: The user just renamed you from "${currentName}" to "${targetName}". Introduce yourself as "${targetName}", express excitement about your new name, and proactively ask what inspired this name or what role/relationship you play for them!]`;
      const historyPayload = activeSession.messages.map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          history: historyPayload,
          botName: targetName
        })
      });

      if (!response.ok || !response.body) throw new Error('Failed to fetch proactive response');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';
      const botMsgId = `msg-ai-${Date.now()}`;
      const placeholderMsg: Message = {
        id: botMsgId,
        role: 'ai',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? { ...s, botName: targetName, messages: [...s.messages, placeholderMsg] }
            : s
        )
      );
      setIsLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                aiText += parsed.text;
                setSessions((prev) => {
                  const updated = prev.map((s) =>
                    s.id === activeSession.id
                      ? {
                          ...s,
                          botName: targetName,
                          messages: s.messages.map((m) => (m.id === botMsgId ? { ...m, content: aiText } : m))
                        }
                      : s
                  );
                  try { localStorage.setItem('noerax_chat_sessions', JSON.stringify(updated)); } catch {}
                  return updated;
                });
              }
            } catch (e) {}
          }
        }
      }
      setTimeout(() => scrollToBottom(), 50);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(sessionSearch.toLowerCase())
  );  return (
    <div className="h-screen w-screen bg-[#09090b] font-sans text-[#ECECEC] flex overflow-hidden fixed inset-0 z-40 selection:bg-cyan-400 selection:text-black">

      {/* ── LEFT SIDEBAR (ChatGPT Style Dark Obsidian Drawer) ── */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <>
            {/* Mobile Backdrop Overlay */}
            <div 
              onClick={() => setIsSidebarOpen(false)} 
              className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-30"
            />
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed md:relative inset-y-0 left-0 w-64 sm:w-72 bg-[#121215] border-r border-white/[0.06] flex flex-col flex-shrink-0 z-40 shadow-2xl md:shadow-none"
            >
              {/* Sidebar Header */}
              <div className="p-3.5 border-b border-white/[0.06] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white transition-colors cursor-pointer px-1 py-1 rounded-lg hover:bg-white/[0.05]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Sanctuary
                  </button>

                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-pulse" />
                    <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300 font-semibold">NOERAX</span>
                  </div>

                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 text-white/40 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors cursor-pointer"
                    title="Collapse Sidebar"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>

                {/* + New Chat Button (ChatGPT Style) */}
                <button
                  onClick={createNewChat}
                  className="w-full py-2.5 px-3.5 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-white font-medium text-xs sm:text-sm rounded-xl transition-all flex items-center justify-between cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition-transform" />
                    <span>New chat</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/30 group-hover:text-white/60">⌘N</span>
                </button>

                {/* Search Dialogues */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search dialogues..."
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              {/* Past Chats List */}
              <div data-lenis-prevent className="flex-1 overflow-y-auto p-2 space-y-0.5 overscroll-contain">
                <span className="text-[10px] font-medium text-white/30 px-2.5 py-1.5 block">
                  Recent ({filteredSessions.length})
                </span>

                {filteredSessions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-white/30 font-mono">
                    No matching chats
                  </div>
                ) : (
                  filteredSessions.map((session) => {
                    const isActive = session.id === activeSessionId;
                    return (
                      <div
                        key={session.id}
                        onClick={() => {
                          setActiveSessionId(session.id);
                          if (window.innerWidth < 768) setIsSidebarOpen(false);
                        }}
                        className={`group px-2.5 py-2 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                          isActive
                            ? 'bg-white/[0.08] text-white font-medium shadow-sm'
                            : 'hover:bg-white/[0.04] text-white/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1">
                          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-300' : 'text-white/30'}`} />
                          <span className="text-xs truncate">{session.title}</span>
                        </div>

                        <button
                          onClick={(e) => deleteSession(session.id, e)}
                          className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all cursor-pointer shrink-0"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CHAT WORKSPACE AREA (ChatGPT Style Clean Canvas) ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#09090b] relative h-full overflow-hidden">

        {/* Minimal Top Bar */}
        <div className="h-13 px-4 sm:px-6 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl flex items-center justify-between z-10 shrink-0 relative">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                title="Open Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2 truncate">
              {/* Bot Persona Selector / Name */}
              <div className="flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-2.5 py-1 rounded-lg text-xs transition-colors">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                {isEditingBotName ? (
                  <input
                    type="text"
                    value={botNameInput}
                    onChange={(e) => setBotNameInput(e.target.value)}
                    onBlur={() => handleSaveBotName()}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveBotName(); }}
                    autoFocus
                    className="bg-transparent border-b border-cyan-400 text-xs text-white px-0.5 focus:outline-none w-20 font-mono"
                  />
                ) : (
                  <button
                    onClick={() => {
                      setBotNameInput(activeSession?.botName || 'Noerax');
                      setIsEditingBotName(true);
                    }}
                    className="text-white/90 font-medium cursor-pointer hover:text-white flex items-center gap-1 text-xs"
                    title="Click to rename AI Mentor"
                  >
                    <span>{activeSession?.botName || 'Noerax'}</span>
                    <span className="text-white/30 text-[10px]">▼</span>
                  </button>
                )}
              </div>

              <span className="text-xs text-white/30 hidden sm:inline">·</span>
              <span className="text-xs text-white/40 truncate hidden sm:inline">
                {activeSession?.title || 'New Conversation'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/settings')}
              className="px-3 py-1 rounded-lg border border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/[0.06] transition-all text-xs cursor-pointer"
            >
              Settings
            </button>
          </div>
        </div>

        {/* Messages Stream Container (ChatGPT Perfect Spacing) */}
        <div 
          ref={containerRef} 
          data-lenis-prevent 
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-10 overscroll-contain relative z-10"
        >
          <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10">
            {activeSession?.messages.map((msg) => (
              <React.Fragment key={msg.id}>
                {msg.role === 'user' ? (
                  /* ── USER MESSAGE (Right-Aligned Compact Pill) ── */
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[85%] sm:max-w-[75%] bg-[#26262a] text-[#ECECEC] text-[14px] sm:text-[15px] leading-relaxed px-4 sm:px-5 py-2.5 sm:py-3 rounded-3xl rounded-tr-sm shadow-md border border-white/[0.06]">
                      <p className="whitespace-pre-wrap break-words">{msg.content || '...'}</p>
                    </div>
                  </motion.div>
                ) : (
                  /* ── AI MESSAGE (Left-Aligned Clean Reading Flow) ── */
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-start gap-3.5 sm:gap-4 max-w-full group"
                  >
                    {/* Minimalist AI Emblem */}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-sky-400/20 to-cyan-400/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>

                    {/* AI Message Body & Action Toolbar */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="text-[14px] sm:text-[15.5px] leading-[1.7] text-[#E2E8F0] font-normal tracking-normal break-words">
                        <MessageContent content={msg.content} />
                      </div>

                      {/* Bottom Action Row (Copy, Read Aloud, Time) */}
                      <div className="flex items-center gap-2 pt-1 text-white/30 text-xs">
                        <button
                          onClick={() => copyToClipboard(msg.id, msg.content)}
                          className="p-1 hover:text-white rounded transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <Copy className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                          )}
                        </button>

                        <button
                          onClick={() => speakText(msg.content)}
                          className="p-1 hover:text-cyan-300 rounded transition-colors cursor-pointer"
                          title="Read aloud"
                        >
                          <Volume2 className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                        </button>

                        <span className="text-[10px] font-mono opacity-40 ml-1">{msg.timestamp}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Follow-up Suggestion Chips — shown after AI messages */}
                {msg.role === 'ai' && msg.suggestions && msg.suggestions.length > 0 && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.1 }}
                    className="flex flex-wrap gap-2 pl-10 sm:pl-12 -mt-4"
                  >
                    {msg.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(suggestion)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-full text-xs font-normal border border-white/[0.08] bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-cyan-400/40 transition-all cursor-pointer disabled:opacity-40 shadow-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </motion.div>
                )}
              </React.Fragment>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 text-cyan-300 text-xs font-mono py-2 pl-10 sm:pl-12">
                <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                <span>Thinking...</span>
              </div>
            )}
          </div>
        </div>

        {/* Suggestion Starters (Only on Empty/Initial Chat) */}
        {activeSession?.messages && activeSession.messages.length <= 1 && !isLoading && (
          <div className="px-4 sm:px-6 pb-2 max-w-3xl mx-auto w-full z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-left p-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 text-white/80 hover:text-white text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                >
                  <span className="truncate">{prompt}</span>
                  <span className="text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity ml-2">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar Footer (ChatGPT Style Floating Pill) */}
        <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent shrink-0 relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 bg-[#1b1b1e] border border-white/[0.1] focus-within:border-white/25 rounded-3xl p-2 sm:p-3 shadow-2xl transition-all">
              
              {/* Dictation Mic Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-full transition-all cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 animate-pulse'
                    : 'text-white/40 hover:text-white hover:bg-white/[0.05]'
                }`}
                title={isListening ? 'Stop Listening' : 'Voice Dictate Prompt'}
              >
                {isListening ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Message Noerax..."
                rows={1}
                className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder-white/40 text-sm sm:text-[15px] font-sans resize-none py-1 min-w-0"
              />

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className={`p-2 rounded-full transition-all shrink-0 cursor-pointer ${
                  input.trim() && !isLoading
                    ? 'bg-white text-black hover:bg-cyan-200'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-center text-white/30 font-sans mt-2.5 select-none">
              Noerax can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
