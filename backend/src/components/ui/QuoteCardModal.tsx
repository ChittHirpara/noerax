import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2, Sparkles, Check } from 'lucide-react';
import noeraxLogo from '../../assets/noerax-logo.png';

interface QuoteCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: string;
  source: string;
}

export function QuoteCardModal({ isOpen, onClose, quote, source }: QuoteCardModalProps) {
  const [theme, setTheme] = useState<'cyan' | 'midnight' | 'gold'>('cyan');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleDownloadCard = () => {
    // Generate text canvas export file
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
    if (theme === 'cyan') {
      grad.addColorStop(0, '#09090b');
      grad.addColorStop(0.5, '#0c4a6e');
      grad.addColorStop(1, '#09090b');
    } else if (theme === 'gold') {
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.5, '#451a03');
      grad.addColorStop(1, '#09090b');
    } else {
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#020617');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Decorative circle glow
    ctx.beginPath();
    ctx.arc(540, 540, 380, 0, Math.PI * 2);
    ctx.strokeStyle = theme === 'cyan' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(251, 191, 36, 0.15)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Source Title
    ctx.fillStyle = theme === 'cyan' ? '#38bdf8' : '#fbbf24';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(source.toUpperCase(), 540, 300);

    // Quote text (word wrap)
    ctx.fillStyle = '#fafafa';
    ctx.font = 'italic 44px Georgia, serif';
    
    const words = `"${quote}"`.split(' ');
    let line = '';
    let y = 440;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 820 && n > 0) {
        ctx.fillText(line, 540, y);
        line = words[n] + ' ';
        y += 65;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 540, y);

    // Noerax Branding Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('NOERAX SANCTUARY · WWW.NOERAX.COM', 540, 920);

    const link = document.createElement('a');
    link.download = `Noerax-QuoteCard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg bg-dharma-ink-2 border border-dharma-line-dark rounded-3xl p-6 shadow-2xl space-y-6"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-dharma-line-dark pb-4">
                <span className="text-xs font-semibold text-dharma-flame uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Export Social Quote Card
                </span>
                <button
                  onClick={onClose}
                  className="p-1.5 text-dharma-ivory-dim hover:text-dharma-ivory hover:bg-dharma-ivory/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Theme Picker */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setTheme('cyan')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    theme === 'cyan' ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300' : 'border-dharma-line-dark text-dharma-ivory-dim'
                  }`}
                >
                  Cyan Glow
                </button>
                <button
                  onClick={() => setTheme('midnight')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    theme === 'midnight' ? 'border-indigo-400 bg-indigo-400/20 text-indigo-300' : 'border-dharma-line-dark text-dharma-ivory-dim'
                  }`}
                >
                  Midnight Deep
                </button>
                <button
                  onClick={() => setTheme('gold')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    theme === 'gold' ? 'border-amber-400 bg-amber-400/20 text-amber-300' : 'border-dharma-line-dark text-dharma-ivory-dim'
                  }`}
                >
                  Amber Warm
                </button>
              </div>

              {/* Card Preview Container (Instagram 1:1 format) */}
              <div
                ref={cardRef}
                className={`w-full aspect-square rounded-2xl p-8 flex flex-col justify-between items-center text-center shadow-2xl relative overflow-hidden transition-all ${
                  theme === 'cyan'
                    ? 'bg-gradient-to-br from-slate-950 via-sky-950 to-slate-950 border border-cyan-500/30'
                    : theme === 'gold'
                    ? 'bg-gradient-to-br from-neutral-950 via-amber-950 to-neutral-950 border border-amber-500/30'
                    : 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 border border-indigo-500/30'
                }`}
              >
                {/* Background ambient glow circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-cyan-500/10 blur-[60px] pointer-events-none" />

                <span className={`text-xs font-mono font-bold uppercase tracking-widest ${
                  theme === 'cyan' ? 'text-cyan-400' : theme === 'gold' ? 'text-amber-400' : 'text-indigo-400'
                }`}>
                  DAILY REFLECTION
                </span>

                <p className="font-serif italic text-xl md:text-2xl text-dharma-ivory leading-relaxed px-4 my-auto">
                  "{quote}"
                </p>

                <div className="flex items-center gap-2 text-[11px] text-dharma-ivory-dim/70 uppercase tracking-widest font-mono border-t border-dharma-line-dark/60 pt-3 w-full justify-center">
                  <span>NOERAX SANCTUARY</span>
                  <span>·</span>
                  <span>WWW.NOERAX.COM</span>
                </div>
              </div>

              {/* Download Action Button */}
              <button
                onClick={handleDownloadCard}
                className="w-full py-3.5 bg-dharma-flame text-white font-semibold rounded-full hover:bg-dharma-saffron transition-all shadow-lg shadow-dharma-flame/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {downloadSuccess ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                <span>{downloadSuccess ? 'Downloaded Image!' : 'Download Quote Card (.png)'}</span>
              </button>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
