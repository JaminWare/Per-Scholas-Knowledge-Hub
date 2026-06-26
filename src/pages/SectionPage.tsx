import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ArticleCard from '../components/ArticleCard';
import type { Article } from '../types/database';
import {
  Shield,
  Network,
  Cpu,
  Lock,
  Cloud,
  Server,
  Laptop,
  Wrench,
  Users,
  AlertTriangle,
  Lightbulb,
  FileText,
  Sparkles,
  Layout,
} from 'lucide-react';

const sectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  '01-security': Shield,
  '02-networking': Network,
  '03-hardware': Cpu,
  '04-identity-access': Lock,
  '05-cloud': Cloud,
  '06-servers': Server,
  '07-mobile': Laptop,
  '08-troubleshooting': Wrench,
  '09-operations': Users,
  '10-risk': AlertTriangle,
  'study-tips': Lightbulb,
  diagrams: Layout,
  'quick-references': FileText,
  'azari-prompt-playbook': Sparkles,
};

export default function SectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const Icon = slug ? sectionIcons[slug] || Shield : Shield;
  const sectionTitle = slug?.replace(/^\d+-/, '').replace(/-/g, ' ') || 'Articles';

  useEffect(() => {
    async function fetchArticles() {
      if (!slug) return;

      try {
        // Fetch articles by section_id or slug pattern
        const { data: section } = await supabase
          .from('sections')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        let query = supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false });

        if (section?.id) {
          query = query.eq('section_id', section.id);
        } else {
          // Fallback to slug pattern matching
          query = query.ilike('slug', `${slug}/%`);
        }

        const { data, error } = await query;

        if (error) throw error;
        setArticles(data || []);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchArticles();
  }, [slug]);

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
            {sectionTitle.replace(/\b\w/g, (l) => l.toUpperCase())}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {articles.length} articles in this section
          </p>
        </div>
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mt-3" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mt-2" />
            </div>
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Icon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">
            No articles in this section yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
