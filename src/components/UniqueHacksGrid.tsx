import { useState, useEffect } from 'react';
import { Filter, ChevronRight, Sparkles, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ArticleCard from './ArticleCard';
import type { Article } from '../types/database';

interface QuickFilter {
  id: string;
  label: string;
  tag: string;
  icon: string;
}

const quickFilters: QuickFilter[] = [
  { id: 'macos', label: 'macOS / Boot Camp Environment', tag: 'macos', icon: '💻' },
  { id: 'azari', label: 'Azari Prompt Frameworks', tag: 'azari', icon: '🤖' },
  { id: 'comptia', label: 'CompTIA Memorization Mnemonics', tag: 'mnemonics', icon: '⏱️' },
  { id: 'healthcare', label: 'Healthcare Lab Troubleshooting', tag: 'healthcare-lab', icon: '🏥' },
];

export default function UniqueHacksGrid() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchArticles() {
      setIsLoading(true);
      try {
        let query = supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false });

        if (activeFilter) {
          query = query.contains('tags', [activeFilter]);
        }

        const { data, error } = await query.limit(6);
        if (error) throw error;
        setArticles(data || []);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchArticles();
  }, [activeFilter]);

  return (
    <section className="mt-8">
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Unique Hacks Quick-Reference Grid
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Specialized, non-textbook shortcuts from the community
            </p>
          </div>
        </div>

        {/* Quick Filter Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveFilter(null)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === null
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            <Filter className="w-4 h-4" />
            All Tips
          </button>
          {quickFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.tag)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === filter.tag
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <span>{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="relative">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mt-2" />
                </div>
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((article) => (
                <div key={article.id} className="card p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white text-sm">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                      {article.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {article.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No tips found for this category yet.
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                Be the first to contribute!
              </p>
            </div>
          )}
        </div>

        {/* View More */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <a
            href="#"
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
          >
            View all tips & tricks
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
