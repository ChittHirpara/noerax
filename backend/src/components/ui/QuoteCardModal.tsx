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
    // Generate text canvas export file (1080x1080 high-res Instagram square)
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // 1. Deep Obsidian Base Background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 1080, 1080);

    // 2. Soft Ambient Radial Glow (Smooth without any stroked circle lines)
    const radialGlow = ctx.createRadialGradient(540, 540, 0, 540, 540, 540);
    if (theme === 'cyan') {
      radialGlow.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
      radialGlow.addColorStop(0.5, 'rgba(14, 116, 144, 0.12)');
      radialGlow.addColorStop(1, 'rgba(9, 9, 11, 0)');
    } else if (theme === 'gold') {
      radialGlow.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
      radialGlow.addColorStop(0.5, 'rgba(180, 83, 9, 0.12)');
      radialGlow.addColorStop(1, 'rgba(9, 9, 11, 0)');
    } else {
      radialGlow.addColorStop(0, 'rgba(99, 102, 241, 0.22)');
      radialGlow.addColorStop(0.5, 'rgba(67, 56, 202, 0.12)');
      radialGlow.addColorStop(1, 'rgba(9, 9, 11, 0)');
    }
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, 1080, 1080);

    // 3. Elegant Subtle Frame Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, 960, 960);

    // 4. Category / Tag Header
    const accentColor = theme === 'cyan' ? '#38bdf8' : theme === 'gold' ? '#fbbf24' : '#818cf8';
    ctx.fillStyle = accentColor;
    ctx.font = '600 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DAILY REFLECTION', 540, 150);

    // 5. Source Title
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '500 24px sans-serif';
    ctx.fillText(source.toUpperCase(), 540, 200);

    // 6. Quote Text (Multi-line word wrap with optical vertical centering)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 42px Georgia, serif';
    
    const words = `"${quote}"`.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 800 && n > 0) {
        lines.push(currentLine);
        currentLine = words[n];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = 64;
    const totalTextHeight = lines.length * lineHeight;
    let startY = 540 - totalTextHeight / 2 + 20;

    for (const l of lines) {
      ctx.fillText(l, 540, startY);
      startY += lineHeight;
    }

    // 7. Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(440, 890);
    ctx.lineTo(640, 890);
    ctx.stroke();

    // 8. Noerax Branding Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '500 18px sans-serif';
    ctx.fillText('NOERAX · DIGITAL SANCTUARY', 540, 930);

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
