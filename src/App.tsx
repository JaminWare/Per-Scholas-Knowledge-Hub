import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import SectionPage from './pages/SectionPage';
import ComingSoonPage from './pages/ComingSoonPage';
import { PanelLeftOpen, PanelLeftClose, Sun, Moon } from 'lucide-react';

function ScrollToTop({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
  const { pathname } = useLocation();
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const mainRef = useRef<HTMLElement>(null);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-100 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100">
      {/* ── Sidebar ─────────────────────────────────── */}
      <div
        className={`flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 h-full overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-72' : 'w-0'
        }`}
      >
        <div className="w-72 h-full overflow-y-auto">
          <Sidebar onToggle={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* ── Main area ───────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Sticky header */}
        <header className="flex-shrink-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-sky-100 dark:hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex-shrink-0"
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
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-sky-100 dark:hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex-shrink-0"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark'
                ? <Sun className="w-5 h-5" />
                : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Scrollable page content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-6 md:p-8">
          <ScrollToTop scrollRef={mainRef} />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/article/:slug" element={<ArticlePage />} />
            <Route path="/article/:slug/*" element={<ArticlePage />} />
            <Route path="/:slug/*" element={<SectionPage />} />
            <Route path="*" element={<ComingSoonPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="flex-shrink-0 border-t border-zinc-200 dark:border-zinc-800 py-4 px-6">
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
