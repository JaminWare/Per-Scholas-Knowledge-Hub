import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import SectionPage from './pages/SectionPage';
import ComingSoonPage from './pages/ComingSoonPage';
import RecognitionPage from './pages/RecognitionPage';
import { PanelLeftOpen, PanelLeftClose, Sun, Moon } from 'lucide-react';

function ScrollToTop({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    scrollRef.current?.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const mainRef = useRef<HTMLElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-200 dark:bg-[#242427] text-zinc-800 dark:text-zinc-100">
      {/* ── Sidebar ─────────────────────────────────── */}
      <div
        className={`flex-shrink-0 border-r border-zinc-700 h-full overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-72' : 'w-0'
        }`}
      >
        <div className="w-72 h-full overflow-y-auto">
          <Sidebar onToggle={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* ── Main area ───────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Sticky header — always dark charcoal in both modes */}
        <header className="flex-shrink-0 z-30 bg-zinc-800/95 dark:bg-[#242427]/90 backdrop-blur-lg border-b border-zinc-700/80 dark:border-zinc-600">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-2 rounded-lg bg-zinc-700 text-zinc-400 hover:bg-zinc-600 hover:text-sky-400 transition-colors flex-shrink-0"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen
                ? <PanelLeftClose className="w-5 h-5" />
                : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <div className="flex-1 max-w-2xl">
              <SearchBar onMenuClick={() => setSidebarOpen(true)} />
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-zinc-700 text-zinc-400 hover:bg-zinc-600 hover:text-sky-400 transition-colors flex-shrink-0"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark'
                ? <Sun className="w-5 h-5" />
                : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Scrollable page content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-6">
          <ScrollToTop scrollRef={mainRef} />
          <Routes>
            <Route path="/" element={<HomePage onRefresh={triggerRefresh} />} />
            <Route path="/recognition" element={<RecognitionPage />} />
            <Route path="/article/:slug" element={<ArticlePage />} />
            <Route path="/article/:slug/*" element={<ArticlePage />} />
            <Route path="/:slug/*" element={<SectionPage refreshKey={refreshKey} />} />
            <Route path="*" element={<ComingSoonPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="flex-shrink-0 border-t border-zinc-700/40 dark:border-zinc-600 py-3 px-5">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-zinc-500 dark:text-zinc-500">
            <p>Per Scholas — Learners Knowledge Base: AI-Enabled Healthcare IT</p>
            <p>Pioneering Cohort 2026-RTT-23</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
