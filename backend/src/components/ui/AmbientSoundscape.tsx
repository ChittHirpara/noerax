import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Play, Pause, ChevronUp, Music, Plus, Trash2, Link as LinkIcon, Radio, CloudRain, Waves, Wind, SkipForward, SkipBack, AlertCircle } from 'lucide-react';

interface SoundTrack {
  id: string;
  name: string;
  youtubeId: string;
  description: string;
  icon: React.ReactNode;
  isCustom?: boolean;
}

const DEFAULT_TRACKS: SoundTrack[] = [
  {
    id: 'track_1',
    name: '432Hz Solfeggio Sanctuary',
    youtubeId: 'DDubtRhOEGw',
    description: 'Deep harmonic healing & stress release',
    icon: <Radio className="w-4 h-4 text-dharma-flame" />,
  },
  {
    id: 'track_2',
    name: 'Gentle Rain & Thunderstorm',
    youtubeId: 'UsYsJhaNBBI',
    description: 'Calming rain soundscape for focus & sleep',
    icon: <CloudRain className="w-4 h-4 text-cyan-400" />,
  },
  {
    id: 'track_3',
    name: 'Cosmic Ambient Meditation',
    youtubeId: 'vPvIxwh9N2w',
    description: 'Deep space drone frequency flow',
    icon: <Wind className="w-4 h-4 text-indigo-400" />,
  },
  {
    id: 'track_4',
    name: 'Lofi Focus & Study Beats',
    youtubeId: 'FjHGZj2IjBk',
    description: 'Chill lofi rhythms for overthinking & work',
    icon: <Waves className="w-4 h-4 text-emerald-400" />,
  },
];

// Extract video ID from any YouTube URL format
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function AmbientSoundscape() {
  const [tracks, setTracks] = useState<SoundTrack[]>(DEFAULT_TRACKS);
  const [activeTrackId, setActiveTrackId] = useState<string>('track_1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState<number>(0.7);
  const [isOpen, setIsOpen] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);

  // Custom YT link input state
  const [customUrl, setCustomUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isApiReady = useRef(false);

  // Web Audio Fallback synth
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeNodesRef = useRef<any[]>([]);

  const stopSynthFallback = () => {
    activeNodesRef.current.forEach((n) => {
      try { n.stop?.(); n.disconnect?.(); } catch (e) {}
    });
    activeNodesRef.current = [];
  };

  const startSynthFallback = () => {
    stopSynthFallback();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const master = ctx.createGain();
      master.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
      master.connect(ctx.destination);

      [108, 216, 432].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.2 / (i + 1), ctx.currentTime);
        osc.connect(gain);
        gain.connect(master);
        osc.start();
        activeNodesRef.current.push(osc, gain);
      });
    } catch (e) {}
  };

  // Initialize YT player instance — uses DEFAULT_TRACKS[0] to avoid stale closure on mount
  const initPlayer = () => {
    if (!window.YT || !window.YT.Player || playerRef.current) return;
    // Small delay to ensure #noerax-yt-player DOM node exists
    setTimeout(() => {
      if (playerRef.current) return;
      try {
        playerRef.current = new window.YT.Player('noerax-yt-player', {
          height: '1',
          width: '1',
          videoId: DEFAULT_TRACKS[0].youtubeId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            loop: 1,
            playlist: DEFAULT_TRACKS[0].youtubeId,
            modestbranding: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              event.target.setVolume(70);
            },
            onError: (err: any) => {
              console.warn('YouTube Player error code:', err.data);
              setYtError('This track has embedding restrictions. Playing ambient synth instead.');
            },
            onStateChange: (event: any) => {
              // Auto-loop when video ends
              if (event.data === window.YT.PlayerState.ENDED) {
                event.target.playVideo();
              }
            },
          },
        });
      } catch (e) {
        console.warn('Failed to init YT player:', e);
      }
    }, 300);
  };

  // Load YouTube IFrame API script
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => {
        isApiReady.current = true;
        initPlayer();
      };
    } else {
      isApiReady.current = true;
      initPlayer();
    }
  }, []);

  // Load custom tracks from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('noerax_custom_tracks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const customTracksFormatted: SoundTrack[] = parsed.map((t: any) => ({
            ...t,
            icon: <Music className="w-4 h-4 text-dharma-gold" />,
            isCustom: true,
          }));
          setTracks([...DEFAULT_TRACKS, ...customTracksFormatted]);
        }
      }
    } catch (e) {}
  }, []);

  const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0];

  // Play / Pause / Change Track handling
  useEffect(() => {
    setYtError(null);
    if (!playerRef.current || !playerRef.current.loadVideoById) {
      if (isPlaying) startSynthFallback();
      else stopSynthFallback();
      return;
    }

    try {
      if (isPlaying) {
        stopSynthFallback();
        playerRef.current.loadVideoById({
          videoId: activeTrack.youtubeId,
          startSeconds: 0,
        });
        playerRef.current.setVolume(volume * 100);
        playerRef.current.playVideo();
      } else {
        stopSynthFallback();
        playerRef.current.pauseVideo();
      }
    } catch (e) {
      if (isPlaying) startSynthFallback();
    }
  }, [isPlaying, activeTrackId]);

  // Volume slider update
  useEffect(() => {
    if (playerRef.current && playerRef.current.setVolume) {
      try {
        playerRef.current.setVolume(volume * 100);
      } catch (e) {}
    }
  }, [volume]);

  const handleNextTrack = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentIndex = tracks.findIndex((t) => t.id === activeTrackId);
    const nextIndex = (currentIndex + 1) % tracks.length;
    setActiveTrackId(tracks[nextIndex].id);
    setIsPlaying(true);
  };

  const handlePrevTrack = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentIndex = tracks.findIndex((t) => t.id === activeTrackId);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    setActiveTrackId(tracks[prevIndex].id);
    setIsPlaying(true);
  };

  // Handle adding custom YT link
  const handleAddCustomTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    const ytId = extractYouTubeId(customUrl.trim());
    if (!ytId) {
      setInputError('Invalid YouTube URL. Enter a valid link (e.g. https://youtu.be/...)');
      return;
    }

    const trackTitle = customName.trim() || `Custom Song (${ytId.slice(0, 5)})`;
    const newTrack: SoundTrack = {
      id: `custom_${Date.now()}`,
      name: trackTitle,
      youtubeId: ytId,
      description: 'Your custom YouTube soundtrack',
      icon: <Music className="w-4 h-4 text-dharma-gold" />,
      isCustom: true,
    };

    const updated = [...tracks, newTrack];
    setTracks(updated);
    setActiveTrackId(newTrack.id);
    setIsPlaying(true);

    const customOnly = updated.filter((t) => t.isCustom).map(({ icon, ...rest }) => rest);
    try {
      localStorage.setItem('noerax_custom_tracks', JSON.stringify(customOnly));
    } catch (err) {}

    setCustomUrl('');
    setCustomName('');
    setShowAddForm(false);
  };

  // Handle deleting a custom track
  const handleDeleteCustomTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = tracks.filter((t) => t.id !== id);
    setTracks(updated);
    if (activeTrackId === id) {
      setActiveTrackId(DEFAULT_TRACKS[0].id);
      setIsPlaying(false);
    }
    const customOnly = updated.filter((t) => t.isCustom).map(({ icon, ...rest }) => rest);
    try {
      localStorage.setItem('noerax_custom_tracks', JSON.stringify(customOnly));
    } catch (err) {}
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      
      {/* 1x1 Pixel YouTube Player Container (Required for browser audio autoplay permission) */}
      <div className="fixed bottom-0 right-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden" ref={containerRef}>
        <div id="noerax-yt-player" />
      </div>

      {/* Expanded Control Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="mb-4 w-80 sm:w-96 bg-dharma-ink-2/95 backdrop-blur-2xl border border-dharma-line-dark rounded-3xl p-5 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-dharma-line-dark">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-dharma-flame animate-pulse" />
                <h3 className="text-sm font-semibold text-dharma-ivory">Sanctuary Soundscape</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-dharma-ivory-dim hover:text-dharma-ivory cursor-pointer"
              >
                Close
              </button>
            </div>

            {ytError && (
              <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{ytError}</span>
              </div>
            )}

            {/* Currently Playing Banner */}
            <div className="mb-4 p-3.5 rounded-2xl bg-dharma-ink border border-dharma-flame/30 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-dharma-flame/15 border border-dharma-flame/40 flex items-center justify-center text-dharma-flame shrink-0">
                  {activeTrack.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-dharma-ivory truncate">{activeTrack.name}</h4>
                  <p className="text-[10px] text-dharma-ivory-dim truncate">{isPlaying ? 'Playing Audio' : 'Paused'}</p>
                </div>
              </div>

              {/* Drawer Media Controls */}
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  onClick={handlePrevTrack}
                  className="p-1.5 rounded-full bg-dharma-ink-3 text-dharma-ivory-dim hover:text-dharma-ivory transition-colors cursor-pointer"
                  title="Previous Song"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-full bg-dharma-flame text-white hover:bg-dharma-saffron transition-colors cursor-pointer shadow-md shadow-dharma-flame/30"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                </button>
                <button
                  onClick={handleNextTrack}
                  className="p-1.5 rounded-full bg-dharma-ink-3 text-dharma-ivory-dim hover:text-dharma-ivory transition-colors cursor-pointer"
                  title="Next Song"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Add Custom Song Button */}
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full mb-4 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-dharma-flame/15 via-dharma-flame/10 to-transparent border border-dharma-flame/40 text-dharma-ivory text-xs font-semibold hover:border-dharma-flame transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 text-dharma-flame" /> Add Your Own YouTube Song Link
              </button>
            ) : (
              <form onSubmit={handleAddCustomTrack} className="mb-4 p-3.5 rounded-2xl bg-dharma-ink border border-dharma-flame/50 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between text-xs font-semibold text-dharma-ivory">
                  <span className="flex items-center gap-1.5 text-dharma-flame">
                    <LinkIcon className="w-3.5 h-3.5" /> Add Custom YouTube Song
                  </span>
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setInputError(null); }}
                    className="text-[10px] text-dharma-ivory-dim hover:text-dharma-ivory"
                  >
                    Cancel
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Paste YouTube Link (e.g. https://youtu.be/...)"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full bg-dharma-ink-2 border border-dharma-line-dark rounded-xl px-3 py-2 text-xs text-dharma-ivory placeholder-dharma-ivory-dim/40 focus:outline-none focus:border-dharma-flame"
                  required
                />

                <input
                  type="text"
                  placeholder="Song Title (optional)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-dharma-ink-2 border border-dharma-line-dark rounded-xl px-3 py-2 text-xs text-dharma-ivory placeholder-dharma-ivory-dim/40 focus:outline-none focus:border-dharma-flame"
                />

                {inputError && (
                  <p className="text-[10px] text-red-400 font-medium">{inputError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-dharma-flame text-white text-xs font-semibold rounded-xl hover:bg-dharma-saffron transition-colors shadow-md"
                >
                  Save &amp; Play Song
                </button>
              </form>
            )}

            {/* Playlist */}
            <div data-lenis-prevent className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
              {tracks.map((track) => {
                const isActive = activeTrackId === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      setActiveTrackId(track.id);
                      setIsPlaying(true);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                      isActive
                        ? 'border-dharma-flame bg-dharma-flame/15 shadow-md shadow-dharma-flame/10'
                        : 'border-dharma-line-dark bg-dharma-ink/60 hover:border-dharma-line-light'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-xl bg-dharma-ink border border-dharma-line-dark shrink-0">
                        {track.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-dharma-ivory truncate flex items-center gap-1.5">
                          {track.name}
                          {track.isCustom && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-dharma-gold/20 text-dharma-gold font-mono">
                              CUSTOM
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-dharma-ivory-dim truncate">{track.description}</p>
                      </div>
                    </div>

                    {track.isCustom && (
                      <button
                        onClick={(e) => handleDeleteCustomTrack(track.id, e)}
                        className="p-1 text-dharma-ivory-dim hover:text-red-400 transition-colors ml-2 shrink-0"
                        title="Remove custom song"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3 bg-dharma-ink/60 p-3 rounded-2xl border border-dharma-line-dark">
              {volume === 0 ? <VolumeX className="w-4 h-4 text-dharma-ivory-dim" /> : <Volume2 className="w-4 h-4 text-dharma-flame" />}
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-dharma-flame h-1 bg-dharma-ink-3 rounded-lg cursor-pointer"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Pill Launcher Bar */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 sm:gap-3 p-2 pr-4 bg-dharma-ink-2/95 backdrop-blur-xl border border-dharma-line-dark rounded-full shadow-2xl cursor-pointer hover:border-dharma-flame/40 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Previous Song Button */}
        <button
          onClick={handlePrevTrack}
          className="p-2 rounded-full text-dharma-ivory-dim hover:text-dharma-ivory transition-colors cursor-pointer shrink-0"
          title="Previous Song"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        {/* Play / Pause Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(!isPlaying);
          }}
          className="w-9 h-9 rounded-full bg-dharma-flame text-white flex items-center justify-center shadow-lg shadow-dharma-flame/30 hover:bg-dharma-saffron transition-colors shrink-0"
          title={isPlaying ? 'Pause Song' : 'Play Song'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Next Song Button */}
        <button
          onClick={handleNextTrack}
          className="p-2 rounded-full text-dharma-ivory-dim hover:text-dharma-ivory transition-colors cursor-pointer shrink-0"
          title="Next Song"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Active Track Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-left min-w-0">
            <p className="text-xs font-semibold text-dharma-ivory truncate max-w-[120px] sm:max-w-[160px]">
              {activeTrack.name}
            </p>
            <p className="text-[10px] text-dharma-ivory-dim">
              {isPlaying ? 'Playing' : 'Paused'}
            </p>
          </div>
        </div>

        {/* Animated Equalizer Wave Bars */}
        {isPlaying && (
          <div className="flex gap-1 items-center ml-1 shrink-0">
            <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-dharma-flame rounded-full" />
            <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-0.5 bg-dharma-flame rounded-full" />
            <motion.div animate={{ height: [4, 10, 4] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-0.5 bg-dharma-flame rounded-full" />
          </div>
        )}

        <ChevronUp className={`w-4 h-4 text-dharma-ivory-dim transition-transform duration-300 ml-1 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.div>
    </div>
  );
}


