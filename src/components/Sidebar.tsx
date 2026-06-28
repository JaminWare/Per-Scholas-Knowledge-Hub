import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, ChevronDown, ChevronRight, ChevronLeft,
  Shield, Network, Cpu, Lock, Cloud, Wrench, Users,
  BookOpen, Lightbulb, FileText, Sparkles, Layout,
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

// Flat top-level links — no children, no dropdowns
const topLinks: NavItem[] = [
  { title: 'Cohort Recognition', slug: 'recognition',           icon: Award      },
  { title: 'Study Tips',      slug: 'study-tips',            icon: Lightbulb  },
  { title: 'Diagrams',        slug: 'diagrams',              icon: Layout     },
  { title: 'Quick References',slug: 'quick-references',      icon: FileText   },
  { title: 'Prompt Playbook', slug: 'azari-prompt-playbook', icon: Sparkles   },
];

const tracks: TrackSection[] = [
  {
    id: 'core1',
    label: 'CompTIA A+ Core 1',
    sublabel: '220-1201',
    color: 'sky',
    domains: [
      { title: 'Domain 1.0 — Mobile Devices',              slug: 'core1-mobile',         icon: Laptop   },
      { title: 'Domain 2.0 — Networking',                  slug: 'core1-networking',     icon: Network  },
      { title: 'Domain 3.0 — Hardware',                    slug: 'core1-hardware',       icon: Cpu      },
      { title: 'Domain 4.0 — Cloud',           slug: 'core1-virtualization', icon: Cloud    },
      { title: 'Domain 5.0 — Troubleshooting', slug: 'core1-troubleshooting',icon: Wrench   },
    ],
  },
  {
    id: 'core2',
    label: 'CompTIA A+ Core 2',
    sublabel: '220-1202',
    color: 'teal',
    domains: [
      { title: 'Domain 1.0 — OS',               slug: 'core2-os',         icon: Monitor },
      { title: 'Domain 2.0 — Security',          slug: 'core2-security',   icon: Shield  },
      { title: 'Domain 3.0 — Troubleshooting',    slug: 'core2-software',   icon: Wrench  },
      { title: 'Domain 4.0 — SOP',               slug: 'core2-operations', icon: Users   },
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
  teal: 'border-teal-500/30',
  cyan: 'border-cyan-500/30',
};
const trackBadge = {
  sky:  'bg-sky-500/10 text-sky-400',
  teal: 'bg-teal-500/10 text-teal-400',
  cyan: 'bg-cyan-500/10 text-cyan-400',
};
const trackText = {
  sky:  'text-sky-400',
  teal: 'text-teal-400',
  cyan: 'text-cyan-400',
};

// ─── Flat nav link ────────────────────────────────────────

function NavLink({ item }: { item: NavItem }) {
  const location = useLocation();
  const Icon = item.icon;
  const isActive = location.hash === `#/${item.slug}`;

  return (
    <Link
      to={`/${item.slug}`}
      className={`sidebar-item ${isActive ? 'active' : ''}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 truncate text-[13px]">{item.title}</span>
    </Link>
  );
}

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
  const [openTracks, setOpenTracks] = useState<Record<string, boolean>>({
    core1: true, core2: false, healthcare: false,
  });

  return (
    <div className="flex flex-col h-full bg-zinc-800 border-r border-zinc-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/20 flex-shrink-0">
            <BookOpen className="w-[18px] h-[18px] text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-zinc-100 text-[13px] leading-tight truncate">
              Learners Knowledge Base
            </p>
            <p className="text-[11px] text-zinc-400">2026-RTT-23</p>
          </div>
        </Link>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors flex-shrink-0"
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <Link
          to="/"
          className={`sidebar-item ${location.hash === '' || location.hash === '#/' ? 'active' : ''}`}
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          <span className="truncate text-[13px]">Home</span>
        </Link>

        {topLinks.map((item) => (
          <NavLink key={item.slug} item={item} />
        ))}

        {tracks.map((track) => (
          <div key={track.id} className="pt-3">
            <button
              onClick={() => setOpenTracks((p) => ({ ...p, [track.id]: !p[track.id] }))}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg border ${trackBorder[track.color]} bg-zinc-700/60 hover:bg-zinc-700 transition-colors mb-1`}
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
