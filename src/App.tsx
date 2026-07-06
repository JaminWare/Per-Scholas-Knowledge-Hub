import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import SectionPage from './pages/SectionPage';
import RecognitionPage from './pages/RecognitionPage';
import LearnerExperiencePage from './pages/LearnerExperiencePage';
import AdminControlPage from './pages/AdminControlPage';
import NotFoundPage from './pages/NotFoundPage';
import AuthModal from './components/AuthModal';
import { useAuth } from './hooks/useAuth';
import { PanelLeftOpen, PanelLeftClose, Menu, BookOpen, LogIn, LogOut } from 'lucide-react';

function ScrollToTop({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    scrollRef.current?.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileAuthOpen, setMobileAuthOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const location = useLocation();
  const { user, signOut } = useAuth();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-zinc-100">

      {/* ── Mobile Sidebar Overlay ─────────────────────────── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Off-Canvas Sidebar ──────────────────────── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onToggle={() => setMobileSidebarOpen(false)} />
      </div>

      {/* ── Desktop Sidebar (pinned) ──────────────────────── */}
      <div
        className={`hidden md:block flex-shrink-0 border-r border-zinc-800 h-full overflow-hidden transition-all duration-300 ease-in-out ${
          desktopSidebarOpen ? 'w-72' : 'w-0'
        }`}
      >
        <div className="w-72 h-full overflow-y-auto">
          <Sidebar onToggle={() => setDesktopSidebarOpen(false)} />
        </div>
      </div>

      {/* ── Main area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* Mobile top header */}
        <header className="flex-shrink-0 z-30 bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800 flex md:hidden items-center gap-3 px-4 py-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-sky-400 transition-colors flex-shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-zinc-100 truncate">
              {location.pathname.includes('/cohort-admin') ? 'Learners Hub Admin' : 'Learners Hub'}
            </span>
          </div>
          {user ? (
            <button
              onClick={signOut}
              title="Sign Out"
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex-shrink-0"
              aria-label="Sign out"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          ) : (
            <button
              onClick={() => setMobileAuthOpen(true)}
              title="Sign In"
              className="p-2 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors flex-shrink-0"
              aria-label="Sign in"
            >
              <LogIn className="w-4.5 h-4.5" />
            </button>
          )}
        </header>

        {/* Desktop top header */}
        <header className="flex-shrink-0 z-30 bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800 hidden md:block">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setDesktopSidebarOpen((v) => !v)}
              className="p-2 rounded-lg bg-zinc-700 text-zinc-400 hover:bg-zinc-600 hover:text-sky-400 transition-colors flex-shrink-0"
              title={desktopSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {desktopSidebarOpen
                ? <PanelLeftClose className="w-5 h-5" />
                : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <div className="flex-1 max-w-2xl">
              <SearchBar onMenuClick={() => setDesktopSidebarOpen(true)} />
            </div>
            {user ? (
              <button
                onClick={signOut}
                title="Sign Out"
                className="ml-auto p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setMobileAuthOpen(true)}
                title="Sign In"
                className="ml-auto p-2 rounded-md text-sky-400 hover:text-white hover:bg-sky-500/15 transition-colors"
              >
                <LogIn className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Mobile search bar (below mobile header) */}
        <div className="flex-shrink-0 md:hidden px-4 py-2 border-b border-zinc-800 bg-zinc-950/80">
          <SearchBar onMenuClick={() => setMobileSidebarOpen(true)} />
        </div>

        <main ref={mainRef} className="flex-1 overflow-y-auto bg-black p-4 md:p-6">
          <ScrollToTop scrollRef={mainRef} />
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage onRefresh={triggerRefresh} />} />
              <Route path="/cohort-admin" element={<AdminControlPage />} />
              <Route path="/recognition" element={<RecognitionPage />} />
              <Route path="/learner-experience" element={<LearnerExperiencePage />} />
              <Route path="/article/:slug" element={<ArticlePage />} />
              <Route path="/article/:slug/*" element={<ArticlePage />} />
              <Route path="/:slug/*" element={<SectionPage refreshKey={refreshKey} />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </main>

        <footer className="flex-shrink-0 border-t border-zinc-800 py-3 px-4 sm:px-5">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-zinc-500">
            <p>Per Scholas Learners Knowledge Base: AI-Enabled Healthcare IT</p>
            <p>Pioneering Cohort 2026-RTT-23</p>
          </div>
        </footer>
      </div>

      <AuthModal isOpen={mobileAuthOpen} onClose={() => setMobileAuthOpen(false)} />
    </div>
  );
}

const BASENAME = window.location.hostname.includes('github.io')
  ? '/Per-Scholas-Knowledge-Hub'
  : '/';

function App() {
  return (
    <BrowserRouter basename={BASENAME}>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
