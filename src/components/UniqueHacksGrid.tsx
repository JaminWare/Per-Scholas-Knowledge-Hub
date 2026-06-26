import { useState, useEffect } from 'react';
import { Filter, ChevronRight, Sparkles, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ArticleCard from './ArticleCard';
import type { Article } from '../types/database';

const quickFilters = [
  { id: 'comptia', label: 'CompTIA Mnemonics', tag: 'mnemonics', icon: '⏱️' },
  { id: 'healthcare', label: 'Healthcare Lab', tag: 'healthcare-lab', icon: '🏥' },
  { id: 'networking', label: 'Networking Tips', tag: 'networking', icon: '🌐' },
  { id: 'prompts', label: 'AI Prompt Hacks', tag: 'prompts', icon: '🤖' },
];

export default function UniqueHacksGrid() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchArticles() {
      setIsLoading(true);
      try {
        let query = supabase.from('articles').select('*').order('created_at', { ascending: false });
        if (activeFilter) query = query.contains('tags', [activeFilter]);
        const { data } = await query.limit(6);
        setArticles(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchArticles();
  }, [activeFilter]);

  return (
    <section className="mt-8">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Unique Hacks Quick-Reference Grid</h2>
            <p className="text-sm text-zinc-500">Specialized, non-textbook shortcuts from the community</p>
          </div>
        </div>

        {/* Quick Filter Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveFilter(null)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === null
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-zinc-800 text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-400'
            }`}
          >
            <Filter className="w-4 h-4" />
            All Tips
          </button>
          {quickFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.tag)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === f.tag
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-400'
              }`}
            >
              <span>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-zinc-800/50 rounded-xl animate-pulse">
                <div className="h-4 bg-zinc-700 rounded w-3/4" />
                <div className="h-3 bg-zinc-700 rounded w-full mt-2" />
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article) => (
              <div key={article.id} className="bg-zinc-800/50 border border-zinc-700 hover:border-emerald-500/40 rounded-xl p-4 transition-colors">
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-zinc-100 text-sm">{article.title}</h3>
                    {article.excerpt && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{article.excerpt}</p>
                    )}
                    {article.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {article.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 text-xs bg-zinc-700 text-zinc-400 rounded">{tag}</span>
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
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-zinc-600" />
            </div>
            <p className="text-zinc-500 text-sm">No tips found for this category yet.</p>
            <p className="text-zinc-600 text-xs mt-1">Be the first to contribute!</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-zinc-800">
          <button className="inline-flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
            View all tips & tricks
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
