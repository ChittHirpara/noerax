import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PenLine, Sparkles, BookHeart, Compass, Activity, Loader2, Mic, MicOff, Download, Search, Calendar, FolderHeart, Check, Edit3, Bookmark, Trash2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

interface SavedJournal {
  _id: string;
  title?: string;
  entryText: string;
  insights?: string;
  wisdom?: string;
  actions?: string[];
  tone?: string;
  createdAt: string;
}

export function Journal() {
  const { token } = useAuth();
  const [viewMode, setViewMode] = useState<'write' | 'vault'>('write');
  
  const [journalTitle, setJournalTitle] = useState('Daily Reflection');
  const [entry, setEntry] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [analysis, setAnalysis] = useState<{
    insights: string;
    wisdom: string;
    actions: string | string[];
    tone: string;
  } | null>(null);

  // Vault state
  const [vaultEntries, setVaultEntries] = useState<SavedJournal[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [vaultSearch, setVaultSearch] = useState('');

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

  const handleAnalyze = async () => {
    if (!entry.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysis(null);

    let resultData = null;

    try {
      const response = await fetch('/api/analyze-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: journalTitle, entry, token })
      });

      if (!response.ok) throw new Error('Failed to analyze');
      resultData = await response.json();
    } catch (error) {
      console.error('Analysis API error, using fallback:', error);
      resultData = {
        insights: 'Your reflections show a conscious desire for presence and clarity. Taking time to express your inner state is the first step toward self-mastery.',
        wisdom: "Bhagavad Gita 2.47: 'Perform your duty without attachment to outcomes.'",
        actions: ['Practice 5 minutes of quiet breathwork to center your focus.', 'Journal 3 things you are grateful for before going to sleep.'],
        tone: 'Seeking Clarity & Presence'
      };
    } finally {
      setIsAnalyzing(false);
    }

    setAnalysis(resultData);

    // Save to Vault state & localStorage immediately!
    const newEntry: SavedJournal = {
      _id: `j-${Date.now()}`,
      title: journalTitle.trim() || 'Daily Reflection',
      entryText: entry,
      insights: resultData.insights,
      wisdom: resultData.wisdom,
      actions: Array.isArray(resultData.actions) ? resultData.actions : [resultData.actions],
      tone: resultData.tone,
      createdAt: new Date().toISOString()
    };

    const updatedVault = [newEntry, ...vaultEntries.filter(item => item._id !== newEntry._id)];
    setVaultEntries(updatedVault);
    try {
      localStorage.setItem('noerax_saved_journals', JSON.stringify(updatedVault));
    } catch (e) {}

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const deleteVaultItem = (id: string) => {
    const updated = vaultEntries.filter(item => item._id !== id);
    setVaultEntries(updated);
    try {
      localStorage.setItem('noerax_saved_journals', JSON.stringify(updated));
    } catch (e) {}
  };

  // Export Reflection Digest as a beautifully formatted text file download
  const exportDigest = (customTitle?: string, customEntry?: string, customAnalysis?: any) => {
    const titleToExport = customTitle || journalTitle;
    const textToExport = customEntry || entry;
    const analysisToExport = customAnalysis || analysis;

    if (!textToExport) return;

    const formattedActions = Array.isArray(analysisToExport?.actions)
      ? analysisToExport.actions.map((a: string) => `  • ${a}`).join('\n')
      : `  • ${analysisToExport?.actions || 'Reflect on presence'}`;

    const content = `===================================================
NOERAX MINDFUL JOURNAL REFLECTION
Title: ${titleToExport}
Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Emotional Tone: ${analysisToExport?.tone || 'Reflective'}
===================================================

MY JOURNAL ENTRY:
"${textToExport}"

KEY AI INSIGHT:
${analysisToExport?.insights || 'Self-awareness is the root of clarity.'}

ANCIENT WISDOM ANCHOR:
${analysisToExport?.wisdom || "Bhagavad Gita 2.47: 'Perform your duty without attachment to outcomes.'"}

ACTIONABLE NEXT STEPS:
${formattedActions}

===================================================
Downloaded from Noerax Sanctuary — www.noerax.com
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
    (item.tone && item.tone.toLowerCase().includes(vaultSearch.toLowerCase()))
  );

  return (
    <motion.section 
      initial={{ opacity: 0, y: 50 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, margin: "-100px" }} 
      transition={{ duration: 0.8, ease: "easeOut" }} 
      id="journal" 
      className="py-32 bg-dharma-ink relative"
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="w-12 h-12 sm:w-16 sm:h-16 bg-dharma-ivory/5 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
          >
            <PenLine className="w-6 h-6 sm:w-8 sm:h-8 text-dharma-ivory" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-2xl sm:text-4xl md:text-5xl text-dharma-ivory mb-4"
          >
            Notes & Application Vault
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-dharma-ivory-dim text-sm sm:text-lg max-w-xl mx-auto mb-8"
          >
            Document what you learned, decisions you made, and how you applied them to real life.
          </motion.p>

          {/* View Mode Switcher */}
          <div className="inline-flex flex-col sm:flex-row bg-dharma-ink-2 p-1.5 rounded-2xl sm:rounded-full border border-dharma-line-dark shadow-lg gap-1 sm:gap-0 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('write')}
              className={`px-5 sm:px-6 py-2.5 rounded-xl sm:rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'write'
                  ? 'bg-dharma-flame text-white shadow-md'
                  : 'text-dharma-ivory-dim hover:text-dharma-ivory'
              }`}
            >
              <PenLine className="w-4 h-4" /> Write Reflection
            </button>
            <button
              onClick={() => setViewMode('vault')}
              className={`px-5 sm:px-6 py-2.5 rounded-xl sm:rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'vault'
                  ? 'bg-dharma-flame text-white shadow-md'
                  : 'text-dharma-ivory-dim hover:text-dharma-ivory'
              }`}
            >
              <FolderHeart className="w-4 h-4" /> Saved Reflections Vault ({vaultEntries.length})
            </button>
          </div>
        </div>

        {/* WRITE MODE */}
        {viewMode === 'write' && (
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Writing Area */}
            <div className="lg:col-span-7 flex flex-col h-full min-h-[420px]">
              <div className="bg-dharma-ink-2 border border-dharma-line-dark rounded-3xl p-6 shadow-sm flex flex-col h-full relative group transition-shadow hover:shadow-md">
                
                {/* Journal Title Input */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-dharma-line-dark">
                  <Edit3 className="w-4 h-4 text-dharma-flame" />
                  <input
                    type="text"
                    value={journalTitle}
                    onChange={(e) => setJournalTitle(e.target.value)}
                    placeholder="Title your reflection..."
                    className="bg-transparent text-xl font-serif text-dharma-ivory border-none focus:outline-none w-full"
                  />
                  {saveSuccess && (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 animate-bounce">
                      <Check className="w-3.5 h-3.5" /> Saved to Vault!
                    </span>
                  )}
                </div>

                <textarea
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder="What's on your mind today? Type or click the microphone to dictate your thoughts..."
                  className="w-full flex-1 min-h-[280px] resize-none bg-transparent border-none focus:outline-none text-dharma-ivory placeholder-dharma-ivory-dim/40 text-lg leading-relaxed font-serif"
                />

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-dharma-line-dark">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-dharma-ivory-dim font-medium uppercase tracking-widest">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>

                    {/* Speech Dictation Mic Button */}
                    <button
                      onClick={toggleListening}
                      type="button"
                      className={`p-2 rounded-full border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                        isListening
                          ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                          : 'bg-dharma-ink-3 border-dharma-line-dark text-dharma-ivory-dim hover:text-dharma-ivory'
                      }`}
                      title={isListening ? 'Stop Listening' : 'Speak to Journal'}
                    >
                      {isListening ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-dharma-flame" />}
                      <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
                    </button>
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={!entry.trim() || isAnalyzing}
                    className="flex items-center gap-2 px-6 py-2.5 bg-dharma-flame text-white rounded-full text-sm font-semibold hover:bg-dharma-saffron transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-dharma-flame/30 cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Reflecting & Saving...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Save & Analyze
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Analysis Output & Export Digest */}
            <div className="lg:col-span-5 h-full">
              <AnimatePresence mode="wait">
                {analysis ? (
                  <motion.div
                    key="analysis"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="bg-dharma-ink-2 border border-dharma-line-dark rounded-3xl p-8 shadow-lg space-y-6 relative"
                  >
                    <div className="flex justify-between items-start">
                      <span className="inline-block px-3 py-1 bg-dharma-flame/10 text-dharma-flame border border-dharma-flame/20 rounded-full text-xs font-semibold uppercase tracking-wider">
                        Tone: {analysis.tone}
                      </span>

                      {/* Download Digest Button */}
                      <button
                        onClick={() => exportDigest()}
                        className="p-2 rounded-full bg-dharma-ink-3 border border-dharma-line-dark text-dharma-ivory-dim hover:text-dharma-ivory hover:border-dharma-flame/40 transition-all cursor-pointer relative"
                        title="Export Reflection (.txt)"
                      >
                        {downloadSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4 text-dharma-flame" />}
                      </button>
                    </div>

                    <div>
                      <h3 className="font-serif text-2xl text-dharma-ivory mb-2 flex items-center gap-2">
                        <BookHeart className="w-5 h-5 text-dharma-flame" /> Key Insight
                      </h3>
                      <p className="text-dharma-ivory-dim leading-relaxed text-sm">
                        {analysis.insights}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-dharma-line-dark">
                      <h4 className="font-serif text-lg text-dharma-ivory mb-2 flex items-center gap-2">
                        <Compass className="w-5 h-5 text-cyan-400" /> Ancient Wisdom Anchor
                      </h4>
                      <p className="text-dharma-ivory-dim font-serif italic text-sm bg-dharma-ink-3/50 p-4 rounded-xl border border-dharma-line-dark">
                        "{analysis.wisdom}"
                      </p>
                    </div>

                    <div className="pt-6 border-t border-dharma-line-dark">
                      <h4 className="font-serif text-lg text-dharma-ivory mb-2 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-400" /> Actionable Next Steps
                      </h4>
                      <ul className="text-dharma-ivory-dim text-sm space-y-2 list-disc list-inside">
                        {Array.isArray(analysis.actions) ? (
                          analysis.actions.map((act: string, idx: number) => (
                            <li key={idx}>{act}</li>
                          ))
                        ) : (
                          <li>{analysis.actions}</li>
                        )}
                      </ul>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-dharma-ink-2/50 border border-dharma-line-dark border-dashed rounded-3xl p-8 h-full flex flex-col items-center justify-center text-center text-dharma-ivory-dim/40 min-h-[400px]">
                    <Sparkles className="w-12 h-12 mb-4 text-dharma-flame/40" />
                    <p className="font-serif text-lg text-dharma-ivory-dim">Your Reflection will appear here</p>
                    <p className="text-xs text-dharma-ivory-dim/60 mt-1 max-w-xs">Title your reflection and click "Save & Analyze" to generate AI insights and store in your vault.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* SAVED VAULT MODE */}
        {viewMode === 'vault' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="w-4 h-4 text-dharma-ivory-dim absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reflections by title, content or tone..."
                value={vaultSearch}
                onChange={(e) => setVaultSearch(e.target.value)}
                className="w-full bg-dharma-ink-2 border border-dharma-line-dark rounded-full pl-11 pr-4 py-3 text-sm text-dharma-ivory placeholder-dharma-ivory-dim/40 focus:outline-none focus:border-dharma-flame transition-colors"
              />
            </div>

            {/* Vault Grid */}
            {isLoadingVault ? (
              <div className="py-16 text-center text-dharma-flame flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading reflections from vault...
              </div>
            ) : filteredVault.length === 0 ? (
              <div className="py-16 text-center bg-dharma-ink-2/40 border border-dharma-line-dark border-dashed rounded-3xl p-12">
                <FolderHeart className="w-12 h-12 text-dharma-ivory-dim/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-dharma-ivory">No saved reflections found</p>
                <p className="text-xs text-dharma-ivory-dim mt-1">Write and save your reflections to store them in your permanent vault.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredVault.map((item) => (
                  <div key={item._id} className="bg-dharma-ink-2 border border-dharma-line-dark rounded-3xl p-6 shadow-md flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-serif text-xl text-dharma-ivory font-semibold">{item.title || 'Daily Reflection'}</h4>
                        {item.tone && (
                          <span className="px-2.5 py-0.5 rounded-full bg-dharma-flame/10 text-dharma-flame border border-dharma-flame/20 text-[11px] font-semibold">
                            {item.tone}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-dharma-flame mb-3 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>

                      <p className="text-sm text-dharma-ivory font-serif italic mb-4 bg-dharma-ink-3/40 p-3 rounded-xl border border-dharma-line-dark">
                        "{item.entryText}"
                      </p>

                      {item.insights && (
                        <div className="text-xs text-dharma-ivory-dim space-y-1">
                          <span className="text-dharma-ivory font-medium block">Key Insight:</span>
                          <p>{item.insights}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-dharma-line-dark flex justify-between items-center">
                      <button
                        onClick={() => deleteVaultItem(item._id)}
                        className="text-dharma-ivory-dim/60 hover:text-red-400 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Delete reflection"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                      <button
                        onClick={() => exportDigest(item.title, item.entryText, item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dharma-ink-3 border border-dharma-line-dark text-dharma-ivory text-xs hover:border-dharma-flame/40 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-dharma-flame" /> Export (.txt)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </motion.section>
  );
}
