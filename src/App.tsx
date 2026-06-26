import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import SectionPage from './pages/SectionPage';
import { Menu, PanelLeftOpen } from 'lucide-react';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  // Close mobile overlay on navigation
  useEffect(() => {}, [location]);

  return (
    // Root: full viewport, no overflow — children scroll independently
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* ── Sidebar ─────────────────────────────────── */}
      <div
        className={`flex-shrink-0 border-r border-slate-200 dark:border-slate-800 h-full overflow-y-auto transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-72' : 'w-0'
        }`}
      >
        {/* Inner wrapper keeps content from wrapping during transition */}
        <div className="w-72 min-h-full">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* ── Main area ───────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Sticky header */}
        <header className="flex-shrink-0 sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Sidebar toggle — always visible */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex-shrink-0"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? (
                <Menu className="w-5 h-5" />
              ) : (
                <PanelLeftOpen className="w-5 h-5" />
              )}
            </button>
            <div className="flex-1 max-w-2xl">
              <SearchBar onMenuClick={() => setSidebarOpen(true)} />
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:slug/*" element={<RouteHandler />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 py-5 px-4 lg:px-8">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
            <p>Per Scholas — Learners Knowledge Base: AI-Enabled Healthcare IT</p>
            <p>Pioneering Cohort 2026-RTT-23</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function RouteHandler() {
  const location = useLocation();
  const segments = location.hash.replace('#/', '').split('/').filter(Boolean);
  if (segments.length > 1) return <ArticlePage />;
  return <SectionPage />;
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
