import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import SectionPage from './pages/SectionPage';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* ── Sidebar ─────────────────────────────────── */}
      <div
        className={`flex-shrink-0 border-r border-zinc-800 h-full overflow-y-auto transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-72' : 'w-0'
        }`}
      >
        <div className="w-72 min-h-full">
          <Sidebar onToggle={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* ── Main area ───────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Sticky header */}
        <header className="flex-shrink-0 z-30 bg-zinc-900/90 backdrop-blur-lg border-b border-zinc-800">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors flex-shrink-0"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen
                ? <PanelLeftClose className="w-5 h-5" />
                : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <div className="flex-1 max-w-2xl">
              <SearchBar onMenuClick={() => setSidebarOpen(true)} />
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:slug/*" element={<RouteHandler />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="flex-shrink-0 border-t border-zinc-800 py-4 px-6">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-zinc-500">
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
