import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import ResizeHandle from './components/ResizeHandle';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import SectionPage from './pages/SectionPage';
import RecognitionPage from './pages/RecognitionPage';
import LearnerExperiencePage from './pages/LearnerExperiencePage';
import DeskolasPage from './pages/DeskolasPage';
import AdminControlPage from './pages/AdminControlPage';
import NotFoundPage from './pages/NotFoundPage';
import AuthModal from './components/AuthModal';
import ContributorSubmissionModal from './components/ContributorSubmissionModal';
import SuccessToast from './components/SuccessToast';
import { useAuth } from './hooks/useAuth';
import { type NewSubmission } from './utils/submissions';
import { PanelLeftOpen, PanelLeftClose, Menu, BookOpen, LogIn, LogOut, ShieldCheck, UploadCloud } from 'lucide-react';

const SIDEBAR_COLLAPSED = 72;
const SIDEBAR_SNAP_THRESHOLD = 260;
const SIDEBAR_MAX = 320;
const SIDEBAR_DEFAULT = 320;

function ScrollToTop({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
  const { pathname } = useLocation();
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [pathname, scrollRef]);
  return null;
}

function AppContent() {
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [isDragging, setIsDragging] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileAuthOpen, setMobileAuthOpen] = useState(false);
  const [addIntelOpen, setAddIntelOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const handleSubmitted = useCallback((submission: NewSubmission) => {
    setToastMessage(`${submission.full_name} "${submission.title}" added to the wall!`);
    setToastVisible(true);
    triggerRefresh();
  }, [triggerRefresh]);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, location.hash]);

  const handleResize = useCallback((delta: number) => {
    setSidebarWidth((w) => {
      const next = w + delta;
      return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_COLLAPSED, next));
    });
  }, []);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setSidebarWidth((w) => {
      if (w < SIDEBAR_SNAP_THRESHOLD) return SIDEBAR_COLLAPSED;
      return SIDEBAR_DEFAULT;
    });
  }, []);

  const isCollapsed = sidebarWidth <= SIDEBAR_COLLAPSED;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-zinc-900 text-zinc-100">
      <ScrollToTop scrollRef={scrollRef} />

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

      {/* ══════════════════════════════════════════════════════
          GLOBAL HEADER (static, outside all panels)
         ══════════════════════════════════════════════════════ */}
      <header className="flex-shrink-0 z-30 bg-zinc-900/95 backdrop-blur-lg">
        {/* Mobile header row */}
        <div className="flex md:hidden items-center gap-3 px-4 py-2.5">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-blue-400 active:bg-zinc-800 flex-shrink-0 outline-none select-none focus-visible:ring-2 focus-visible:ring-zinc-600"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 shrink-0" />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-white shrink-0" />
            </div>
            <span className="font-bold text-sm text-zinc-100 truncate">
              {location.pathname.includes('/cohort-admin') ? 'Learners Hub Admin' : 'Learners Hub'}
            </span>
          </div>
          <button
            onClick={() => setAddIntelOpen(true)}
            title="Add Intel"
            className="p-2 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 flex-shrink-0 outline-none select-none"
            aria-label="Add Intel"
          >
            <UploadCloud className="w-4.5 h-4.5 shrink-0" />
          </button>
          <Link
            to="/cohort-admin"
            title="Admin Command Center"
            className="p-2 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 flex-shrink-0 outline-none select-none"
            aria-label="Admin Command Center"
          >
            <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
          </Link>
          {user ? (
            <button
              onClick={signOut}
              title="Sign Out"
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 flex-shrink-0 outline-none select-none"
              aria-label="Sign out"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0" />
            </button>
          ) : (
            <button
              onClick={() => setMobileAuthOpen(true)}
              title="Sign In"
              className="p-2 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 flex-shrink-0 outline-none select-none"
              aria-label="Sign in"
            >
              <LogIn className="w-4.5 h-4.5 shrink-0" />
            </button>
          )}
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-4 pb-2.5">
          <SearchBar onMenuClick={() => setMobileSidebarOpen(true)} />
        </div>

        {/* Desktop header row */}
        <div className="hidden md:flex items-center gap-3 px-4 py-2.5 max-w-[90rem] mx-auto w-full">
          <button
            onClick={() => setDesktopSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-blue-400 flex-shrink-0 outline-none select-none focus-visible:ring-2 focus-visible:ring-zinc-600 transition-colors"
            title={desktopSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {desktopSidebarOpen
              ? <PanelLeftClose className="w-4 h-4 shrink-0" />
              : <PanelLeftOpen className="w-4 h-4 shrink-0" />}
          </button>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white shrink-0" />
            </div>
            <span className="font-semibold text-sm text-zinc-100">Learners Hub</span>
          </div>
          <div className="flex items-center gap-2.5 flex-1 max-w-2xl mx-auto min-w-0">
            <Link
              to="/cohort-admin"
              title="Admin Command Center"
              className="p-2 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 outline-none select-none focus-visible:ring-2 focus-visible:ring-zinc-600 flex-shrink-0"
              aria-label="Admin Command Center"
            >
              <ShieldCheck className="w-5 h-5 shrink-0" />
            </Link>
            <div className="flex-1 min-w-0">
              <SearchBar onMenuClick={() => setDesktopSidebarOpen(true)} />
            </div>
            <button
              onClick={() => setAddIntelOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all duration-200 ease-spatial active:scale-[0.98] flex-shrink-0 whitespace-nowrap outline-none select-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
            >
              <UploadCloud className="w-3.5 h-3.5 shrink-0" />
              Add Intel
            </button>
          </div>
          <div className="flex items-center flex-shrink-0">
            {user ? (
              <button
                onClick={signOut}
                title="Sign Out"
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 outline-none select-none focus-visible:ring-2 focus-visible:ring-zinc-600"
              >
                <LogOut className="w-5 h-5 shrink-0" />
              </button>
            ) : (
              <button
                onClick={() => setMobileAuthOpen(true)}
                title="Sign In"
                className="p-2 rounded-lg text-blue-400 hover:text-white hover:bg-blue-600/15 outline-none select-none focus-visible:ring-2 focus-visible:ring-zinc-600"
              >
                <LogIn className="w-5 h-5 shrink-0" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          RESIZABLE WORKSPACE (sidebar + handle + main)
         ══════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row md:items-stretch max-w-[90rem] w-full mx-auto px-1 md:px-2 py-1 md:py-2 gap-0">

        {/* ── Desktop Sidebar Panel ────────────────────────── */}
        {desktopSidebarOpen && (
          <aside
            className={`hidden md:flex flex-col flex-shrink-0 min-h-0 overflow-hidden rounded-2xl bg-zinc-950/40 shadow-2xl shadow-black/40 border border-zinc-800/30 ${isDragging ? '' : 'transition-[width] duration-200 ease-out'}`}
            style={{ width: sidebarWidth, minWidth: SIDEBAR_COLLAPSED, maxWidth: SIDEBAR_MAX }}
          >
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <Sidebar onToggle={() => setDesktopSidebarOpen(false)} isCollapsed={isCollapsed} />
            </div>
          </aside>
        )}

        {/* ── Resize Handle ────────────────────────────────── */}
        {desktopSidebarOpen && (
          <ResizeHandle onResize={handleResize} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
        )}

        {/* ── Main Content Panel ───────────────────────────── */}
        <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-zinc-950/40 rounded-2xl shadow-2xl shadow-black/40 border border-zinc-800/30">
          {/* Scrollable route content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain p-3 md:p-5">
            <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
              <ErrorBoundary>
                <div key={location.pathname} className="animate-content-in">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/cohort-admin" element={<AdminControlPage />} />
                    <Route path="/recognition" element={<RecognitionPage />} />
                    <Route path="/learner-experience" element={<LearnerExperiencePage />} />
                    <Route path="/deskolas" element={<DeskolasPage />} />
                    <Route path="/article/:slug" element={<ArticlePage />} />
                    <Route path="/article/:slug/*" element={<ArticlePage />} />
                    <Route path="/:slug/*" element={<SectionPage refreshKey={refreshKey} />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </div>
              </ErrorBoundary>
            </div>
          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════
          GLOBAL FOOTER (static, outside all panels)
         ══════════════════════════════════════════════════════ */}
      <footer className="flex-shrink-0 py-1.5 text-center text-xs text-zinc-500">
        <p>Per Scholas Learners Knowledge Base</p>
      </footer>

      <AuthModal isOpen={mobileAuthOpen} onClose={() => setMobileAuthOpen(false)} />
      <ContributorSubmissionModal
        isOpen={addIntelOpen}
        onClose={() => setAddIntelOpen(false)}
        onSubmitted={handleSubmitted}
        onRefresh={triggerRefresh}
      />
      <SuccessToast
        message={toastMessage}
        isVisible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
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
