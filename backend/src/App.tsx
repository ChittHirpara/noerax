import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Navbar } from './components/layout/Navbar';
import { Hero } from './components/sections/Hero';
import { Struggle } from './components/sections/Struggle';
import { ChatPreview } from './components/sections/ChatPreview';
import { Library } from './components/sections/Library';
import { ReadingRoom } from './components/sections/ReadingRoom';
import { Journal } from './components/sections/Journal';
import { DailyCardPage } from './components/pages/DailyCardPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { Mixtape } from './components/sections/Mixtape';
import { Features } from './components/sections/Features';
import { DailyMantra } from './components/sections/DailyMantra';
import { Testimonials } from './components/sections/Testimonials';
import { Footer } from './components/layout/Footer';
import { CartProvider } from './lib/CartContext';
import { StreakProvider } from './lib/StreakContext';
import { AuthProvider } from './lib/AuthContext';
import { AuthPage } from './components/layout/AuthPage';
import { AmbientSoundscape } from './components/ui/AmbientSoundscape';
import { ProfileDrawer } from './components/layout/ProfileDrawer';
import { CommandMenu } from './components/layout/CommandMenu';
import { QuoteCardModal } from './components/ui/QuoteCardModal';
import { WisdomCardDraw } from './components/sections/WisdomCardDraw';

import { ChatWorkspacePage } from './components/pages/ChatWorkspacePage';

function Home() {
  return (
    <>
      <Hero />
      <Struggle />
      <ChatPreview />
      <Journal />
      <Mixtape />
      <Library />
      <Features />
      <DailyMantra />
      <WisdomCardDraw />
      <Testimonials />
    </>
  );
}

function ScrollManager() {
  const location = useLocation();
  useEffect(() => {
    // Don't interfere with the /chat page - it manages its own scroll
    if (location.pathname === '/chat') return;

    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [location]);
  return null;
}

function AppLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [quoteModal, setQuoteModal] = useState<{ isOpen: boolean; quote: string; source: string }>({
    isOpen: false,
    quote: '',
    source: ''
  });

  useEffect(() => {
    const handleOpenCommand = () => setIsCommandMenuOpen(true);
    const handleOpenQuote = (e: any) => {
      if (e.detail) {
        setQuoteModal({ isOpen: true, quote: e.detail.quote, source: e.detail.source });
      }
    };

    window.addEventListener('open-command-menu', handleOpenCommand);
    window.addEventListener('open-quote-modal', handleOpenQuote);

    return () => {
      window.removeEventListener('open-command-menu', handleOpenCommand);
      window.removeEventListener('open-quote-modal', handleOpenQuote);
    };
  }, []);

  return (
    <div className="bg-dharma-ink min-h-screen text-dharma-ivory font-sans relative">
      {!isAuthPage && <Navbar onOpenProfile={() => setIsProfileOpen(true)} />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<ChatWorkspacePage />} />
          <Route path="/daily-card" element={<DailyCardPage />} />
          <Route path="/reading-room" element={<ReadingRoom />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
      {!isAuthPage && <AmbientSoundscape />}
      <ProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <CommandMenu isOpen={isCommandMenuOpen} onClose={() => setIsCommandMenuOpen(false)} />
      <QuoteCardModal
        isOpen={quoteModal.isOpen}
        onClose={() => setQuoteModal({ ...quoteModal, isOpen: false })}
        quote={quoteModal.quote}
        source={quoteModal.source}
      />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    // Don't run Lenis on /chat - it's a fullscreen app workspace with its own scroll containers
    if (window.location.pathname === '/chat') return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'}>
      <BrowserRouter>
        <ScrollManager />
        <AuthProvider>
          <StreakProvider>
            <CartProvider>
              <AppLayout />
            </CartProvider>
          </StreakProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
