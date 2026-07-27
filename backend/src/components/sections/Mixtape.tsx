import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Share2, Plus, Minus, Headphones, ListMusic, Check, Volume2, VolumeX, Bookmark, Edit3, FolderPlus } from 'lucide-react';

const availableVerses = [
  { id: 'v1', title: 'Letting Go', source: 'Bhagavad Gita 2:47', text: 'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.' },
  { id: 'v2', title: 'Mental Stillness', source: 'Yoga Sutras 1.2', text: 'Yoga is the cessation of the fluctuations of the mind.' },
  { id: 'v3', title: 'Interconnectedness', source: 'Isha Upanishad', text: 'All this, whatever moves in this moving world, is enveloped by God.' },
  { id: 'v4', title: 'The Way', source: 'Tao Te Ching', text: 'A journey of a thousand miles begins with a single step.' },
  { id: 'v5', title: 'Inner Power', source: 'Meditations', text: 'You have power over your mind - not outside events. Realize this, and you will find strength.' },
  { id: 'v6', title: 'Impermanence', source: 'Dhammapada', text: 'All conditioned things are impermanent. When one sees this with wisdom, one turns away from suffering.' }
];

interface SavedPlaylist {
  id: string;
  name: string;
  tracks: typeof availableVerses;
  createdAt: string;
}

export function Mixtape() {
  const [mixtape, setMixtape] = useState<typeof availableVerses>([]);
  const [playlistName, setPlaylistName] = useState('My Wisdom Mixtape');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Saved playlists state
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load saved playlists on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('noerax_saved_playlists');
      if (stored) {
        setSavedPlaylists(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  // Save playlist to localStorage
  const handleSavePlaylist = () => {
    if (mixtape.length === 0) return;

    const newPlaylist: SavedPlaylist = {
      id: `playlist-${Date.now()}`,
      name: playlistName.trim() || 'My Wisdom Mixtape',
      tracks: mixtape,
      createdAt: new Date().toISOString()
    };

    const updated = [newPlaylist, ...savedPlaylists.filter(p => p.name !== newPlaylist.name)];
    setSavedPlaylists(updated);
    localStorage.setItem('noerax_saved_playlists', JSON.stringify(updated));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Load a saved playlist
  const loadPlaylist = (playlist: SavedPlaylist) => {
    setPlaylistName(playlist.name);
    setMixtape(playlist.tracks);
    setIsPlaying(false);
    setCurrentPlayingIndex(0);
  };

  // Audio Speech Synthesis Player Effect
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    if (isPlaying && mixtape.length > 0) {
      const currentTrack = mixtape[currentPlayingIndex];
      if (!currentTrack) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(`${currentTrack.title}. ${currentTrack.text}`);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        if (currentPlayingIndex < mixtape.length - 1) {
          setCurrentPlayingIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
          setCurrentPlayingIndex(0);
        }
      };

      utterance.onerror = () => {
        setIsPlaying(false);
      };

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isPlaying, currentPlayingIndex, mixtape]);

  const addToMixtape = (verse: typeof availableVerses[0]) => {
    if (!mixtape.find(v => v.id === verse.id)) {
      setMixtape([...mixtape, verse]);
    }
  };

  const removeFromMixtape = (id: string) => {
    const updated = mixtape.filter(v => v.id !== id);
    setMixtape(updated);
    if (updated.length === 0) {
      setIsPlaying(false);
      setCurrentPlayingIndex(0);
    }
  };

  const togglePlay = () => {
    if (mixtape.length === 0) return;
    setIsPlaying(!isPlaying);
  };

  const shareMixtape = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`Listen to my "${playlistName}" playlist with ${mixtape.length} wisdom tracks on Noerax!`);
    }
  };

  const currentPlayingId = mixtape[currentPlayingIndex]?.id;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 50 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, margin: "-100px" }} 
      transition={{ duration: 0.8, ease: "easeOut" }} 
      id="mixtape" 
      className="py-32 bg-dharma-ink-2 relative border-t border-dharma-line-dark"
    >
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="w-16 h-16 bg-dharma-ivory/5 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <ListMusic className="w-8 h-8 text-dharma-ivory" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-4xl md:text-5xl text-dharma-ivory mb-6"
          >
            Wisdom Mixtape Studio
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-dharma-ivory-dim text-lg max-w-2xl mx-auto"
          >
            Name, curate, and save your custom audio playlists. Listen to clear audio narration of your selected verses during meditation or work.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Available Verses & Saved Playlists Picker */}
          <div className="space-y-6">
            <h3 className="font-serif text-2xl text-dharma-ivory border-b border-dharma-line-dark pb-4 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-dharma-flame" />
              Discover Verses
            </h3>

            {/* Saved Playlists Quick Loader */}
            {savedPlaylists.length > 0 && (
              <div className="bg-dharma-ink p-4 rounded-2xl border border-dharma-line-dark mb-4">
                <span className="text-xs font-semibold text-dharma-flame uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <FolderPlus className="w-3.5 h-3.5" /> Saved Playlists ({savedPlaylists.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {savedPlaylists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => loadPlaylist(pl)}
                      className="px-3 py-1.5 rounded-xl bg-dharma-ink-2 border border-dharma-line-dark text-xs text-dharma-ivory hover:border-dharma-flame/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{pl.name}</span>
                      <span className="text-[10px] text-dharma-ivory-dim">({pl.tracks.length})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 scrollbar-thin">
              {availableVerses.map(verse => {
                const isAdded = mixtape.some(v => v.id === verse.id);
                return (
                  <div key={verse.id} className="bg-dharma-ink p-5 rounded-2xl border border-dharma-line-dark shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-dharma-ivory">{verse.title}</h4>
                      </div>
                      <button
                        onClick={() => isAdded ? removeFromMixtape(verse.id) : addToMixtape(verse)}
                        className={`p-2 rounded-full transition-colors ${
                          isAdded 
                            ? 'bg-dharma-ivory/10 text-dharma-ivory hover:bg-dharma-ivory/20' 
                            : 'bg-dharma-ivory text-dharma-ink hover:bg-dharma-flame hover:text-white'
                        }`}
                      >
                        {isAdded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-dharma-ivory-dim font-serif italic text-sm">"{verse.text}"</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Your Custom Named Mixtape */}
          <div className="bg-dharma-ink border border-dharma-line-dark rounded-3xl p-8 shadow-lg flex flex-col h-full min-h-[520px]">
            
            {/* Playlist Title & Save Bar */}
            <div className="border-b border-dharma-line-dark pb-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Edit3 className="w-4 h-4 text-dharma-flame" />
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="Name Your Playlist..."
                  className="bg-transparent text-xl font-serif text-dharma-ivory border-b border-transparent hover:border-dharma-line-dark focus:border-dharma-flame focus:outline-none transition-colors w-full"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-dharma-ivory-dim font-medium">
                  {mixtape.length} Tracks Selected
                </span>

                <div className="flex items-center gap-2">
                  {/* Save Playlist Button */}
                  <button
                    onClick={handleSavePlaylist}
                    disabled={mixtape.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 bg-dharma-flame text-white rounded-full text-xs font-semibold hover:bg-dharma-saffron transition-all shadow-md shadow-dharma-flame/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Save Playlist to Profile"
                  >
                    {saveSuccess ? <Check className="w-4 h-4 text-white" /> : <Bookmark className="w-4 h-4" />}
                    <span>{saveSuccess ? 'Saved!' : 'Save Playlist'}</span>
                  </button>

                  <button 
                    onClick={shareMixtape}
                    className="p-2 bg-dharma-ivory/5 hover:bg-dharma-ivory/10 rounded-full text-dharma-ivory transition-colors relative cursor-pointer"
                    title="Share Playlist"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  </button>

                  <button 
                    onClick={togglePlay}
                    disabled={mixtape.length === 0}
                    className="w-10 h-10 flex items-center justify-center bg-dharma-ivory text-dharma-ink rounded-full hover:bg-dharma-flame hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer ml-1"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Playlist Tracklist */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <AnimatePresence>
                {mixtape.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60"
                  >
                    <Headphones className="w-12 h-12 text-dharma-ivory-dim mb-4" />
                    <p className="text-dharma-ivory-dim max-w-[220px] text-sm">
                      Add verses from the left, give your playlist a custom name, and click "Save Playlist"!
                    </p>
                  </motion.div>
                ) : (
                  mixtape.map((verse, index) => {
                    const isTrackActive = currentPlayingId === verse.id && isPlaying;
                    return (
                      <motion.div
                        key={verse.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onClick={() => {
                          setCurrentPlayingIndex(index);
                          setIsPlaying(true);
                        }}
                        className={`p-4 rounded-xl border flex items-center gap-4 transition-colors cursor-pointer ${
                          isTrackActive
                            ? 'bg-dharma-flame/10 border-dharma-flame/50 shadow-md shadow-dharma-flame/10' 
                            : 'bg-dharma-ink-2 border-transparent hover:border-dharma-line-dark'
                        }`}
                      >
                        <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full font-medium text-sm ${
                          isTrackActive ? 'bg-dharma-flame text-white' : 'bg-dharma-ivory/10 text-dharma-ivory'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-dharma-ivory leading-snug">{verse.title}</h4>
                        </div>
                        {isTrackActive && (
                          <div className="flex gap-1 items-center px-2">
                            <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-dharma-flame rounded-full" />
                            <motion.div animate={{ height: [12, 20, 12] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1 bg-dharma-flame rounded-full" />
                            <motion.div animate={{ height: [6, 14, 6] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1 bg-dharma-flame rounded-full" />
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromMixtape(verse.id);
                          }}
                          className="p-1.5 text-dharma-ivory-dim hover:text-dharma-flame transition-colors rounded-full hover:bg-dharma-ivory/5"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
            
            {mixtape.length > 0 && (
              <div className="mt-6 pt-4 border-t border-dharma-line-dark flex justify-between items-center text-sm text-dharma-ivory-dim font-medium">
                <span>{mixtape.length} track{mixtape.length > 1 ? 's' : ''}</span>
                <span className="text-dharma-flame text-xs flex items-center gap-1">
                  {isPlaying ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
                  {isPlaying ? 'Audio Narration Playing' : 'Audio Paused'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
