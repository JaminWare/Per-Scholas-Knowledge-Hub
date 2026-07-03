import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, ChevronDown, ChevronRight, ChevronLeft,
  Shield, Network, Cpu, Lock, Cloud, Wrench, Users,
  BookOpen, LifeBuoy, Headphones, ExternalLink,
  Laptop, Monitor, Heart, Database, Award,
} from 'lucide-react';

// ─── Navigation data ──────────────────────────────────────

interface NavItem {
  title: string;
  slug: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface TrackSection {
  id: string;
  label: string;
  sublabel: string;
  color: 'sky' | 'teal' | 'cyan';
  domains: NavItem[];
}

const tracks: TrackSection[] = [
  {
    id: 'core1',
    label: 'CompTIA A+ Core 1',
    sublabel: '220-1201',
    color: 'sky',
    domains: [
      { title: 'Domain 1.0 Mobile Devices',              slug: 'core1-mobile',         icon: Laptop   },
      { title: 'Domain 2.0 Networking',                  slug: 'core1-networking',     icon: Network  },
      { title: 'Domain 3.0 Hardware',                    slug: 'core1-hardware',       icon: Cpu      },
      { title: 'Domain 4.0 Cloud',           slug: 'core1-virtualization', icon: Cloud    },
      { title: 'Domain 5.0 Troubleshooting', slug: 'core1-troubleshooting',icon: Wrench   },
    ],
  },
  {
    id: 'core2',
    label: 'CompTIA A+ Core 2',
    sublabel: '220-1202',
    color: 'teal',
    domains: [
      { title: 'Domain 1.0 OS',               slug: 'core2-os',         icon: Monitor },
      { title: 'Domain 2.0 Security',          slug: 'core2-security',   icon: Shield  },
      { title: 'Domain 3.0 Troubleshooting',    slug: 'core2-software',   icon: Wrench  },
      { title: 'Domain 4.0 SOP',               slug: 'core2-operations', icon: Users   },
    ],
  },
  {
    id: 'healthcare',
    label: 'Advanced Healthcare IT',
    sublabel: 'Specialized Modules',
    color: 'cyan',
    domains: [
      { title: 'EHR Architecture',   slug: 'healthcare-ehr',      icon: Database },
      { title: 'HIPAA Data Security', slug: 'healthcare-hipaa',   icon: Lock     },
      { title: 'Clinical Workflows',  slug: 'healthcare-clinical', icon: Heart    },
    ],
  },
];

// ─── Color maps ───────────────────────────────────────────

const trackBorder = {
  sky:  'border-sky-500/30',
  teal: 'border-sky-500/30',
  cyan: 'border-sky-500/30',
};
const trackBadge = {
  sky:  'bg-sky-500/10 text-sky-400',
  teal: 'bg-sky-500/10 text-sky-400',
  cyan: 'bg-sky-500/10 text-sky-400',
};
const trackText = {
  sky:  'text-sky-400',
  teal: 'text-sky-400',
  cyan: 'text-sky-400',
};

// ─── Domain row (flat direct link, no children) ───────────

function DomainRow({ domain }: { domain: NavItem }) {
  const location = useLocation();
  const Icon = domain.icon;
  const isActive = location.hash === `#/${domain.slug}`;

  return (
    <Link
      to={`/${domain.slug}`}
      className={`sidebar-item ${isActive ? 'active' : ''}`}
      style={{ paddingLeft: '12px' }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 truncate text-[12px] font-medium text-zinc-200">{domain.title}</span>
      <ChevronRight className="w-3 h-3 text-zinc-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

// ─── Main Sidebar component ───────────────────────────────

interface SidebarProps {
  onToggle: () => void;
}

export default function Sidebar({ onToggle }: SidebarProps) {
  const location = useLocation();
  const [openTracks, setOpenTracks] = useState<Record<string, boolean>>({
    core1: true, core2: false, healthcare: false,
  });

  const lxActive = location.hash === '#/learner-experience';

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-sky-500/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sky-500/10 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/20 flex-shrink-0">
            <BookOpen className="w-[18px] h-[18px] text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-zinc-100 text-[13px] leading-tight truncate">
              Cohort Survival Guide
            </p>
            <p className="text-[11px] text-zinc-400">2026-RTT-23</p>
          </div>
        </Link>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex-shrink-0"
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 pb-40 space-y-0.5">
        <Link
          to="/"
          className={`sidebar-item ${location.hash === '' || location.hash === '#/' ? 'active' : ''}`}
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          <span className="truncate text-[13px]">Home</span>
        </Link>

        {/* ── START HERE block ─────────────────────────────── */}
        <div className="my-2 border-t border-sky-500/20" />
        <p className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-sky-400">
          Start Here
        </p>
        <Link
          to="/learner-experience"
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-[13px] transition-all ${
            lxActive
              ? 'bg-white/10 text-white border-2 border-white shadow-[0_0_15px_rgba(56,189,248,0.6)]'
              : 'bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/15 hover:border-white/25 hover:text-white'
          }`}
        >
          <LifeBuoy className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate">Learner Experience & FAQs</span>
        </Link>
        <a
          href="https://deskolas.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          title="Opens in a new tab"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-[13px] transition-all duration-200 hover:scale-[1.02] active:scale-95 bg-sky-500/10 text-sky-300 border border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-400/40"
        >
          <Headphones className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate">Deskolas</span>
          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
        </a>
        <div className="my-2 border-t border-sky-500/20" />
        {/* ── end START HERE block ─────────────────────────── */}

        <Link
          to="/recognition"
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-[13px] transition-all duration-200 ${
            location.pathname === '/recognition'
              ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-400/60 shadow-[0_0_20px_rgba(234,179,8,0.30)]'
              : 'bg-yellow-500/8 text-yellow-100 border border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:border-yellow-400/60 hover:shadow-[0_0_20px_rgba(234,179,8,0.30)] hover:bg-yellow-500/15'
          }`}
        >
          <Award className="w-4 h-4 flex-shrink-0 text-yellow-400" />
          <span className="flex-1 truncate">Cohort Recognition</span>
        </Link>

        {tracks.map((track) => (
          <div key={track.id} className="pt-3">
            <button
              onClick={() => setOpenTracks((p) => ({ ...p, [track.id]: !p[track.id] }))}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg border ${trackBorder[track.color]} bg-zinc-800 hover:bg-zinc-700 transition-colors mb-1`}
            >
              <div className="flex-1 text-left min-w-0">
                <p className="text-[11px] font-semibold text-zinc-100 uppercase tracking-wider truncate">
                  {track.label}
                </p>
                <p className={`text-[10px] font-medium mt-0.5 ${trackText[track.color]}`}>
                  {track.sublabel}
                </p>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${trackBadge[track.color]}`}>
                {track.domains.length}
              </span>
              {openTracks[track.id]
                ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                : <ChevronRight className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />}
            </button>
            {openTracks[track.id] && (
              <div className="space-y-0.5">
                {track.domains.map((d) => <DomainRow key={d.slug} domain={d} />)}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
