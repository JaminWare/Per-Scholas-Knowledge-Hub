import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, ChevronDown, ChevronRight,
  Shield, Network, Cpu, Lock, Cloud, Wrench, Users,
  LifeBuoy, Headphones,
  Laptop, Monitor, Heart, Database, Award, LogIn, LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './AuthModal';

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

const trackBadge = {
  sky:  'bg-zinc-800 text-zinc-300',
  teal: 'bg-zinc-800 text-zinc-300',
  cyan: 'bg-zinc-800 text-zinc-300',
};
const trackText = {
  sky:  'text-zinc-400',
  teal: 'text-zinc-400',
  cyan: 'text-zinc-400',
};

// ─── Domain row (flat direct link, no children) ───────────

function DomainRow({ domain, collapsed }: { domain: NavItem; collapsed?: boolean }) {
  const location = useLocation();
  const Icon = domain.icon;
  const isActive = location.pathname === `/${domain.slug}` || location.pathname.startsWith(`/${domain.slug}/`);

  if (collapsed) {
    return (
      <Link
        to={`/${domain.slug}`}
        title={domain.title}
        className={`flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-colors ${
          isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
        }`}
      >
        <Icon className="w-4 h-4" />
      </Link>
    );
  }

  return (
    <Link
      to={`/${domain.slug}`}
      className={`sidebar-item ${isActive ? 'active' : ''}`}
      style={{ paddingLeft: '12px' }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 truncate text-[13px] font-medium text-zinc-200">{domain.title}</span>
      <ChevronRight className="w-3 h-3 text-zinc-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

// ─── Main Sidebar component ───────────────────────────────

interface SidebarProps {
  onToggle?: () => void;
  isCollapsed?: boolean;
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
  const location = useLocation();
  const [openTracks, setOpenTracks] = useState<Record<string, boolean>>({
    core1: false, core2: false, healthcare: false,
  });
  const [authOpen, setAuthOpen] = useState(false);
  const { user, signOut } = useAuth();

  const lxActive = location.pathname === '/learner-experience';
  const deskolasActive = location.pathname === '/deskolas';

  if (isCollapsed) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-zinc-950/40 rounded-2xl outline-none items-center pt-8 pb-3 gap-1">
        {user ? (
          <button
            onClick={signOut}
            title="Sign Out"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setAuthOpen(true)}
            title="Sign In"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 transition-colors"
          >
            <LogIn className="w-4 h-4" />
          </button>
        )}

        <div className="w-8 h-px bg-zinc-800 my-1" />

        <Link to="/" title="Home" className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${location.pathname === '/' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
          <Home className="w-4 h-4" />
        </Link>
        <Link to="/learner-experience" title="Learner Experience & FAQs" className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${lxActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
          <LifeBuoy className="w-4 h-4" />
        </Link>
        <Link to="/deskolas" title="Deskolas Tech Solutions" className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${deskolasActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
          <Headphones className="w-4 h-4" />
        </Link>
        <Link to="/recognition" title="Cohort Recognition" className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${location.pathname === '/recognition' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
          <Award className="w-4 h-4" />
        </Link>

        <div className="w-8 h-px bg-zinc-800 my-1" />

        {tracks.map((track) => {
          const TrackIcon = track.domains[0]?.icon;
          return (
            <div key={track.id} className="flex flex-col items-center gap-1">
              <button
                onClick={() => setOpenTracks((p) => ({ ...p, [track.id]: !p[track.id] }))}
                title={track.label}
                className="flex items-center justify-center w-10 h-10 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                {TrackIcon && <TrackIcon className="w-4 h-4" />}
              </button>
              {openTracks[track.id] && track.domains.map((d) => (
                <DomainRow key={d.slug} domain={d} collapsed />
              ))}
            </div>
          );
        })}

        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-zinc-950/40 rounded-2xl outline-none">
      {/* Auth Section */}
      <div className="px-3 pt-8 pb-2 flex-shrink-0 space-y-1">
        {user ? (
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-200 ease-spatial active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-zinc-600 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Sign Out</span>
          </button>
        ) : (
          <button
            onClick={() => setAuthOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 border border-blue-600/20 transition-all duration-200 ease-spatial active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-zinc-600 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          >
            <LogIn className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Sign In</span>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="py-3 px-2 pb-6 space-y-0.5 outline-none">
        <Link
          to="/"
          className={`sidebar-item ${location.pathname === '/' ? 'active' : ''}`}
        >
          <Home className="w-4 h-4 flex-shrink-0 text-white" />
          <span className="truncate text-[13px] text-white">Home</span>
        </Link>

        {/* ── START HERE block ─────────────────────────────── */}
        <div className="my-3" />
        <p className="inline-block rounded-full bg-zinc-800/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Start Here
        </p>
        <Link
          to="/learner-experience"
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-[13px] outline-none select-none ${
            lxActive
              ? 'bg-zinc-800 text-white border border-zinc-700'
              : 'bg-zinc-900 text-zinc-300 border border-zinc-800/50 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <LifeBuoy className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate">Learner Experience & FAQs</span>
        </Link>
        <Link
          to="/deskolas"
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-[13px] outline-none select-none ${
            deskolasActive
              ? 'bg-zinc-800 text-white border border-zinc-700'
              : 'bg-zinc-900 text-zinc-300 border border-zinc-800/50 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Headphones className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate">Deskolas Tech Solutions</span>
        </Link>
        <div className="my-3" />
        {/* ── end START HERE block ─────────────────────────── */}

        <Link
          to="/recognition"
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-[13px] transition-all duration-200 ease-spatial outline-none select-none active:scale-[0.98] ${
            location.pathname === '/recognition'
              ? 'bg-zinc-800 text-white border border-zinc-700'
              : 'bg-zinc-900 text-zinc-300 border border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white active:bg-zinc-800'
          }`}
        >
          <Award className="w-4 h-4 flex-shrink-0 text-zinc-400" />
          <span className="flex-1 truncate">Cohort Recognition</span>
        </Link>

        {tracks.map((track) => (
          <div key={track.id} className="pt-3">
            <button
              onClick={() => setOpenTracks((p) => ({ ...p, [track.id]: !p[track.id] }))}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg border border-zinc-800/50 bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-900 active:scale-[0.98] transition-all duration-200 ease-spatial mb-1 outline-none select-none focus-visible:ring-2 focus-visible:ring-zinc-600 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900`}
            >
              <div className="flex-1 text-left min-w-0">
                <p className="text-[11px] font-semibold text-white uppercase tracking-wider truncate">
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

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
