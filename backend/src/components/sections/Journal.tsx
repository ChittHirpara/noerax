import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PenLine, Sparkles, BookHeart, Compass, Activity, Loader2, Mic, MicOff, Download, Search, Calendar, FolderHeart, Check, Edit3, Bookmark, Trash2, ArrowUpRight, Copy, Heart, ShieldCheck, Feather, Clock, Lightbulb, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

interface SavedJournal {
  _id: string;
  title?: string;
  entryText: string;
  mood?: string;
  insights?: string;
  wisdom?: string;
  actions?: string[];
  tone?: string;
  reframe?: string;
  createdAt: string;
}

const INSPIRATION_PROMPTS = [
  "What decision am I avoiding because of fear?",
  "Where is my ego pretending to be rational logic?",
  "What would change if I let go of the outcome?",
  "What is the single highest-leverage action today?"
];

const MINDSET_STATES = [
  { id: 'friction', label: 'Decision Friction', dot: 'bg-cyan-400', border: 'border-cyan-400/40 text-cyan-200' },
  { id: 'overwhelmed', label: 'Overwhelmed', dot: 'bg-amber-400', border: 'border-amber-400/40 text-amber-200' },
  { id: 'conflict', label: 'Relationship Tension', dot: 'bg-rose-400', border: 'border-rose-400/40 text-rose-200' },
  { id: 'growth', label: 'Seeking Mastery', dot: 'bg-emerald-400', border: 'border-emerald-400/40 text-emerald-200' },
  { id: 'stillness', label: 'Seeking Stillness', dot: 'bg-indigo-400', border: 'border-indigo-400/40 text-indigo-200' },
];

export function Journal() {
  const { token } = useAuth();
  const [viewMode, setViewMode] = useState<'write' | 'vault'>('write');
  
  const [journalTitle, setJournalTitle] = useState('Evening Reflection');
  const [selectedMood, setSelectedMood] = useState('Decision Friction');
  const [entry, setEntry] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<number[]>([]);
  const recognitionRef = useRef<any>(null);

  const [analysis, setAnalysis] = useState<{
    insights: string;
    wisdom: string;
    actions: string | string[];
    tone: string;
    reframe?: string;
  } | null>(null);

  // Vault state
  const [vaultEntries, setVaultEntries] = useState<SavedJournal[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [vaultSearch, setVaultSearch] = useState('');

  // Calculate live word count & read time
  const wordCount = entry.trim() ? entry.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  // Load vault entries from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('noerax_saved_journals');
      if (stored) {
        setVaultEntries(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  // Fetch vault entries from MongoDB Atlas when logged in or switching to vault
  useEffect(() => {
    if (viewMode === 'vault' && token) {
      setIsLoadingVault(true);
      fetch('/api/journal/history', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setVaultEntries(data);
            localStorage.setItem('noerax_saved_journals', JSON.stringify(data));
          }
        })
        .catch((err) => console.error('Fetch vault error:', err))
        .finally(() => setIsLoadingVault(false));
    }
  }, [viewMode, token]);

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
        setEntry((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    }
  };

  const toggleActionItem = (idx: number) => {
    setCompletedActions(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleAnalyze = async () => {
    if (!entry.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysis(null);
    setCompletedActions([]);

    let resultData = null;

    try {
      const response = await fetch('/api/analyze-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: journalTitle, 
          entry: `[Mindset State: ${selectedMood}]\n\n${entry}`, 
          token 
        })
      });

      if (!response.ok) throw new Error('Failed to analyze');
      resultData = await response.json();
    } catch (error) {
      console.error('Analysis API error, using fallback:', error);
      resultData = {
        insights: 'Your cognitive tension stems from trying to resolve the entire chain of future unknowns at once. By separating immediate physical control from external outcomes, psychological equilibrium is instantly restored.',
        wisdom: "Bhagavad Gita 2.47: 'You possess authority solely over your actions, never over their fruits. Do not let outcomes be your master.'",
        actions: [
          'Identify the single variable you directly govern in the next 60 minutes.',
          'Execute a 2-minute physiological sigh to disengage the sympathetic fight-or-flight loop.',
          'Decide on the next physical micro-step and release all attachment to step four.'
        ],
        tone: selectedMood,
        reframe: 'Old narrative: "I must ensure this goes perfectly." ➔ New reframe: "I bring total focus to this exact action, and remain unshakeable regardless of results."'
      };
    } finally {
      setIsAnalyzing(false);
    }

    setAnalysis(resultData);

    // Save to Vault state & localStorage immediately
    const newEntry: SavedJournal = {
      _id: `j-${Date.now()}`,
      title: journalTitle.trim() || 'Daily Reflection',
      entryText: entry,
      mood: selectedMood,
      insights: resultData.insights,
      wisdom: resultData.wisdom,
      actions: Array.isArray(resultData.actions) ? resultData.actions : [resultData.actions],
      tone: resultData.tone,
      reframe: resultData.reframe,
      createdAt: new Date().toISOString()
    };

    const updatedVault = [newEntry, ...vaultEntries.filter(item => item._id !== newEntry._id)];
    setVaultEntries(updatedVault);
    try {
      localStorage.setItem('noerax_saved_journals', JSON.stringify(updatedVault));
    } catch (e) {}

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const deleteVaultItem = (id: string) => {
    const updated = vaultEntries.filter(item => item._id !== id);
    setVaultEntries(updated);
    try {
      localStorage.setItem('noerax_saved_journals', JSON.stringify(updated));
    } catch (e) {}
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export Reflection Digest as a beautifully formatted text dossier
  const exportDigest = (customTitle?: string, customEntry?: string, customAnalysis?: any) => {
    const titleToExport = customTitle || journalTitle;
    const textToExport = customEntry || entry;
    const analysisToExport = customAnalysis || analysis;

    if (!textToExport) return;

    const formattedActions = Array.isArray(analysisToExport?.actions)
      ? analysisToExport.actions.map((a: string, i: number) => `  [ ] Step 0${i + 1}: ${a}`).join('\n')
      : `  [ ] ${analysisToExport?.actions || 'Reflect with presence'}`;

    const content = `┌──────────────────────────────────────────────────────────┐
  NOERAX SANCTUARY · ARCHIVAL REFLECTION DOSSIER
  Title:   ${titleToExport}
  Date:    ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
  State:   ${selectedMood}
└──────────────────────────────────────────────────────────┘

■ THE INSCRIBED ENTRY:
"${textToExport}"

■ I. ROOT PSYCHOLOGICAL DECODE:
${analysisToExport?.insights || 'Clarity emerges the moment resistance ceases.'}

■ II. ANCIENT WISDOM ANCHOR:
${analysisToExport?.wisdom || "Bhagavad Gita 2.47: 'Perform your duty without attachment to outcomes.'"}

■ III. 24-HOUR ACTION PROTOCOL:
${formattedActions}

■ IV. COGNITIVE REFRAME:
${analysisToExport?.reframe || 'Shift from fear of uncertainty to radical presence.'}

────────────────────────────────────────────────────────────
Archived from Noerax Sanctuary · www.noerax.com
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Noerax-${titleToExport.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  const filteredVault = vaultEntries.filter((item) =>
    (item.title && item.title.toLowerCase().includes(vaultSearch.toLowerCase())) ||
    item.entryText.toLowerCase().includes(vaultSearch.toLowerCase()) ||
    (item.tone && item.tone.toLowerCase().includes(vaultSearch.toLowerCase())) ||
    (item.mood && item.mood.toLowerCase().includes(vaultSearch.toLowerCase()))
  );

  return (
    <motion.section 
      initial={{ opacity: 0, y: 50 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, margin: "-100px" }} 
      transition={{ duration: 0.8, ease: "easeOut" }} 
      id="journal" 
      className="py-20 sm:py-28 md:py-36 bg-[#070709] relative overflow-hidden text-white selection:bg-sky-400 selection:text-black"
    >
      {/* Subtle Atmospheric Light Shimmer */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-sky-500/8 via-cyan-500/4 to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-[450px] h-[450px] bg-purple-900/10 blur-[180px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
        
        {/* Section Header with Editorial Stamped Badge */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/15 bg-white/[0.03] text-white/80 text-[11px] font-mono tracking-[0.25em] uppercase mb-5 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.5)]"
          >
            <Feather className="w-3.5 h-3.5 text-dharma-flame" />
            <span>Personal Codex</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif italic text-4xl sm:text-5xl md:text-6xl text-white mb-4 tracking-tight"
            style={{ fontFamily: "'Instrument Serif', 'Playfair Display', serif" }}
          >
            Notes & Application Vault
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/50 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-10 font-light leading-relaxed"
          >
            A dedicated sanctuary to decode overthinking, document pivotal decisions, and forge practical 24-hour protocols with ancient clarity.
          </motion.p>

          {/* Minimalist Switcher */}
          <div className="inline-flex bg-white/[0.04] p-1.5 rounded-full border border-white/10 backdrop-blur-2xl shadow-xl gap-1">
            <button
              onClick={() => setViewMode('write')}
              className={`px-6 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'write'
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/25 font-semibold'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <PenLine className="w-3.5 h-3.5" /> Reflection Studio
            </button>
            <button
              onClick={() => setViewMode('vault')}
              className={`px-6 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'vault'
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/25 font-semibold'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <FolderHeart className="w-3.5 h-3.5" /> Archival Vault ({vaultEntries.length})
            </button>
          </div>
        </div>

        {/* WRITE MODE */}
        {viewMode === 'write' && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Writing Studio Desk */}
            <div className="lg:col-span-7 flex flex-col h-full">
              <div className="liquid-glass-strong rounded-[28px] p-6 sm:p-8 flex flex-col h-full relative border border-white/[0.12] shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
                
                {/* Mindset Radar Pill Selector */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 font-semibold">
                      Current State of Consciousness:
                    </span>
                    <span className="text-[10px] font-mono text-white/30">
                      {wordCount} words · {readTime} min read
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {MINDSET_STATES.map((state) => {
                      const isSelected = selectedMood === state.label;
                      return (
                        <button
                          key={state.id}
                          type="button"
                          onClick={() => setSelectedMood(state.label)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-2 ${
                            isSelected
                              ? `bg-white/10 ${state.border} shadow-[0_0_15px_rgba(56,189,248,0.2)] ring-1 ring-white/20`
                              : 'bg-white/[0.02] border-white/8 text-white/50 hover:bg-white/[0.06] hover:text-white/80'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${state.dot} ${isSelected ? 'animate-pulse' : 'opacity-60'}`} />
                          <span>{state.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Journal Title Bar */}
                <div className="flex items-center gap-3 mb-4 pb-3.5 border-b border-white/8">
                  <input
                    type="text"
                    value={journalTitle}
                    onChange={(e) => setJournalTitle(e.target.value)}
                    placeholder="Name this inquiry..."
                    className="bg-transparent text-xl sm:text-2xl font-serif italic text-white/95 border-none focus:outline-none w-full placeholder-white/25 tracking-tight"
                    style={{ fontFamily: "'Instrument Serif', 'Playfair Display', serif" }}
                  />
                  {saveSuccess && (
                    <span className="px-3 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-mono flex items-center gap-1.5 shrink-0 animate-fade-in">
                      <Check className="w-3 h-3 text-emerald-400" /> Inscribed in Vault
                    </span>
                  )}
                </div>

                {/* Main Textarea Canvas */}
                <textarea
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder="Inscribe whatever is stirring in your mind... What decision is looming? Where is tension accumulating?"
                  className="w-full flex-1 min-h-[240px] resize-none bg-transparent border-none focus:outline-none text-white/90 placeholder-white/25 text-base sm:text-lg leading-relaxed font-sans font-light"
                />

                {/* Prompt Sparkler Suggestions */}
                <div className="mb-4 pt-3 border-t border-white/5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-2">
                    Inspiration Inquiries (Click to insert):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {INSPIRATION_PROMPTS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEntry(prev => prev ? `${prev}\n\n• ${p}\n` : `• ${p}\n`)}
                        className="text-[11px] text-white/45 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white/80 border border-white/5 rounded-lg px-2.5 py-1 text-left transition-all cursor-pointer truncate max-w-full"
                      >
                        "{p}"
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom Bar: Speech Dictate + Analyze CTA */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-white/8">
                  <div className="flex items-center gap-3">
                    {/* Voice Dictation with Animated Audio Bars */}
                    <button
                      onClick={toggleListening}
                      type="button"
                      className={`px-3.5 py-1.5 rounded-full border transition-all flex items-center gap-2 text-xs font-mono cursor-pointer ${
                        isListening
                          ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 ring-1 ring-rose-400/40 shadow-lg shadow-rose-500/10'
                          : 'bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white'
                      }`}
                      title={isListening ? 'Stop recording' : 'Dictate with Voice'}
                    >
                      {isListening ? (
                        <>
                          <div className="flex items-center gap-0.5 h-3.5">
                            <span className="w-0.5 h-3 bg-rose-400 animate-[bounce_0.6s_infinite]" />
                            <span className="w-0.5 h-4 bg-rose-400 animate-[bounce_0.6s_infinite_0.15s]" />
                            <span className="w-0.5 h-2 bg-rose-400 animate-[bounce_0.6s_infinite_0.3s]" />
                            <span className="w-0.5 h-3.5 bg-rose-400 animate-[bounce_0.6s_infinite_0.45s]" />
                          </div>
                          <span>Listening...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5 text-dharma-flame" />
                          <span>Voice Dictate</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Primary CTA */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAnalyze}
                    disabled={!entry.trim() || isAnalyzing}
                    className="btn-liquid-primary !py-2.5 !px-7 !text-xs w-full sm:w-auto disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Synthesizing Wisdom...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Synthesize & Inscribe</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                      </>
                    )}
                  </motion.button>
                </div>

              </div>
            </div>

            {/* AI Reflection Output: Bespoke Wisdom Dossier */}
            <div className="lg:col-span-5 h-full">
              <AnimatePresence mode="wait">
                {analysis ? (
                  <motion.div
                    key="analysis"
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="liquid-glass-strong rounded-[28px] p-6 sm:p-7 border border-white/[0.14] shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl space-y-6 relative overflow-hidden"
                  >
                    {/* Header Row */}
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-dharma-flame font-bold block mb-0.5">
                          Synthesized Insight
                        </span>
                        <h4 className="font-serif italic text-lg text-white font-medium">
                          {journalTitle}
                        </h4>
                      </div>

                      <button
                        onClick={() => exportDigest()}
                        className="p-2 rounded-full bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                        title="Download formatted reflection (.txt)"
                      >
                        {downloadSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4 text-dharma-flame" />}
                      </button>
                    </div>

                    {/* Decode 1: Root Cause & Psychological Reality */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300 font-semibold">
                          I. Root Psychological Pattern
                        </span>
                      </div>
                      <p className="text-white/85 text-xs sm:text-sm font-sans leading-relaxed bg-white/[0.03] p-4 rounded-2xl border border-white/8">
                        {analysis.insights}
                      </p>
                    </div>

                    {/* Decode 2: Ancient Wisdom Anchor */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="text-[11px] font-mono uppercase tracking-widest text-amber-300 font-semibold">
                          II. Timeless Wisdom Anchor
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-sky-500/5 to-purple-500/10 border border-amber-500/20">
                        <p className="text-white/95 font-serif italic text-sm sm:text-base leading-relaxed">
                          "{analysis.wisdom}"
                        </p>
                      </div>
                    </div>

                    {/* Decode 3: 24-Hour Action Protocol */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-300 font-semibold">
                          III. Immediate 24-Hour Protocol
                        </span>
                      </div>
                      <div className="space-y-2">
                        {Array.isArray(analysis.actions) ? (
                          analysis.actions.map((act, idx) => {
                            const isDone = completedActions.includes(idx);
                            return (
                              <button
                                key={idx}
                                onClick={() => toggleActionItem(idx)}
                                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 text-xs ${
                                  isDone
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 line-through opacity-70'
                                    : 'bg-white/[0.02] border-white/8 text-white/80 hover:bg-white/[0.06]'
                                }`}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                  <Circle className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
                                )}
                                <span>{act}</span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-3 bg-white/[0.02] rounded-xl border border-white/8 text-xs text-white/80">{analysis.actions}</div>
                        )}
                      </div>
                    </div>

                    {/* Decode 4: Cognitive Reframe */}
                    {analysis.reframe && (
                      <div className="pt-2">
                        <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200/90 text-xs font-sans leading-relaxed">
                          <span className="font-mono uppercase tracking-wider text-[10px] text-purple-300 font-bold block mb-1">
                            IV. Core Cognitive Reframe:
                          </span>
                          {analysis.reframe}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="liquid-glass-strong rounded-[28px] p-8 border border-white/8 h-full min-h-[420px] flex flex-col items-center justify-center text-center backdrop-blur-2xl">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-5 text-dharma-flame">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="text-white font-serif italic text-2xl mb-2" style={{ fontFamily: "'Instrument Serif', 'Playfair Display', serif" }}>
                      Awaiting Your Inquiry
                    </h3>
                    <p className="text-white/40 text-xs sm:text-sm max-w-xs leading-relaxed font-light">
                      Inscribe your thoughts on the left and select your state of mind. Noerax will distill your entry into a 4-part executive clarity brief.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>
        )}

        {/* ARCHIVAL VAULT MODE */}
        {viewMode === 'vault' && (
          <div className="liquid-glass-strong rounded-[28px] p-6 sm:p-9 border border-white/[0.12] shadow-2xl backdrop-blur-2xl">
            
            {/* Search & Statistics Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-6 border-b border-white/8">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={vaultSearch}
                  onChange={(e) => setVaultSearch(e.target.value)}
                  placeholder="Filter archived reflections..."
                  className="w-full pl-11 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-full text-xs sm:text-sm text-white placeholder-white/35 focus:outline-none focus:border-dharma-flame transition-all"
                />
              </div>

              <span className="text-xs text-white/40 font-mono">
                {filteredVault.length} Archived Document{filteredVault.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Vault Cards Grid */}
            {filteredVault.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-5">
                {filteredVault.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white/[0.02] border border-white/8 rounded-2xl p-5 hover:border-dharma-flame/40 hover:bg-white/[0.04] transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h4 className="font-serif italic text-lg text-white font-medium mb-1">
                            {item.title || 'Untitled Reflection'}
                          </h4>
                          <span className="text-[10px] text-white/35 font-mono">
                            {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        {item.mood && (
                          <span className="px-2.5 py-0.5 bg-white/5 rounded-full text-[10px] text-white/70 border border-white/10 font-mono">
                            {item.mood}
                          </span>
                        )}
                      </div>

                      <p className="text-white/60 text-xs leading-relaxed font-sans line-clamp-3 mb-4 font-light">
                        "{item.entryText}"
                      </p>

                      {item.insights && (
                        <div className="p-3 bg-dharma-flame/5 rounded-xl border border-dharma-flame/15 mb-4">
                          <p className="text-[11px] text-dharma-flame/90 leading-snug line-clamp-2">
                            💡 {item.insights}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                      <button
                        onClick={() => copyToClipboard(item.entryText, item._id)}
                        className="text-white/40 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedId === item._id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === item._id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => exportDigest(item.title, item.entryText, { insights: item.insights, wisdom: item.wisdom, actions: item.actions, tone: item.tone, reframe: item.reframe })}
                          className="text-dharma-flame hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export</span>
                        </button>
                        <button
                          onClick={() => deleteVaultItem(item._id)}
                          className="text-rose-400/50 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <FolderHeart className="w-12 h-12 text-white/15 mx-auto mb-3" />
                <h4 className="text-white font-serif italic text-xl mb-1">Your Vault is Empty</h4>
                <p className="text-white/40 text-xs max-w-sm mx-auto mb-6 font-light">
                  Reflect and analyze from the studio tab to build your permanent personal wisdom vault.
                </p>
                <button
                  onClick={() => setViewMode('write')}
                  className="btn-liquid-primary !py-2 !px-6 !text-xs"
                >
                  Write First Inquiry
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </motion.section>
  );
}
