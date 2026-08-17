import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Sparkles, Check } from 'lucide-react';

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
    // 1200x1200 Ultra High-Res Export (Identical to Website Daily Reflection Card)
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // 1. Deep Obsidian Base
    ctx.fillStyle = '#070709';
    ctx.fillRect(0, 0, 1200, 1200);

    // 2. Soft Ambient Backlight Glow
    const bgGlow = ctx.createRadialGradient(600, 600, 0, 600, 600, 600);
    if (theme === 'cyan') {
      bgGlow.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
      bgGlow.addColorStop(0.5, 'rgba(14, 116, 144, 0.08)');
      bgGlow.addColorStop(1, 'rgba(7, 7, 9, 0)');
    } else if (theme === 'gold') {
      bgGlow.addColorStop(0, 'rgba(255, 107, 0, 0.18)');
      bgGlow.addColorStop(0.5, 'rgba(180, 83, 9, 0.08)');
      bgGlow.addColorStop(1, 'rgba(7, 7, 9, 0)');
    } else {
      bgGlow.addColorStop(0, 'rgba(139, 92, 246, 0.18)');
      bgGlow.addColorStop(0.5, 'rgba(76, 29, 149, 0.08)');
      bgGlow.addColorStop(1, 'rgba(7, 7, 9, 0)');
    }
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, 1200, 1200);

    // Helper: Draw Rounded Rectangle
    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    // 3. Liquid Glass Floating Container Card (Website Exact Replica)
    drawRoundRect(80, 80, 1040, 1040, 48);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. "Daily Reflection" Top Pill Badge
    const badgeW = 260;
    const badgeH = 44;
    const badgeX = 600 - badgeW / 2;
    const badgeY = 160;
    drawRoundRect(badgeX, badgeY, badgeW, badgeH, 22);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Amber dot inside pill
    ctx.beginPath();
    ctx.arc(badgeX + 28, badgeY + 22, 5, 0, Math.PI * 2);
    ctx.fillStyle = theme === 'cyan' ? '#38bdf8' : theme === 'gold' ? '#ff6b00' : '#a855f7';
    ctx.fill();

    // Badge text
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DAILY REFLECTION', 600 + 10, badgeY + 28);

    // 5. Glass Icon Emblem Box (Center Top)
    const iconBoxW = 76;
    const iconBoxH = 76;
    const iconBoxX = 600 - iconBoxW / 2;
    const iconBoxY = 240;
    drawRoundRect(iconBoxX, iconBoxY, iconBoxW, iconBoxH, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Sparkle icon in emblem
    ctx.fillStyle = theme === 'cyan' ? '#38bdf8' : theme === 'gold' ? '#ffaa40' : '#c084fc';
    ctx.font = '32px sans-serif';
    ctx.fillText('✦', 600, iconBoxY + 48);

    // 6. Quote Text (Instrument Serif Italic Multi-line)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 44px "Instrument Serif", Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center';

    const words = `"${quote}"`.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 860 && n > 0) {
        lines.push(currentLine);
        currentLine = words[n];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = 66;
    const totalTextHeight = lines.length * lineHeight;
    let startY = 570 - totalTextHeight / 2;

    for (const l of lines) {
      ctx.fillText(l, 600, startY);
      startY += lineHeight;
    }

    // 7. Author / Source Tag
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '500 20px sans-serif';
    ctx.fillText(`— ${source.toUpperCase()}`, 600, 830);

    // 8. Decorative Divider ─── ✦ ───
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(480, 890);
    ctx.lineTo(570, 890);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '16px sans-serif';
    ctx.fillText('✦', 600, 895);

    ctx.beginPath();
    ctx.moveTo(630, 890);
    ctx.lineTo(720, 890);
    ctx.stroke();

    // 9. Noerax Sanctuary Brandmark Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '600 15px sans-serif';
    ctx.fillText('NOERAX · DIGITAL SANCTUARY', 600, 990);

    const link = document.createElement('a');
    link.download = `Noerax-DailyReflection-${Date.now()}.png`;
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-lg bg-[#0d0d12] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-white/10 pb-3.5">
                <span className="text-xs font-semibold text-cyan-300 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-4 h-4" /> Export Daily Reflection Card
                </span>
                <button
                  onClick={onClose}
                  className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Theme Selector */}
              <div className="flex items-center justify-center gap-2.5">
                <button
                  onClick={() => setTheme('cyan')}
                  className={`px-3.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    theme === 'cyan' ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300' : 'border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  Cyan Glow
                </button>
                <button
                  onClick={() => setTheme('gold')}
                  className={`px-3.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    theme === 'gold' ? 'border-amber-400 bg-amber-400/20 text-amber-300' : 'border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  Flame Amber
                </button>
                <button
                  onClick={() => setTheme('midnight')}
                  className={`px-3.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    theme === 'midnight' ? 'border-purple-400 bg-purple-400/20 text-purple-300' : 'border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  Midnight Violet
                </button>
              </div>

              {/* Card Preview Container (Website Exact Visual Replica) */}
              <div
                ref={cardRef}
                className="w-full aspect-square rounded-3xl p-6 sm:p-8 flex flex-col justify-between items-center text-center shadow-2xl relative overflow-hidden bg-[#070709] border border-white/15"
              >
                {/* Background Ambient Glow */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-[80px] pointer-events-none ${
                  theme === 'cyan' ? 'bg-cyan-500/20' : theme === 'gold' ? 'bg-orange-500/20' : 'bg-purple-500/20'
                }`} />

                {/* Top Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/20 bg-white/10 text-white text-[10px] font-semibold tracking-[0.2em] uppercase backdrop-blur-md z-10 shadow-sm">
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    theme === 'cyan' ? 'bg-cyan-400' : theme === 'gold' ? 'bg-orange-400' : 'bg-purple-400'
                  }`} />
                  Daily Reflection
                </div>

                {/* Central Icon Emblem */}
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 shadow-xl flex items-center justify-center backdrop-blur-xl z-10 my-1">
                  <Sparkles className={`w-5 h-5 ${
                    theme === 'cyan' ? 'text-cyan-300' : theme === 'gold' ? 'text-orange-300' : 'text-purple-300'
                  }`} />
                </div>

                {/* Quote Body */}
                <p 
                  className="font-serif italic text-lg sm:text-xl md:text-2xl text-white leading-relaxed px-3 my-auto z-10"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                >
                  "{quote}"
                </p>

                {/* Source */}
                <div className="z-10 text-xs text-white/75 font-medium uppercase tracking-wider">
                  — {source}
                </div>

                {/* Star Divider */}
                <div className="flex items-center justify-center gap-2.5 z-10 w-full">
                  <div className="w-10 h-px bg-white/20" />
                  <span className="text-[10px] text-white/40">✦</span>
                  <div className="w-10 h-px bg-white/20" />
                </div>

                {/* Footer Brand */}
                <div className="text-[10px] text-white/40 font-mono tracking-widest uppercase z-10">
                  NOERAX · DIGITAL SANCTUARY
                </div>
              </div>

              {/* Download Action Button */}
              <button
                onClick={handleDownloadCard}
                className="w-full py-3.5 bg-white text-black font-semibold rounded-full hover:bg-cyan-200 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {downloadSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Download className="w-4 h-4" />}
                <span>{downloadSuccess ? 'Downloaded High-Res Card!' : 'Download High-Res Card (.png)'}</span>
              </button>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
