import { Linkedin, Award } from 'lucide-react';
import type { Contributor } from '../types/database';

interface ContributorCardProps {
  contributor: Contributor;
}

export default function ContributorCard({ contributor }: ContributorCardProps) {
  const initials = contributor.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-zinc-800 p-6 border border-zinc-600">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-600/10 to-blue-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-600/10 to-blue-400/10 rounded-full blur-2xl" />

      <div className="relative flex items-start gap-4">
        <div className="flex-shrink-0">
          {contributor.avatar_url ? (
            <img
              src={contributor.avatar_url}
              alt={contributor.name}
              className="w-16 h-16 rounded-xl object-cover ring-2 ring-blue-600/20"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <span className="text-white font-bold text-lg">{initials}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-zinc-100 text-lg">{contributor.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Award className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">{contributor.cohort_id}</span>
          </div>
          {contributor.bio && (
            <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{contributor.bio}</p>
          )}
          {contributor.linkedin_url && (
            <a
              href={contributor.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-zinc-400 hover:text-blue-400 transition-colors"
            >
              <Linkedin className="w-4 h-4" />
              <span>Connect on LinkedIn</span>
            </a>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">AI Enabled Healthcare IT Cohort</span>
          <span className="px-2 py-1 text-xs font-medium bg-blue-900/30 text-blue-400 rounded-full">
            Contributor
          </span>
        </div>
      </div>
    </div>
  );
}
