import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, BookOpen, Heart, Loader2, Search, Headphones, Download, X } from "lucide-react";

const scriptures = [
  {
    id: "gita-2-47",
    title: "Bhagavad Gita",
    chapter: "Chapter 2, Verse 47",
    text: "You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.",
    theme: "Letting Go of Outcomes"
  },
  {
    id: "patanjali-1-2",
    title: "Yoga Sutras",
    chapter: "Sutra 1.2",
    text: "Yoga is the cessation of the fluctuations of the mind.",
    theme: "Mental Stillness"
  },
  {
    id: "upanishads-isa",
    title: "Isha Upanishad",
    chapter: "Verse 1",
    text: "All this, whatever moves in this moving world, is enveloped by God.",
    theme: "Interconnectedness"
  }
];

const suggestedTopics = ["Anxiety", "Purpose", "Peace", "Focus", "Letting Go", "Clarity"];

export function Library() {
  const [selectedScripture, setSelectedScripture] = useState(scriptures[0]);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedScriptureIds, setSavedScriptureIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPdfOpen, setIsPdfOpen] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const fetchExplanation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/explain-scripture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: selectedScripture.text,
          source: `${selectedScripture.title}, ${selectedScripture.chapter}`,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch explanation.");
      }
      
      setExplanation(data.explanation);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset explanation when changing scripture
  const handleSelect = (s: typeof scriptures[0]) => {
    setSelectedScripture(s);
    setExplanation(null);
    setError(null);
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedScriptureIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = explanation 
      ? `Original text: ${selectedScripture.text}. Explanation: ${explanation}`
      : selectedScripture.text;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const savedScriptures = scriptures.filter(s => savedScriptureIds.includes(s.id));

  const filteredScriptures = scriptures.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.theme.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stop speech when component unmounts
  React.useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <motion.section initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: "easeOut" }} id="library" className="py-32 bg-black relative">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-4xl md:text-5xl text-white mb-6"
          >
            Ancient Texts. Modern Clarity.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-lg max-w-2xl mx-auto"
          >
            Explore the wisdom of the ages. Ask the AI Guide to translate timeless scriptures into actionable advice for your daily life.
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto mb-16 relative"
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Search scriptures, themes, or verses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-full text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-all shadow-sm hover:shadow-md"
            />
          </div>
          
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {suggestedTopics.map(topic => (
              <button
                key={topic}
                onClick={() => setSearchQuery(topic)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  searchQuery.toLowerCase() === topic.toLowerCase()
                    ? "bg-white text-black shadow-md"
                    : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </motion.div>

        {savedScriptures.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-12 overflow-hidden"
          >
            <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
              <Heart className="w-5 h-5 text-white fill-current" />
              Saved Wisdom
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedScriptures.map((s, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  key={`saved-${s.id}`} 
                  onClick={() => handleSelect(s)}
                  className="p-5 rounded-xl border border-zinc-700 bg-zinc-900 cursor-pointer hover:bg-zinc-800 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-serif text-white text-lg">{s.title}</h4>
                    <button 
                      onClick={(e) => toggleSave(e, s.id)}
                      className="p-1.5 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                      title="Remove from saved"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">"{s.text}"</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-12 gap-12">
          {/* List of Scriptures */}
          <div className="lg:col-span-4 space-y-4">
            {filteredScriptures.length > 0 ? (
              filteredScriptures.map((s, idx) => (
                <motion.div
                  key={s.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handleSelect(s)}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  selectedScripture.id === s.id 
                    ? "bg-zinc-800 border-zinc-600 shadow-md" 
                    : "bg-zinc-950 border-zinc-800 hover:bg-zinc-900"
                }`}
              >
                <div className="mb-2">
                  <h3 className="text-xl font-serif text-white mb-1">{s.theme}</h3>
                </div>
              </motion.div>
            ))
            ) : (
              <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                No scriptures found matching "{searchQuery}"
              </div>
            )}
          </div>

          {/* Detailed View & AI Explanation */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedScripture.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 md:p-12 relative overflow-hidden"
              >
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10">
                  <h3 className="text-2xl font-serif text-white mb-8">{selectedScripture.theme}</h3>
                  
                  <blockquote className="text-2xl md:text-3xl text-zinc-300 font-light leading-relaxed mb-12 italic border-l-4 border-zinc-700 pl-6">
                    "{selectedScripture.text}"
                  </blockquote>

                  <div className="flex flex-wrap gap-4 items-center">
                    {!explanation && !loading && !error && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={fetchExplanation}
                        className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-full text-white font-medium transition-colors"
                      >
                        <Sparkles className="w-5 h-5 text-white" />
                        Ask AI Guide for meaning
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`inline-flex items-center gap-3 px-6 py-3 border rounded-full font-medium transition-colors ${
                        isSpeaking ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white'
                      }`}
                      onClick={handleSpeak}
                    >
                      <Headphones className={`w-5 h-5 ${isSpeaking ? 'text-black' : 'text-zinc-400'}`} />
                      {isSpeaking ? 'Stop Audio' : 'Listen to Audio'}
                    </motion.button>
                  </div>

                  {loading && (
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <span>Consulting the ancient wisdom...</span>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                      {error}
                      <p className="mt-2 text-xs opacity-70">Check if your GEMINI_API_KEY is configured in the settings.</p>
                    </div>
                  )}

                  {explanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-8 pt-8 border-t border-zinc-800"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-black" />
                        </div>
                        <h4 className="text-white font-medium">AI Guide Explanation</h4>
                      </div>
                      <div className="text-zinc-300 leading-relaxed space-y-4">
                        {explanation.split('\n\n').map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      <AnimatePresence>
        {isPdfOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-950 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl border border-zinc-800 flex flex-col overflow-hidden relative"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
                <div>
                  <h3 className="font-serif text-xl text-white">{selectedScripture.title}</h3>
                  <p className="text-sm text-zinc-400">Original Source Text</p>
                </div>
                <button
                  onClick={() => setIsPdfOpen(false)}
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* PDF Viewer Content */}
              <div className="flex-1 bg-black overflow-hidden relative">
                {/* Since we don't have an actual PDF, we'll embed a stylized placeholder view that looks like a document */}
                <div className="absolute inset-0 overflow-y-auto p-12 md:p-24 bg-[#111] flex justify-center">
                  <div className="w-full max-w-3xl bg-zinc-950 shadow-lg p-12 md:p-20 min-h-full border border-zinc-800">
                    <h1 className="text-4xl font-serif text-white mb-8 text-center">{selectedScripture.title}</h1>
                    <h2 className="text-xl text-zinc-400 mb-12 text-center">{selectedScripture.chapter}</h2>
                    
                    <div className="space-y-8 text-zinc-300 text-lg leading-relaxed font-serif">
                      <p className="text-center italic mb-12 text-2xl">"{selectedScripture.text}"</p>
                      
                      <p>
                        In the ancient traditions, this verse is considered a cornerstone of understanding the self. 
                        The profound wisdom contained within these lines speaks directly to the modern struggle of 
                        finding peace amidst chaos.
                      </p>
                      <p>
                        As we delve deeper into the commentary, we see that the sages intended this not just as 
                        a philosophical concept, but as a practical guide for daily living.
                      </p>
                      <p className="text-zinc-500 italic mt-8">
                        (Full translation and commentary would be displayed here in the actual application, 
                        often spanning multiple pages with Sanskrit/Pali roots alongside English translation.)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}




