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
}

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
  content: 'Hey there! I am Noerax — your AI best friend and companion. 💫\n\nI am here to listen, support you, and bring positivity to your day. What is on your mind right now? Speak freely!',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

const SUGGESTED_PROMPTS = [
  "I feel anxious about my future and direction",
  "How do I find purpose and clarity in work?",
  "Help me let go of attachment and overthinking",
  "I am exhausted and burnt out",
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

      // Persist finalized sessions to localStorage using functional update to get latest state
      setSessions((prev) => {
        try { localStorage.setItem('noerax_chat_sessions', JSON.stringify(prev)); } catch {}
        return prev;
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
    <div className="h-screen w-screen bg-dharma-ink font-sans text-dharma-ivory flex overflow-hidden fixed inset-0 z-40">

      {/* ── LEFT SIDEBAR (Past Chats History & New Chat) ── */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-72 bg-dharma-ink-2/95 border-r border-dharma-line-dark flex flex-col flex-shrink-0 z-20"
          >
            {/* Sidebar Top Controls */}
            <div className="p-4 border-b border-dharma-line-dark flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 text-xs font-semibold text-dharma-ivory-dim hover:text-dharma-ivory transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Home
                </button>

                <img src={noeraxLogo} alt="Noerax Logo" className="h-6 w-auto" style={{ filter: 'brightness(1.15)' }} />

                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 text-dharma-ivory-dim hover:text-dharma-ivory hover:bg-dharma-ink-3 rounded-lg transition-colors cursor-pointer"
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              {/* + New Chat Button */}
              <button
                onClick={createNewChat}
                className="w-full py-2.5 px-4 bg-dharma-flame text-white font-semibold text-xs rounded-2xl hover:bg-dharma-saffron transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Start New Conversation
              </button>

              {/* Search Past Chats */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-dharma-ivory-dim absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search past chats..."
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  className="w-full bg-dharma-ink border border-dharma-line-dark rounded-xl pl-9 pr-3 py-1.5 text-xs text-dharma-ivory placeholder-dharma-ivory-dim/40 focus:outline-none focus:border-dharma-flame transition-colors"
                />
              </div>
            </div>

            {/* Past Chats List */}
            <div data-lenis-prevent className="flex-1 overflow-y-auto p-3 space-y-1 overscroll-contain">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-dharma-ivory-dim/70 px-2 block mb-1">
                Recent Conversations ({filteredSessions.length})
              </span>

              {filteredSessions.length === 0 ? (
                <div className="py-8 text-center text-xs text-dharma-ivory-dim/50">
                  No matching chats found
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all group ${
                        isActive
                          ? 'bg-dharma-flame/15 border border-dharma-flame/40 text-dharma-ivory shadow-sm'
                          : 'hover:bg-dharma-ink-3/60 text-dharma-ivory-dim border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                        <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-dharma-flame' : 'text-dharma-ivory-dim'}`} />
                        <div className="truncate flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-semibold truncate">{session.title}</h4>
                            {session.botName && session.botName !== 'Noerax' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-dharma-flame/20 text-dharma-flame border border-dharma-flame/40 font-semibold shrink-0">
                                {session.botName}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-dharma-ivory-dim/70 block mt-0.5">
                            {new Date(session.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            {session.botName && session.botName !== 'Noerax' ? ` • ${session.botName}` : ''}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-dharma-ivory-dim hover:text-red-400 transition-all cursor-pointer shrink-0"
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
        )}
      </AnimatePresence>

      {/* ── MAIN CHAT WORKSPACE AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-dharma-ink relative">
        
        {/* Workspace Top Navigation Header */}
        <div className="h-16 px-6 border-b border-dharma-line-dark bg-dharma-ink-2/80 backdrop-blur-xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-xl border border-dharma-line-dark text-dharma-ivory-dim hover:text-dharma-ivory hover:bg-dharma-ink-3 transition-colors cursor-pointer"
                title="Open Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-semibold text-lg text-dharma-ivory flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-dharma-flame" />
                  {activeSession?.title || 'Chat Workspace'}
                </h2>

                {/* Dynamic Bot Name Editor Badge */}
                <div className="flex items-center gap-1.5 ml-2 bg-dharma-ink-3/90 border border-dharma-line-dark px-2.5 py-1 rounded-full text-xs shadow-sm">
                  <Bot className="w-3.5 h-3.5 text-dharma-flame" />
                  {isEditingBotName ? (
                    <input
                      type="text"
                      value={botNameInput}
                      onChange={(e) => setBotNameInput(e.target.value)}
                      onBlur={() => handleSaveBotName()}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveBotName(); }}
                      autoFocus
                      placeholder="Name bot..."
                      className="bg-dharma-ink border-b border-dharma-flame text-xs text-dharma-ivory px-1.5 py-0.5 focus:outline-none w-28"
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setBotNameInput(activeSession?.botName || 'Noerax');
                        setIsEditingBotName(true);
                      }}
                      className="text-dharma-ivory font-medium cursor-pointer hover:text-dharma-flame transition-colors flex items-center gap-1"
                      title="Click to rewrite bot name for this chat"
                    >
                      <span>{activeSession?.botName || 'Noerax'}</span>
                      <Edit2 className="w-3 h-3 text-dharma-ivory-dim" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-dharma-ivory-dim">
                Companion: <span className="text-dharma-flame font-medium">{activeSession?.botName || 'Noerax'}</span> — Real-time proactive assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speech synthesis Read Aloud Toggle */}
            <button
              onClick={() => {
                const lastAiMsg = activeSession?.messages.filter((m) => m.role === 'ai').slice(-1)[0];
                if (lastAiMsg) speakText(lastAiMsg.content);
              }}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                isSpeaking
                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400 animate-pulse'
                  : 'border-dharma-line-dark bg-dharma-ink-3 text-dharma-ivory-dim hover:text-dharma-ivory'
              }`}
              title={isSpeaking ? 'Mute Speech' : 'Read Aloud AI Response'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-dharma-flame" />}
            </button>

            {/* Clear Current Chat Messages */}
            <button
              onClick={() => {
                if (activeSession) {
                  const updated = sessions.map((s) =>
                    s.id === activeSession.id ? { ...s, messages: [DEFAULT_WELCOME] } : s
                  );
                  saveSessionsToStorage(updated);
                }
              }}
              className="p-2 rounded-full border border-dharma-line-dark bg-dharma-ink-3 text-dharma-ivory-dim hover:text-dharma-ivory transition-colors cursor-pointer"
              title="Reset Messages"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-full border border-dharma-line-dark bg-dharma-ink-3 text-dharma-ivory-dim hover:text-dharma-ivory transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-dharma-flame" />}
            </button>
          </div>
        </div>

        {/* Messages Stream Container — ref used for direct scrollTop (bypasses Lenis) */}
        <div ref={containerRef} data-lenis-prevent className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 overscroll-contain">
          {activeSession?.messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-start gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar Icon */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 ${
                msg.role === 'user'
                  ? 'bg-dharma-flame/20 border-dharma-flame/40 text-dharma-flame'
                  : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble Content */}
              <div className={`group relative p-5 rounded-3xl text-sm leading-relaxed border ${
                msg.role === 'user'
                  ? 'bg-dharma-flame text-white border-dharma-flame/50 rounded-tr-none shadow-lg'
                  : 'bg-dharma-ink-2 border-dharma-line-dark text-dharma-ivory rounded-tl-none shadow-md'
              }`}>
                <p className="whitespace-pre-wrap font-serif text-base">{msg.content || '...'}</p>

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-dharma-line-dark/40 text-[10px] text-dharma-ivory-dim">
                  <span>{msg.timestamp}</span>

                  <button
                    onClick={() => copyToClipboard(msg.id, msg.content)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-dharma-ivory transition-opacity cursor-pointer"
                    title="Copy Text"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-dharma-flame text-xs font-semibold py-4">
              <Sparkles className="w-4 h-4 animate-spin" /> Noerax is reflecting on ancient wisdom...
            </div>
          )}
        </div>

        {/* Suggested Prompts Pills */}
        {activeSession?.messages.length <= 2 && (
          <div className="px-6 py-2 flex flex-wrap justify-center gap-2">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-3 py-1.5 rounded-full border border-dharma-line-dark bg-dharma-ink-2 text-xs font-semibold text-dharma-ivory-dim hover:text-dharma-ivory hover:border-dharma-flame/40 hover:bg-dharma-flame/10 transition-all cursor-pointer shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar Footer */}
        <div className="p-4 md:p-6 border-t border-dharma-line-dark bg-dharma-ink-2/90 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto flex items-center gap-3 bg-dharma-ink border border-dharma-line-dark rounded-full px-5 py-3 shadow-xl focus-within:border-dharma-flame transition-colors">
            
            {/* Dictation Mic Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                isListening
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                  : 'bg-dharma-ink-3 border-dharma-line-dark text-dharma-ivory-dim hover:text-dharma-ivory'
              }`}
              title={isListening ? 'Stop Listening' : 'Voice Dictate Prompt'}
            >
              {isListening ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-dharma-flame" />}
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
              placeholder="Ask anything or express what's on your mind... (Press Enter to send)"
              rows={1}
              className="flex-1 bg-transparent border-none focus:outline-none text-dharma-ivory placeholder-dharma-ivory-dim/40 text-sm font-serif resize-none py-1"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="p-3 bg-dharma-flame text-white rounded-full hover:bg-dharma-saffron transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-dharma-flame/30 shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
