import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { Navbar } from './components/layout/Navbar';
import { Hero } from './components/sections/Hero';
import { Struggle } from './components/sections/Struggle';
import { ChatPreview } from './components/sections/ChatPreview';
import { Library } from './components/sections/Library';
import { Journal } from './components/sections/Journal';
import { Features } from './components/sections/Features';
import { DailyMantra } from './components/sections/DailyMantra';
import { Testimonials } from './components/sections/Testimonials';
import { Footer } from './components/layout/Footer';
import { StreakProvider } from './lib/StreakContext';
import { AuthProvider } from './lib/AuthContext';
import { ProfileDrawer } from './components/layout/ProfileDrawer';
import { CommandMenu } from './components/layout/CommandMenu';
import { QuoteCardModal } from './components/ui/QuoteCardModal';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Lazy-loaded routes for ultra-fast initial bundle loading
const SettingsPage = lazy(() => import('./components/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AuthPage = lazy(() => import('./components/layout/AuthPage').then(m => ({ default: m.AuthPage })));
const ChatWorkspacePage = lazy(() => import('./components/pages/ChatWorkspacePage').then(m => ({ default: m.ChatWorkspacePage })));
const AiCompanionPage = lazy(() => import('./components/pages/AiCompanionPage').then(m => ({ default: m.AiCompanionPage })));

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-dharma-flame/20 border-t-dharma-flame animate-spin" />
    </div>
  );
}

function Home() {
  return (
    <>
      <Hero />
      <Struggle />
      <ChatPreview />
      <Journal />
      <Library />
      <Features />
      <DailyMantra />
      <Testimonials />
    </>
  );
}

function ScrollManager() {
  const location = useLocation();
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Don't interfere with /chat or /ai-companion pages
    if (location.pathname === '/chat' || location.pathname === '/ai-companion') return;

    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);
  return null;
}

function AppLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';
  const isChatPage = location.pathname === '/chat';
  const isCompanionPage = location.pathname === '/ai-companion';
  const hideFooter = isAuthPage || isChatPage || isCompanionPage;

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [quoteModal, setQuoteModal] = useState<{ isOpen: boolean; quote: string; source: string }>({
    isOpen: false,
    quote: '',
    source: ''
  });

  // Manage Lenis smooth scrolling (destroy on /chat or /ai-companion to prevent lagging)
  useEffect(() => {
    if (isChatPage || isCompanionPage) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [isChatPage, isCompanionPage]);

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
      {!hideFooter && <Navbar onOpenProfile={() => setIsProfileOpen(true)} />}
      <main>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ai-companion" element={<AiCompanionPage />} />
            <Route path="/chat" element={<ProtectedRoute><ChatWorkspacePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/auth" element={<AuthPage />} />
          </Routes>
        </Suspense>
      </main>
      {!hideFooter && <Footer />}
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
  return (
    <BrowserRouter>
      <ScrollManager />
      <AuthProvider>
        <StreakProvider>
          <AppLayout />
        </StreakProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
