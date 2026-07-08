import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, ChevronDown, ChevronRight, ArrowLeft, BookOpen,
  Lightbulb, GitBranch, Sparkles, Star, Crown, Link2, UploadCloud,
  Laptop, Monitor, Heart, LifeBuoy, Layers, Pencil,
} from 'lucide-react';
import ContributorSubmissionModal from '../components/ContributorSubmissionModal';
import { useSmartBack } from '../hooks/useSmartBack';
import { useAuth } from '../hooks/useAuth';
import AuthModal from '../components/AuthModal';
import ProfileModal from '../components/ProfileModal';
import { deriveTierBadge } from '../constants/badges';
import { useContributorGroups, mapToPortalBucket, resolveTrack, groupItemsByTrack, type ContributorGroup, type PortfolioItem } from '../hooks/useContributorGroups';

// ── Badge colour map ──────────────────────────────────────

const badgeColors: Record<string, string> = {
  'Founder':             'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  'Core 1 Expert':       'bg-sky-500/10 text-sky-400',
  'Core 2 Expert':       'bg-sky-500/10 text-sky-400',
  'HealthIT Specialist': 'bg-sky-500/10 text-sky-400',
  'Diagram Architect':   'bg-sky-500/10 text-sky-400',
  'Reference Author':    'bg-amber-500/10 text-amber-400',
  'Playbook Engineer':   'bg-sky-500/10 text-sky-400',
  'Cohort Contributor':  'bg-zinc-700 text-zinc-400',
  'Domain Expert':       'bg-sky-500/15 text-sky-300 border border-sky-400/30',
  'Master Architect':    'bg-amber-500/15 text-amber-300 border border-amber-400/30',
};

function BadgeTag({ badge }: { badge: string }) {
  const cls = badgeColors[badge] ?? badgeColors['Cohort Contributor'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
      [{badge}]
    </span>
  );
}

function getDomainName(urlString: string): string {
  try {
    return new URL(urlString).hostname.replace('www.', '');
  } catch {
    return 'Resource Link';
  }
}

const SECTION_HDR = 'bg-zinc-800/40 text-zinc-400 font-mono text-[10px] uppercase tracking-wider border-y border-zinc-800/50 px-3 py-1 block first:border-t-0';

// ── Category icon helper ─────────────────────────────────

function getCategoryIcon(type: string, isFounder: boolean) {
  if (type === 'Resource Links') return <Link2 className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />;
  if (type === 'Pro Tips') return <Lightbulb className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />;
  if (type === 'Diagrams') return <GitBranch className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />;
  if (type === 'Playbooks') return <Sparkles className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />;
  return <BookOpen className={`w-3.5 h-3.5 flex-shrink-0 ${isFounder ? 'text-amber-500' : 'text-sky-500'}`} />;
}

// ── Unified Contributor Card ─────────────────────────────

function ContributorCard({ group, isNew, isOpen, onToggle, onEditProfile }: {
  group: ContributorGroup;
  isNew: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onEditProfile?: () => void;
}) {
  const isFounder = group.topBadge === 'Founder';
  const initial = group.name.charAt(0).toUpperCase();
  const totalCount = group.items.length;
  const tierBadge = deriveTierBadge(totalCount);

  const [openCategory, setOpenCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) setOpenCategory(null);
  }, [isOpen]);

  const categoryEntries = Object.entries(group.portalTypeCounts).sort((a, b) => b[1] - a[1]);

  const handleTabClick = (e: React.MouseEvent, type: string) => {
    e.stopPropagation();
    if (openCategory === type) {
      setOpenCategory(null);
      if (isOpen) onToggle();
    } else {
      setOpenCategory(type);
      if (!isOpen) onToggle();
    }
  };

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      isFounder
        ? 'border-sky-500/20 bg-zinc-900 hover:border-sky-400/30 transition-colors'
        : isOpen
          ? 'border-sky-500/20 bg-zinc-900'
          : 'border-zinc-800/50 bg-zinc-900 hover:border-zinc-700'
    }`}>

      {/* Header */}
      <div className="px-3 sm:px-5 py-3 sm:py-4">
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 text-left"
        >
          {isFounder && <Crown className="w-5 h-5 text-sky-400 flex-shrink-0" />}
          <div className={`${isFounder ? 'w-12 h-12' : 'w-10 h-10'} rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white ${isFounder ? 'text-lg' : 'text-sm'} ${
            isFounder
              ? 'bg-sky-500'
              : isNew
                ? 'bg-sky-500'
                : 'bg-zinc-500'
          }`}>
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`${isFounder ? 'font-bold' : 'font-semibold'} text-white text-sm`}>{group.name}</span>
              {onEditProfile && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEditProfile(); }}
                  title="Edit Display Name"
                  className="ml-1 inline-flex items-center text-zinc-500 hover:text-sky-400 transition-colors p-1 rounded-full hover:bg-zinc-800"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
              {!isFounder && tierBadge !== group.topBadge && <BadgeTag badge={tierBadge} />}
              {!isFounder && <BadgeTag badge={group.topBadge} />}
              {isNew && !isFounder && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-sky-500 text-white rounded-full">
                  <Star className="w-2 h-2" /> NEW
                </span>
              )}
            </div>
          </div>
          {isOpen
            ? <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            : <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          }
        </button>

        {/* Interactive category tab pills */}
        <div className="flex flex-wrap gap-2 md:gap-3 mt-3">
          {categoryEntries.map(([type, count]) => {
            const isActive = openCategory === type;
            return (
              <button
                key={type}
                onClick={(e) => handleTabClick(e, type)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? (isFounder
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'bg-sky-500/20 border-sky-500/50 text-sky-400')
                    : 'bg-zinc-800 border-zinc-800/50 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                }`}
              >
                {getCategoryIcon(type, isFounder)}
                {type} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded content panel */}
      {isOpen && openCategory && (() => {
        const categoryItems = group.items.filter((i) => mapToPortalBucket(i.submission_type) === openCategory);
        const trackGroups = groupItemsByTrack(categoryItems);
        return (
          <div className={`border-t ${isFounder ? 'border-zinc-800/50' : 'border-zinc-800/50'} px-5 py-4`}>
            <div className="bg-zinc-900/60 rounded-lg p-2 border border-zinc-800 max-h-56 overflow-y-auto">
              {Array.from(trackGroups.entries()).map(([bucket, items]) => (
                <div key={bucket}>
                  {trackGroups.size > 1 && <span className={SECTION_HDR}>{bucket}</span>}
                  <div className="divide-y divide-zinc-800/50">
                    {items.map((s) => {
                      const itemType = s.submission_type ?? 'Article';
                      const itemBucket = mapToPortalBucket(itemType);
                      const isResourceLink = itemBucket === 'Resource Links';
                      const isInternalNav = itemBucket === 'Articles' || itemBucket === 'Pro Tips' || itemBucket === 'Diagrams' || itemBucket === 'Playbooks';

                      if (isResourceLink) {
                        const hasUrl = s.content && s.content.startsWith('http');
                        if (!hasUrl) {
                          return (
                            <div
                              key={s.id}
                              className="flex items-center gap-3 px-4 py-2.5 border-l-4 border-transparent opacity-50"
                            >
                              <Link2 className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                              <span className="text-sm text-zinc-600 truncate">{s.title}</span>
                              <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-600 flex-shrink-0">No URL</span>
                            </div>
                          );
                        }
                        return (
                          <a
                            key={s.id}
                            href={s.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-4 py-2.5 border-l-4 border-transparent hover:bg-sky-500/10 hover:border-sky-400 transition-all group"
                          >
                            <Link2 className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                            <span className="text-sm text-zinc-200 truncate group-hover:text-sky-400">{s.title}</span>
                            <span className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500">{getDomainName(s.content)}</span>
                              <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-sky-400" />
                            </span>
                          </a>
                        );
                      }

                      if (isInternalNav) {
                        return (
                          <Link
                            key={s.id}
                            to={`/article/${s.slug || buildSlugFromTitle(s.title)}`}
                            className={`flex items-center gap-3 px-4 py-2.5 border-l-4 border-transparent hover:bg-sky-500/15 transition-all group ${
                              isFounder ? 'hover:border-amber-400' : 'hover:border-sky-500'
                            }`}
                          >
                            {getCategoryIcon(itemBucket, isFounder)}
                            <span className={`text-sm text-zinc-200 truncate ${
                              isFounder ? 'group-hover:text-amber-400' : 'group-hover:text-sky-400'
                            }`}>{s.title}</span>
                            <span className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500">{itemBucket}</span>
                              <ChevronRight className={`w-3 h-3 text-zinc-600 ${
                                isFounder ? 'group-hover:text-amber-400' : 'group-hover:text-sky-400'
                              }`} />
                            </span>
                          </Link>
                        );
                      }

                      return (
                        <div
                          key={s.id}
                          className="flex items-center gap-3 px-4 py-2.5 border-l-4 border-transparent"
                        >
                          {getCategoryIcon(itemBucket, isFounder)}
                          <span className="text-sm text-zinc-300 truncate">{s.title}</span>
                          <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-500 flex-shrink-0">{itemBucket}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function buildSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ── Main page ─────────────────────────────────────────────

export default function RecognitionPage() {
  const { goBack } = useSmartBack('/');
  const { contributors, newestNonFounderName: newestName } = useContributorGroups();
  const [openContributor, setOpenContributor] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [trackFilter, setTrackFilter] = useState<string>('All');
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const currentUserName = localStorage.getItem('learnerHub_authorName') || '';

  const TRACK_FILTER_OPTIONS = [
    { value: 'All', label: 'All Tracks', icon: Layers },
    { value: 'Learner Experience', label: 'Learner Experience', icon: LifeBuoy },
    { value: 'CompTIA A+ Core 1', label: 'Core 1', icon: Laptop },
    { value: 'CompTIA A+ Core 2', label: 'Core 2', icon: Monitor },
    { value: 'Advanced Healthcare IT', label: 'Healthcare IT', icon: Heart },
  ] as const;

  const filteredContributors = useMemo(() => {
    if (trackFilter === 'All') return contributors;
    return contributors
      .map((g) => {
        const matchingItems = g.items.filter((item) => resolveTrack(item.track ?? '', item.slug) === trackFilter);
        if (matchingItems.length === 0) return null;
        const portalTypeCounts: Record<string, number> = {};
        for (const item of matchingItems) {
          const bucket = mapToPortalBucket(item.submission_type);
          portalTypeCounts[bucket] = (portalTypeCounts[bucket] ?? 0) + 1;
        }
        return { ...g, items: matchingItems, portalTypeCounts };
      })
      .filter((g): g is ContributorGroup => g !== null);
  }, [contributors, trackFilter]);

  return (
    <div className="pb-32">

      {/* Full-bleed cinematic hero banner */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900">
        <div className="relative px-6 py-4 md:px-8 md:py-5">
          {/* Back button inside the banner */}
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 text-sky-200/80 hover:text-white transition-colors text-sm font-medium mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Previous Page
          </button>

          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-500/30">
                <Award className="w-5 h-5 text-sky-400" />
              </div>
              <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">
                Per Scholas
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Recognition Wall
            </h1>
            <p className="text-sky-100/80 leading-relaxed text-sm">
              Celebrating every learner who has contributed research, documentation, and knowledge to the collective!
            </p>
          </div>
        </div>
      </section>

      {/* Contributors sectiontighter to banner */}
      <section className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-sky-500" />
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
            Cohort Contributors
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-700 text-zinc-400">
            {filteredContributors.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-5">
          {TRACK_FILTER_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = trackFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTrackFilter(opt.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-2 sm:py-1.5 text-xs sm:text-sm font-medium border transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm border-transparent'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border-zinc-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>

        {filteredContributors.length > 0 ? (
          <div className="space-y-3">
            {filteredContributors.map((g) => (
              <ContributorCard
                key={g.name}
                group={g}
                isNew={g.name === newestName && g.topBadge !== 'Founder'}
                isOpen={openContributor === g.name}
                onToggle={() => setOpenContributor((prev) => prev === g.name ? null : g.name)}
                onEditProfile={() => user ? setProfileOpen(true) : setAuthOpen(true)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-zinc-700 p-8 text-center">
            <Award className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-400">
              No contributions yet. Be the first to contribute!
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              Submit Your Contribution
            </button>
          </div>
        )}
      </section>

      <ContributorSubmissionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={() => setModalOpen(false)}
      />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

    </div>
  );
}
