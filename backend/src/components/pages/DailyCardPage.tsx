import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { WisdomCardDraw } from '../sections/WisdomCardDraw';

export function DailyCardPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070709] pt-24 font-sans text-white relative selection:bg-sky-400 selection:text-black">
      {/* Background Atmosphere Shimmer */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-sky-500/8 to-transparent blur-[160px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-5xl pt-4 relative z-10">
        <button
          onClick={() => navigate('/')}
          className="btn-liquid-secondary !py-2 !px-4 !text-xs inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Sanctuary Home
        </button>
      </div>

      <WisdomCardDraw />
    </div>
  );
}

