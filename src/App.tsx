import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
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
import { PanelLeftOpen, PanelLeftClose, Menu, BookOpen, LogIn, LogOut, ShieldCheck } from 'lucide-react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileAuthOpen, setMobileAuthOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const location = useLocation();
  const { user, signOut } = useAuth();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <ScrollToTop />

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

      {/* ── Mobile Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-lg flex md:hidden items-center gap-3 px-4 py-3">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-sky-400 active:bg-zinc-800 flex-shrink-0 outline-none select-none ring-0 focus:ring-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm text-zinc-100 truncate">
            {location.pathname.includes('/cohort-admin') ? 'Learners Hub Admin' : 'Learners Hub'}
          </span>
        </div>
        <Link
          to="/cohort-admin"
          title="Admin Command Center"
          className="p-2 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 flex-shrink-0 outline-none select-none ring-0 focus:ring-0"
          aria-label="Admin Command Center"
        >
          <ShieldCheck className="w-4.5 h-4.5" />
        </Link>
        {user ? (
          <button
            onClick={signOut}
            title="Sign Out"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 flex-shrink-0 outline-none select-none ring-0 focus:ring-0"
            aria-label="Sign out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        ) : (
          <button
            onClick={() => setMobileAuthOpen(true)}
            title="Sign In"
            className="p-2 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 flex-shrink-0 outline-none select-none ring-0 focus:ring-0"
            aria-label="Sign in"
          >
            <LogIn className="w-4.5 h-4.5" />
          </button>
        )}
      </header>

      {/* ── Mobile Search ─────────────────────────────────── */}
      <div className="md:hidden px-4 pb-4">
        <SearchBar onMenuClick={() => setMobileSidebarOpen(true)} />
      </div>

      {/* ── Single Centered Canvas ────────────────────────── */}
      <div className="max-w-[90rem] mx-auto px-4 md:px-8 pb-12 md:py-10">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">

          {/* ── Floating Sidebar (desktop only) ─────────────── */}
          {desktopSidebarOpen && (
            <aside className="hidden md:block w-72 flex-shrink-0 sticky top-10 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-[24px]">
              <Sidebar onToggle={() => setDesktopSidebarOpen(false)} />
            </aside>
          )}

          {/* ── Module Host (main content) ───────────────────── */}
          <main className="flex-1 min-w-0 w-full">
            {/* Desktop toolbar row */}
            <div className="hidden md:flex items-center gap-3 mb-6">
              <button
                onClick={() => setDesktopSidebarOpen((v) => !v)}
                className="p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-sky-400 active:bg-zinc-800 flex-shrink-0 outline-none select-none ring-0 focus:ring-0"
                title={desktopSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {desktopSidebarOpen
                  ? <PanelLeftClose className="w-5 h-5" />
                  : <PanelLeftOpen className="w-5 h-5" />}
              </button>
              <div className="flex-1 max-w-2xl">
                <SearchBar onMenuClick={() => setDesktopSidebarOpen(true)} />
              </div>
              <div className="ml-auto flex items-center gap-1">
                <Link
                  to="/cohort-admin"
                  title="Admin Command Center"
                  className="p-2 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 outline-none select-none ring-0 focus:ring-0"
                  aria-label="Admin Command Center"
                >
                  <ShieldCheck className="w-5 h-5" />
                </Link>
                {user ? (
                  <button
                    onClick={signOut}
                    title="Sign Out"
                    className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 outline-none select-none ring-0 focus:ring-0"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setMobileAuthOpen(true)}
                    title="Sign In"
                    className="p-2 rounded-lg text-sky-400 hover:text-white hover:bg-sky-500/15 outline-none select-none ring-0 focus:ring-0"
                  >
                    <LogIn className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Route content */}
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

            {/* Footer */}
            <div className="mt-12 pb-4 text-center text-xs text-zinc-500">
              <p>Per Scholas Learners Knowledge Base</p>
            </div>
          </main>
        </div>
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
