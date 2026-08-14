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

// Strip markdown symbols and return clean plain text
const formatMessage = (text: string): string => {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')  // bold-italic
    .replace(/\*\*(.+?)\*\*/g, '$1')      // bold
    .replace(/\*(.+?)\*/g, '$1')          // italic
    .replace(/^#{1,6}\s+/gm, '')          // headings
    .replace(/^[-–—]\s+/gm, '')           // dash bullets
    .replace(/`([^`]+)`/g, '$1')          // inline code
    .trim();
};

// Extract SUGGESTIONS: [...] block from AI text, return cleaned text + parsed suggestions
const parseSuggestions = (raw: string): { text: string; suggestions: string[] } => {
  const match = raw.match(/SUGGESTIONS:\s*(\[.*?\])/s);
  if (!match) return { text: formatMessage(raw), suggestions: [] };
  let suggestions: string[] = [];
  try {
    const parsed = JSON.parse(match[1]);
    if (Array.isArray(parsed)) suggestions = parsed.slice(0, 3).map(String);
  } catch {}
  const cleanText = formatMessage(raw.slice(0, raw.indexOf('SUGGESTIONS:')).trim());
  return { text: cleanText, suggestions };
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
  );

  return (
    <div className="h-screen w-screen bg-[#050508] font-sans text-[#E2E8F0] flex overflow-hidden fixed inset-0 z-40 selection:bg-cyan-400 selection:text-black">

      {/* ── LEFT SIDEBAR (Past Chats History & New Chat) ── */}
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
              className="fixed md:relative inset-y-0 left-0 w-72 sm:w-80 bg-[#08080c] border-r border-white/[0.07] flex flex-col flex-shrink-0 z-40 shadow-2xl md:shadow-none"
            >
              {/* Sidebar Top Controls */}
              <div className="p-4 border-b border-white/[0.07] flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-1.5 text-xs font-mono font-medium text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Sanctuary
                  </button>

                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-pulse" />
                    <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300 font-semibold">NOERAX AI</span>
                  </div>

                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors cursor-pointer"
                    title="Collapse Sidebar"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>

                {/* + New Chat Button with Luxury Gradient */}
                <button
                  onClick={createNewChat}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-sky-400/10 via-cyan-400/15 to-transparent border border-cyan-400/30 text-white font-medium text-xs rounded-2xl hover:border-cyan-400/60 hover:bg-cyan-400/20 transition-all shadow-lg shadow-cyan-500/5 flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <Plus className="w-4 h-4 text-cyan-300 group-hover:rotate-90 transition-transform duration-300" />
                  <span>Start New Conversation</span>
                </button>

                {/* Search Past Chats */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search past dialogues..."
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors"
                  />
                </div>
              </div>

              {/* Past Chats List */}
              <div data-lenis-prevent className="flex-1 overflow-y-auto p-3 space-y-1 overscroll-contain">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-white/30 px-2 block mb-1">
                  Recent Dialogues ({filteredSessions.length})
                </span>

                {filteredSessions.length === 0 ? (
                  <div className="py-10 text-center text-xs text-white/30 font-mono">
                    No matching chats found
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
                        className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all group ${
                          isActive
                            ? 'bg-cyan-500/10 border border-cyan-400/40 text-white shadow-sm'
                            : 'hover:bg-white/[0.04] text-white/60 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-300' : 'text-white/40'}`} />
                          <div className="truncate flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-medium truncate">{session.title}</h4>
                              {session.botName && session.botName !== 'Noerax' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 font-mono shrink-0">
                                  {session.botName}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-white/30 font-mono block mt-0.5">
                              {new Date(session.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              {session.botName && session.botName !== 'Noerax' ? ` • ${session.botName}` : ''}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => deleteSession(session.id, e)}
                          className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all cursor-pointer shrink-0"
                          title="Delete Conversation"
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

      {/* ── MAIN CHAT WORKSPACE AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#050508] relative h-full overflow-hidden">
        
        {/* Subtle Ambient Studio Aura Glows (Pure Black Canvas with Ethereal Depth) */}
        <div className="absolute top-1/6 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-cyan-500/8 via-purple-500/4 to-transparent blur-[160px] pointer-events-none rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[250px] bg-blue-500/5 blur-[140px] pointer-events-none rounded-full" />

        {/* Micro-dot grid texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none opacity-40" />

        {/* Workspace Top Navigation Header */}
        <div className="h-14 sm:h-16 px-3 sm:px-6 border-b border-white/[0.07] bg-[#08080c]/80 backdrop-blur-2xl flex items-center justify-between z-10 shrink-0 relative">
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 sm:p-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                title="Open Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                <h2 className="font-serif italic font-semibold text-sm sm:text-lg text-white flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300 shrink-0" />
                  <span className="truncate">{activeSession?.title || 'Chat Workspace'}</span>
                </h2>

                {/* Dynamic Bot Name Editor Badge */}
                <div className="flex items-center gap-1.5 ml-1 sm:ml-2 bg-white/[0.04] border border-white/10 px-2.5 py-1 rounded-full text-xs shadow-sm shrink-0 backdrop-blur-md">
                  <Bot className="w-3.5 h-3.5 text-cyan-300" />
                  {isEditingBotName ? (
                    <input
                      type="text"
                      value={botNameInput}
                      onChange={(e) => setBotNameInput(e.target.value)}
                      onBlur={() => handleSaveBotName()}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveBotName(); }}
                      autoFocus
                      placeholder="Name bot..."
                      className="bg-black/60 border-b border-cyan-400 text-xs text-white px-1 py-0.5 focus:outline-none w-20 sm:w-24 font-mono"
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setBotNameInput(activeSession?.botName || 'Noerax');
                        setIsEditingBotName(true);
                      }}
                      className="text-white/80 font-medium cursor-pointer hover:text-cyan-300 transition-colors flex items-center gap-1 text-[11px] sm:text-xs"
                      title="Click to rewrite bot name for this chat"
                    >
                      <span className="truncate max-w-[80px] sm:max-w-none">{activeSession?.botName || 'Noerax'}</span>
                      <Edit2 className="w-3 h-3 text-white/40 shrink-0" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[10px] sm:text-[11px] text-white/40 truncate font-mono">
                Mentor: <span className="text-cyan-300 font-medium">{activeSession?.botName || 'Noerax'}</span> · 432 Hz Mindful Neural Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/settings')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all text-xs font-mono cursor-pointer"
            >
              Settings
            </button>
          </div>
        </div>

        {/* Messages Stream Container — ref used for direct scrollTop (bypasses Lenis) */}
        <div ref={containerRef} data-lenis-prevent className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-10 space-y-4 sm:space-y-6 overscroll-contain relative z-10">
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            {activeSession?.messages.map((msg) => (
              <React.Fragment key={msg.id}>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-3 sm:gap-4 max-w-[95%] sm:max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  {/* Avatar Icon */}
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center border shrink-0 backdrop-blur-md ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-b from-white/15 to-white/5 border-white/20 text-white shadow-md'
                      : 'bg-gradient-to-b from-cyan-500/20 to-cyan-500/5 border-cyan-400/30 text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble Content */}
                  <div className={`group relative p-4 sm:p-6 rounded-3xl text-xs sm:text-sm leading-relaxed border max-w-full overflow-hidden backdrop-blur-2xl ${
                    msg.role === 'user'
                      ? 'bg-[#14141a] text-white font-normal border-white/15 rounded-tr-none shadow-xl shadow-black/50'
                      : 'bg-[#0c0c11]/90 border-white/[0.08] text-white/90 rounded-tl-none shadow-[0_12px_40px_rgba(0,0,0,0.6)]'
                  }`}>
                    <p className="whitespace-pre-wrap font-sans text-xs sm:text-base leading-relaxed tracking-normal break-words overflow-wrap-anywhere">
                      {msg.content ? formatMessage(msg.content) : '...'}
                    </p>

                    <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-white/[0.06] text-[10px] font-mono text-white/40">
                      <span>{msg.timestamp}</span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Audio Speak */}
                        <button
                          onClick={() => speakText(msg.content)}
                          className="p-1 hover:text-cyan-300 transition-colors cursor-pointer"
                          title="Read Aloud"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Copy Button */}
                        <button
                          onClick={() => copyToClipboard(msg.id, msg.content)}
                          className="p-1 hover:text-white transition-colors cursor-pointer"
                          title="Copy Text"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Follow-up Suggestion Chips — shown after AI messages */}
                {msg.role === 'ai' && msg.suggestions && msg.suggestions.length > 0 && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className="flex flex-wrap gap-2 max-w-[95%] sm:max-w-3xl pl-11 sm:pl-14 mt-1"
                  >
                    {msg.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(suggestion)}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-medium border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-cyan-400/50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-md shadow-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </motion.div>
                )}
              </React.Fragment>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 text-cyan-300 text-xs font-mono py-4 px-2 max-w-3xl">
                <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                <span>Noerax is contemplating timeless wisdom...</span>
              </div>
            )}
          </div>
        </div>

        {/* Suggestion Starters Bar (Initial state) */}
        {activeSession?.messages && activeSession.messages.length <= 1 && !isLoading && (
          <div className="px-3 sm:px-6 pt-3 pb-1 max-w-3xl mx-auto border-t border-white/[0.06] relative z-10 w-full">
            <p className="text-[11px] font-mono uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> Clarity Starters
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-left px-3.5 py-2.5 rounded-2xl border border-white/[0.08] bg-[#0c0c11]/80 hover:bg-white/[0.06] hover:border-cyan-400/40 text-white/90 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer flex items-center justify-between group shadow-sm backdrop-blur-md"
                >
                  <span>{prompt}</span>
                  <span className="text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar Footer (Floating Studio Console) */}
        <div className="p-2.5 sm:p-4 md:p-6 border-t border-white/[0.06] bg-[#08080c]/80 backdrop-blur-2xl shrink-0 relative z-10">
          <div className="max-w-3xl mx-auto flex items-center gap-2 sm:gap-3 bg-[#0c0c11]/90 border border-white/15 rounded-2xl sm:rounded-3xl px-3 py-2 sm:px-5 sm:py-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.9)] focus-within:border-cyan-400/60 focus-within:ring-1 focus-within:ring-cyan-400/25 transition-all backdrop-blur-2xl">
            
            {/* Dictation Mic Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                isListening
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                  : 'bg-white/[0.04] border-white/10 text-white/40 hover:text-white hover:bg-white/[0.08]'
              }`}
              title={isListening ? 'Stop Listening' : 'Voice Dictate Prompt'}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-cyan-300" />}
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask about a decision, situation, or feelings..."
              rows={1}
              className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder-white/30 text-xs sm:text-sm font-sans resize-none py-1 min-w-0"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="p-2.5 sm:p-3 bg-gradient-to-r from-sky-400 to-cyan-400 text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-cyan-400/25 shrink-0"
              title="Send Message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[10px] text-center text-white/30 font-mono mt-2 select-none">
            Noerax AI Guide · Rooted in timeless human perspective & decision models
          </p>
        </div>

      </div>
    </div>
  );
}
