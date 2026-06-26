import { HashRouter as Router, Routes, Route, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import SectionPage from './pages/SectionPage';
import { Menu, ChevronRight } from 'lucide-react';

function AppContent() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onToggleDesktop={() => setDesktopSidebarOpen(false)}
      />

      {/* Main content — shifts right when desktop sidebar is open */}
      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ${
          desktopSidebarOpen ? 'lg:ml-72' : 'lg:ml-0'
        }`}
      >
        {/* Top navigation bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
            {/* Mobile menu */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Desktop expand button when sidebar is closed */}
            {!desktopSidebarOpen && (
              <button
                onClick={() => setDesktopSidebarOpen(true)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="text-xs font-medium">Menu</span>
              </button>
            )}
            <div className="flex-1 max-w-2xl">
              <SearchBar onMenuClick={() => setMobileSidebarOpen(true)} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:slug/*" element={<RouteHandler />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-4 lg:px-8">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
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
  const isArticle = segments.length > 1;
  if (isArticle) return <ArticlePage />;
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
