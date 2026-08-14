import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Heart, Search, Headphones, ArrowUpRight, MessageSquareQuote, Volume2, VolumeX, Shield, Clock, Compass, Layers, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";

interface Scripture {
  id: string;
  category: "gita" | "stoic" | "tao" | "yoga" | "upanishad" | "buddhist";
  categoryLabel: string;
  title: string;
  chapter: string;
  era: string;
  originalText?: string;
  text: string;
  theme: string;
  mentalTrap: string;
  corePrinciple: string;
  modernContext: string;
  actionProtocol: string;
}

const SCRIPTURES: Scripture[] = [
  {
    id: "gita-2-47",
    category: "gita",
    categoryLabel: "Bhagavad Gita",
    title: "Bhagavad Gita",
    chapter: "Chapter 2, Verse 47",
    era: "c. 500 BCE · Kurukshetra Dialogue",
    originalText: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
    text: "You have a right to your actions, but never to the fruits of action. Never consider yourself the cause of results, nor be attached to inaction.",
    theme: "Dichotomy of Action & Detachment",
    mentalTrap: "Outcome Obsession & Analysis Paralysis",
    corePrinciple: "The psychological separation of process and reward. Anxiety is generated entirely by attempting to govern variables outside your direct nervous system. When you invest 100% of your cognitive bandwidth into execution without negotiating with the future, peak performance emerges naturally.",
    modernContext: "When pitching an investor, launching a software product, or having a critical conversation: channel every ounce of energy into craftsmanship and presence. Relinquish all emotional claims to how the other party reacts, reviews, or judges.",
    actionProtocol: "Before beginning any high-stakes project today, write down: 'My responsibility ends with flawless preparation and honest effort; the outcome belongs to the universe.'"
  },
  {
    id: "gita-6-5",
    category: "gita",
    categoryLabel: "Bhagavad Gita",
    title: "Bhagavad Gita",
    chapter: "Chapter 6, Verse 5",
    era: "c. 500 BCE · Self-Mastery Discourse",
    originalText: "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्। आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥",
    text: "Elevate yourself through the power of your own mind, and do not degrade yourself. For the mind can be the greatest friend of the self, or its greatest enemy.",
    theme: "Self-Sovereignty & Internal Dialogue",
    mentalTrap: "Destructive Self-Talk & Helplessness",
    corePrinciple: "The mind is not an immutable identity; it is an instrument. Without conscious stewardship, the default narrative of the untrained mind defaults to catastrophizing and self-sabotage. You are the observer who trains the instrument.",
    modernContext: "When imposter syndrome strikes after a mistake or setback: recognize the inner critic as an uncalibrated threat-detection algorithm, not an objective statement of truth.",
    actionProtocol: "Notice the very next negative self-statement today. Mentally step back and ask: 'Would I speak to a close friend or protégé in this tone?'"
  },
  {
    id: "stoic-meditations-4-3",
    category: "stoic",
    categoryLabel: "Stoic Philosophy",
    title: "Meditations",
    chapter: "Book 4, Section 3 — Marcus Aurelius",
    era: "c. 175 CE · Roman Imperial Journal",
    originalText: "The universe is change; our life is what our thoughts make it.",
    text: "You have power over your mind — not outside events. Realize this, and you will find strength. Nowhere can man find a quieter or more untroubled retreat than in his own soul.",
    theme: "The Inner Citadel",
    mentalTrap: "Environmental Reactivity & External Blame",
    corePrinciple: "The concept of the Inner Fortress (Arx). External circumstances (criticism, economic downturns, organizational turbulence) possess no direct access to your state of tranquility unless your judgment opens the gate.",
    modernContext: "Notifications, aggressive emails, and volatile markets will attempt to hijack your attention. Your cognitive boundary is the sanctuary between external stimulus and your internal response.",
    actionProtocol: "Institute a mandatory 10-second breath buffer before responding to inflammatory emails or stressful messages."
  },
  {
    id: "epictetus-enchiridion-1",
    category: "stoic",
    categoryLabel: "Stoic Philosophy",
    title: "The Enchiridion",
    chapter: "Section 1 — Epictetus",
    era: "c. 135 CE · Greek Stoic Academy",
    originalText: "Some things are within our control, and some things are not.",
    text: "Some things are in our control and others not. Things in our control are opinion, pursuit, desire, aversion, and, in a word, whatever are our own actions. Things not in our control are body, property, reputation, command, and whatever are not our own actions.",
    theme: "The Fundamental Circle of Control",
    mentalTrap: "Fighting Uncontrollable Realities",
    corePrinciple: "Epictetus divides all existence into two mutually exclusive buckets: that which is your direct choice, and that which is external. Suffering exists solely in the confusion of attempting to govern the latter.",
    modernContext: "You can control your sleep hygiene, preparation, and tone of voice; you cannot control traffic, algorithms, or client decisions. Divert 0% of your nervous energy toward the uncontrollable bucket.",
    actionProtocol: "Draw two columns on a blank index card: 'My Influence' vs 'External Reality'. Categorize your primary anxiety right now."
  },
  {
    id: "patanjali-1-2",
    category: "yoga",
    categoryLabel: "Yoga Sutras",
    title: "Yoga Sutras",
    chapter: "Sutra 1.2 — Patanjali",
    era: "c. 400 CE · Classical Sanskrit Psychology",
    originalText: "योगश्चित्तवृत्तिनिरोधः (Yogas Chitta Vritti Nirodhah)",
    text: "Yoga is the cessation of the modifications and fluctuations of the mind-stuff.",
    theme: "Mental Stillness & Neural Calibrations",
    mentalTrap: "Overthinking & Dopamine Fragmentation",
    corePrinciple: "The mind (*chitta*) behaves like the surface of a lake. When agitated by sensory overload (*vrittis*), perception is distorted. When the turbulence is stilled, the true nature of reality is reflected with absolute fidelity.",
    modernContext: "In an era of relentless algorithmic stimulation, mental clarity is a competitive advantage. Stillness is not the absence of thought, but the mastery of conscious attention.",
    actionProtocol: "Engage in 5 minutes of stillness without looking at screens upon waking. Observe thoughts like ripples on water without jumping into the current."
  },
  {
    id: "tao-te-ching-8",
    category: "tao",
    categoryLabel: "Tao & Zen",
    title: "Tao Te Ching",
    chapter: "Chapter 8 — Lao Tzu",
    era: "c. 6th Century BCE · Classical Taoist Canon",
    originalText: "上善若水。水善利萬物而不爭，處衆人之所惡，故幾於道。",
    text: "The highest goodness is like water. It benefits all things without competing, and stays in places people disdain. Therefore it is like the Tao.",
    theme: "Wu Wei — Effortless Action",
    mentalTrap: "Ego-Driven Force & Resistance",
    corePrinciple: "The principle of yielding to overcome rigidity. Hard and brittle things shatter under pressure; water adapts to the container, flows around obstacles, and shapes stone through patient persistence without conflict.",
    modernContext: "When dealing with stubborn negotiations or difficult personalities, avoid aggressive confrontation. Yield, redirect the energy, and allow the natural momentum to resolve the stalemate.",
    actionProtocol: "Where are you currently forcing a situation with sheer friction? Step back, yield slightly, and seek the path of least resistance."
  },
  {
    id: "upanishads-isa-1",
    category: "upanishad",
    categoryLabel: "Upanishads",
    title: "Isha Upanishad",
    chapter: "Verse 1",
    era: "c. 800 BCE · Vedic Non-Dual Philosophy",
    originalText: "ईशा वास्यमिदं सर्वं यत्किञ्च जगत्यां जगत्। तेन त्यक्तेन भुञ्जीथा मा गृधः कस्यस्विद्धनम्॥",
    text: "All this is enveloped by the Divine. Enjoy the world through renunciation and detachment; do not covet anyone's wealth.",
    theme: "Freedom from Scarcity & Comparison",
    mentalTrap: "FOMO & Scarcity Mindset",
    corePrinciple: "True abundance (*purnam*) is the realization that life is intrinsically complete. Grasping and covetousness stem from the illusion of lack. By letting go of possessiveness, you become free to experience life deeply.",
    modernContext: "Social media creates synthetic scarcity and constant comparison. Recognizing that another person's success does not diminish your worth eliminates jealousy and restores peace.",
    actionProtocol: "Identify one thing you are anxiously trying to hoard or control (status, validation, material outcomes) and consciously practice detached enjoyment."
  },
  {
    id: "dhammapada-1-1",
    category: "buddhist",
    categoryLabel: "Buddhist Psychology",
    title: "The Dhammapada",
    chapter: "Chapter 1, Verses 1–2 — Gautama Buddha",
    era: "c. 5th Century BCE · Theravada Canon",
    originalText: "मनोपुब्बङ्गमा धम्मा मनोसेट्ठा मनोमया (Mano pubbangama dhamma mano settha manomaya)",
    text: "Mind precedes all mental states. Mind is their chief; they are all mind-wrought. If with a pure mind one speaks or acts, happiness follows like a shadow that never leaves.",
    theme: "Cognitive Architecture of Reality",
    mentalTrap: "Passive Victimhood & Unconscious Inputs",
    corePrinciple: "Experience is constructed from internal interpretation rather than raw external data. Your subjective reality is the compounding result of what you choose to dwell upon and reinforce with attention.",
    modernContext: "Your inputs dictate your internal state. Curate your information diet (books, feeds, conversations) with the same rigor you would apply to clean nutrition.",
    actionProtocol: "Conduct a 24-hour information audit: eliminate low-grade rage-bait feeds and replace 20 minutes of doomscrolling with purposeful contemplation."
  }
];

const CATEGORIES = [
  { id: "all", label: "All Frameworks" },
  { id: "gita", label: "Bhagavad Gita" },
  { id: "stoic", label: "Stoic Philosophy" },
  { id: "yoga", label: "Yoga Sutras" },
  { id: "tao", label: "Tao & Zen" },
  { id: "upanishad", label: "Upanishads" },
  { id: "buddhist", label: "Buddhist Psychology" },
];

export function Library() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedScripture, setSelectedScripture] = useState<Scripture>(SCRIPTURES[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"wisdom" | "modern" | "action">("wisdom");

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.95);

  const toggleSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleSelect = (s: Scripture) => {
    setSelectedScripture(s);
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${selectedScripture.title}, ${selectedScripture.chapter}. ${selectedScripture.text}. Core principle: ${selectedScripture.corePrinciple}. Real world application: ${selectedScripture.modernContext}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  React.useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const filteredScriptures = SCRIPTURES.filter(s => {
    const matchesCategory = selectedCategory === "all" || s.category === selectedCategory;
    const matchesSearch = 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.mentalTrap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.chapter.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <motion.section 
      initial={{ opacity: 0, y: 50 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, margin: "-100px" }} 
      transition={{ duration: 0.8, ease: "easeOut" }} 
      id="library" 
      className="py-20 sm:py-28 md:py-36 bg-[#070709] relative overflow-hidden text-white"
    >
      {/* Ambient background light gradients */}
      <div className="absolute top-1/4 right-10 w-[550px] h-[550px] bg-dharma-flame/10 blur-[180px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-sky-500/10 blur-[180px] pointer-events-none rounded-full" />

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-14">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/15 bg-white/[0.03] text-white/80 text-[11px] font-mono tracking-[0.25em] uppercase mb-5 backdrop-blur-xl shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-dharma-flame" />
            <span>Timeless Frameworks</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif italic text-4xl sm:text-5xl md:text-6xl text-white mb-4 tracking-tight"
            style={{ fontFamily: "'Instrument Serif', 'Playfair Display', serif" }}
          >
            The Life Library
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/50 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-10 font-light leading-relaxed"
          >
            The foundational syllabus of human clarity. High-signal mental models drawn from classical philosophy, decoded for modern execution.
          </motion.p>

          {/* Clean Category Filter Switcher (No Emojis) */}
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto mb-8">
            {CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer border ${
                    isActive
                      ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white border-transparent shadow-lg shadow-sky-500/25 font-semibold"
                      : "bg-white/[0.03] border-white/10 text-white/65 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative mb-6">
            <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search frameworks, verses, or mental traps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white/[0.03] border border-white/12 rounded-full text-xs sm:text-sm text-white placeholder-white/35 focus:outline-none focus:border-dharma-flame transition-all backdrop-blur-md"
            />
          </div>
        </div>

        {/* Dual-Pane Codex View */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Pane: Scripture Cards List */}
          <div className="lg:col-span-5 space-y-3.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredScriptures.length > 0 ? (
              filteredScriptures.map((s) => {
                const isSelected = selectedScripture.id === s.id;
                const isSaved = savedIds.includes(s.id);

                return (
                  <motion.div
                    key={s.id}
                    onClick={() => handleSelect(s)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? "liquid-glass-strong border-cyan-400/50 bg-cyan-500/10 shadow-xl ring-1 ring-cyan-400/30"
                        : "bg-white/[0.02] border-white/8 hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-300 font-bold">
                            {s.categoryLabel}
                          </span>
                          <span className="text-[10px] font-mono text-white/30">·</span>
                          <span className="text-[10px] font-mono text-white/40 truncate max-w-[140px]">
                            {s.chapter}
                          </span>
                        </div>
                        <h3 className="font-serif italic text-base sm:text-lg text-white font-medium">
                          {s.theme}
                        </h3>
                      </div>

                      <button
                        onClick={(e) => toggleSave(e, s.id)}
                        className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                          isSaved
                            ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                            : "bg-white/[0.04] border-white/10 text-white/40 hover:text-white"
                        }`}
                        title={isSaved ? "Saved" : "Save to Favorites"}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
                      </button>
                    </div>

                    {/* Mental Trap Tag */}
                    <div className="mb-3">
                      <span className="text-[10px] font-mono text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        Remedy for: {s.mentalTrap}
                      </span>
                    </div>

                    <p className="text-white/60 text-xs leading-relaxed font-sans line-clamp-2 mb-3 font-light">
                      "{s.text}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-white/35 font-mono pt-2.5 border-t border-white/5">
                      <span>{s.era}</span>
                      <span className="text-cyan-300 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-medium">
                        Explore <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-16 liquid-glass-strong rounded-2xl border border-white/10 p-6">
                <Search className="w-8 h-8 mx-auto mb-2 text-white/20" />
                <p className="text-white/50 text-xs">No frameworks match "{searchQuery}"</p>
              </div>
            )}
          </div>

          {/* Right Pane: Detailed Interactive Codex & Audio */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedScripture.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="liquid-glass-strong rounded-[28px] p-6 sm:p-9 border border-white/[0.14] shadow-2xl backdrop-blur-2xl relative overflow-hidden"
              >
                {/* Header Row with Era & Audio Button */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/10 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300 font-bold">
                        {selectedScripture.title}
                      </span>
                      <span className="text-[11px] font-mono text-white/30">·</span>
                      <span className="text-[11px] font-mono text-white/50">
                        {selectedScripture.chapter}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-serif italic text-white font-semibold tracking-tight">
                      {selectedScripture.theme}
                    </h3>
                  </div>

                  {/* Audio Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSpeak}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-mono flex items-center gap-2 transition-all cursor-pointer border ${
                        isSpeaking
                          ? "bg-rose-500/20 border-rose-500/50 text-rose-300 ring-1 ring-rose-400/50 animate-pulse"
                          : "bg-white/[0.05] border-white/15 text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-300" />}
                      <span>{isSpeaking ? "Stop Audio" : "Listen (TTS)"}</span>
                    </button>
                  </div>
                </div>

                {/* Historical Origin & Mental Trap Meta Badges */}
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/10 rounded-full text-[11px] font-mono text-white/70">
                    <Clock className="w-3 h-3 text-white/40" /> {selectedScripture.era}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[11px] font-mono text-amber-200">
                    <Shield className="w-3 h-3 text-amber-300" /> Remedy: {selectedScripture.mentalTrap}
                  </span>
                </div>

                {/* Original Transliteration (if available) */}
                {selectedScripture.originalText && (
                  <div className="mb-5 p-4 rounded-2xl bg-white/[0.02] border border-white/8">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1">
                      Original Text:
                    </span>
                    <p className="font-serif italic text-white/90 text-sm sm:text-base leading-relaxed tracking-wide">
                      {selectedScripture.originalText}
                    </p>
                  </div>
                )}

                {/* Primary Verse Quote */}
                <blockquote className="font-serif italic text-xl sm:text-2xl text-white leading-relaxed mb-6 border-l-2 border-cyan-400 pl-5">
                  "{selectedScripture.text}"
                </blockquote>

                {/* Three Clean Interactive Tabs (No Emojis) */}
                <div className="flex border-b border-white/10 mb-5 gap-6 text-xs font-medium tracking-wide">
                  <button
                    onClick={() => setActiveTab("wisdom")}
                    className={`pb-3 transition-colors cursor-pointer border-b-2 ${
                      activeTab === "wisdom"
                        ? "border-cyan-400 text-white font-semibold"
                        : "border-transparent text-white/45 hover:text-white"
                    }`}
                  >
                    Core Principle
                  </button>
                  <button
                    onClick={() => setActiveTab("modern")}
                    className={`pb-3 transition-colors cursor-pointer border-b-2 ${
                      activeTab === "modern"
                        ? "border-cyan-400 text-white font-semibold"
                        : "border-transparent text-white/45 hover:text-white"
                    }`}
                  >
                    Real-World Application
                  </button>
                  <button
                    onClick={() => setActiveTab("action")}
                    className={`pb-3 transition-colors cursor-pointer border-b-2 ${
                      activeTab === "action"
                        ? "border-cyan-400 text-white font-semibold"
                        : "border-transparent text-white/45 hover:text-white"
                    }`}
                  >
                    Action Protocol
                  </button>
                </div>

                {/* Tab Content Area */}
                <div className="min-h-[120px] mb-8">
                  {activeTab === "wisdom" && (
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 text-white/80 text-xs sm:text-sm leading-relaxed font-sans font-light">
                      {selectedScripture.corePrinciple}
                    </div>
                  )}

                  {activeTab === "modern" && (
                    <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-200/90 text-xs sm:text-sm leading-relaxed font-sans font-light">
                      {selectedScripture.modernContext}
                    </div>
                  )}

                  {activeTab === "action" && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200/90 text-xs sm:text-sm leading-relaxed font-sans font-light flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block mb-1">Daily Protocol:</strong>
                        <span>{selectedScripture.actionProtocol}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action CTA Row: Discuss with AI Guide */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-white/10">
                  <span className="text-[11px] text-white/45 font-mono">
                    Want to apply this framework to a decision today?
                  </span>

                  <button
                    onClick={() => navigate(user ? "/chat" : "/auth")}
                    className="btn-liquid-primary !py-2.5 !px-6 !text-xs w-full sm:w-auto"
                  >
                    <MessageSquareQuote className="w-3.5 h-3.5" />
                    <span>Discuss with Noerax AI Guide</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </motion.section>
  );
}





