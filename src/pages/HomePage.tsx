import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ArticleCard from '../components/ArticleCard';
import CohortRecognitionWall from '../components/CohortRecognitionWall';
import UniqueHacksGrid from '../components/UniqueHacksGrid';
import type { Article, Contributor } from '../types/database';
import { BookOpen, Eye, Users, Target, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [featuredRes, recentRes, contributorsRes] = await Promise.all([
          supabase
            .from('articles')
            .select('*, contributor:contributors(*)')
            .eq('is_featured', true)
            .limit(3),
          supabase
            .from('articles')
            .select('*, contributor:contributors(*)')
            .order('created_at', { ascending: false })
            .limit(6),
          supabase
            .from('contributors')
            .select('*')
            .limit(10),
        ]);

        if (featuredRes.data) setFeaturedArticles(featuredRes.data);
        if (recentRes.data) setRecentArticles(recentRes.data);
        if (contributorsRes.data) setContributors(contributorsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const stats = [
    { label: 'Total Collective Insights', value: '148 Articles', icon: BookOpen, color: 'emerald' },
    { label: 'Total Resource Views', value: '2,450', icon: Eye, color: 'teal' },
    { label: 'Active Contributors', value: '25', subtext: 'Cohort 2026-RTT-23', icon: Users, color: 'cyan' },
    { label: 'Hand-Off Readiness', value: '85%', subtext: 'Completed', icon: Target, color: 'emerald' },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Introduction Panel */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-6">
            <TrendingUp className="w-4 h-4" />
            <span>Pioneering Cohort</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Per Scholas Knowledge Hub
            <span className="block text-gradient mt-1">AI-Enabled Healthcare IT</span>
          </h1>

          <p className="text-lg text-slate-300 max-w-2xl mb-8">
            Welcome to the collaborative resource hub for
            the <strong className="text-emerald-400">2026-RTT-23 cohort</strong> of
            AI-Enabled Healthcare IT students. Here you'll find comprehensive study materials,
            CompTIA certification guides, diagrams, and prompt engineering playbooks.
          </p>
        </div>
      </section>

      {/* Hub Activity Overview Banner */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                  {stat.subtext && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {stat.subtext}
                    </p>
                  )}
                </div>
                <div className={`p-2.5 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Featured Articles
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} featured />
            ))}
          </div>
        </section>
      )}

      {/* Unique Hacks Quick-Reference Grid */}
      <UniqueHacksGrid />

      {/* Recent Articles */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Recent Articles
          </h2>
          <a href="#" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
            View all
          </a>
        </div>
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
        ) : recentArticles.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">
              No articles yet. Check back soon for new content!
            </p>
          </div>
        )}
      </section>

      {/* Cohort Recognition Wall */}
      <CohortRecognitionWall />
    </div>
  );
}
