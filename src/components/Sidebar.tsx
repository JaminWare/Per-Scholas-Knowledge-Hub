import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Shield,
  Network,
  Cpu,
  Lock,
  Cloud,
  Wrench,
  Users,
  BookOpen,
  Lightbulb,
  FileText,
  Sparkles,
  X,
  Layout,
  Laptop,
  Monitor,
  Activity,
  Heart,
  Database,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface NavItem {
  title: string;
  slug: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

interface TrackGroup {
  title: string;
  subtitle: string;
  color: string;
  items: NavItem[];
}

const topNav: NavItem[] = [
  { title: 'Home', slug: '', icon: Home },
  { title: 'Study Tips', slug: 'study-tips', icon: Lightbulb },
  { title: 'Diagrams', slug: 'diagrams', icon: Layout },
  { title: 'Quick References', slug: 'quick-references', icon: FileText },
  { title: 'Prompt Playbook', slug: 'azari-prompt-playbook', icon: Sparkles },
];

const tracks: TrackGroup[] = [
  {
    title: 'CompTIA A+ Core 1',
    subtitle: '220-1201',
    color: 'emerald',
    items: [
      {
        title: 'Domain 1.0 — Mobile Devices',
        slug: 'core1-mobile',
        icon: Laptop,
        children: [
          { title: 'Laptop Hardware & Displays', slug: 'core1-mobile/laptop-hardware', icon: Laptop },
          { title: 'Mobile Device Connectivity', slug: 'core1-mobile/connectivity', icon: Laptop },
          { title: 'Mobile Device Mgmt (MDM)', slug: 'core1-mobile/mdm', icon: Laptop },
        ],
      },
      {
        title: 'Domain 2.0 — Networking',
        slug: 'core1-networking',
        icon: Network,
        children: [
          { title: 'OSI Model & TCP/IP', slug: 'core1-networking/osi-tcpip', icon: Network },
          { title: 'Ports & Protocols', slug: 'core1-networking/ports-protocols', icon: Network },
          { title: 'Network Hardware', slug: 'core1-networking/hardware', icon: Network },
          { title: 'Wireless Standards', slug: 'core1-networking/wireless', icon: Network },
        ],
      },
      {
        title: 'Domain 3.0 — Hardware',
        slug: 'core1-hardware',
        icon: Cpu,
        children: [
          { title: 'Motherboards & CPUs', slug: 'core1-hardware/motherboard-cpu', icon: Cpu },
          { title: 'RAM & Storage', slug: 'core1-hardware/ram-storage', icon: Cpu },
          { title: 'Power & Cooling', slug: 'core1-hardware/power-cooling', icon: Cpu },
          { title: 'Printers & Peripherals', slug: 'core1-hardware/printers', icon: Cpu },
        ],
      },
      {
        title: 'Domain 4.0 — Virtualization & Cloud',
        slug: 'core1-cloud',
        icon: Cloud,
        children: [
          { title: 'Cloud Computing Concepts', slug: 'core1-cloud/concepts', icon: Cloud },
          { title: 'Virtualization Basics', slug: 'core1-cloud/virtualization', icon: Cloud },
        ],
      },
      {
        title: 'Domain 5.0 — HW & Network Troubleshooting',
        slug: 'core1-troubleshooting',
        icon: Wrench,
        children: [
          { title: 'Motherboard Troubleshooting & PBQs', slug: 'core1-troubleshooting/motherboard-pbq', icon: Wrench },
          { title: 'Network Connectivity Issues', slug: 'core1-troubleshooting/network', icon: Wrench },
          { title: 'Storage & RAID Failures', slug: 'core1-troubleshooting/storage', icon: Wrench },
        ],
      },
    ],
  },
  {
    title: 'CompTIA A+ Core 2',
    subtitle: '220-1202',
    color: 'teal',
    items: [
      {
        title: 'Domain 1.0 — Operating Systems',
        slug: 'core2-os',
        icon: Monitor,
        children: [
          { title: 'Windows Installation & Boot Camp', slug: 'core2-os/windows-bootcamp', icon: Monitor },
          { title: 'Windows Administration', slug: 'core2-os/windows-admin', icon: Monitor },
          { title: 'macOS & Linux Essentials', slug: 'core2-os/macos-linux', icon: Monitor },
          { title: 'OS Troubleshooting', slug: 'core2-os/troubleshooting', icon: Monitor },
        ],
      },
      {
        title: 'Domain 2.0 — Security',
        slug: 'core2-security',
        icon: Shield,
        children: [
          { title: 'Threats & Social Engineering', slug: 'core2-security/threats', icon: Shield },
          { title: 'Malware Removal Procedures', slug: 'core2-security/malware', icon: Shield },
          { title: 'Windows Security Controls', slug: 'core2-security/controls', icon: Shield },
          { title: 'Data Destruction & Disposal', slug: 'core2-security/disposal', icon: Shield },
        ],
      },
      {
        title: 'Domain 3.0 — Software Troubleshooting',
        slug: 'core2-software',
        icon: Wrench,
        children: [
          { title: 'Application Issues', slug: 'core2-software/applications', icon: Wrench },
          { title: 'Security Incident Response', slug: 'core2-software/incident-response', icon: Wrench },
        ],
      },
      {
        title: 'Domain 4.0 — Operational Procedures',
        slug: 'core2-operations',
        icon: Users,
        children: [
          { title: 'Documentation & Ticketing', slug: 'core2-operations/documentation', icon: Users },
          { title: 'Change Management', slug: 'core2-operations/change-management', icon: Users },
          { title: 'Scripting & Automation', slug: 'core2-operations/scripting', icon: Users },
        ],
      },
    ],
  },
  {
    title: 'Advanced Healthcare IT',
    subtitle: 'Specialized Modules',
    color: 'cyan',
    items: [
      {
        title: 'EHR Architecture',
        slug: 'healthcare-ehr',
        icon: Database,
        children: [
          { title: 'EHR Integration Blueprints', slug: 'healthcare-ehr/integration', icon: Database },
          { title: 'HL7 & FHIR Standards', slug: 'healthcare-ehr/hl7-fhir', icon: Database },
          { title: 'Clinical Workflows', slug: 'healthcare-ehr/workflows', icon: Database },
        ],
      },
      {
        title: 'HIPAA Data Security',
        slug: 'healthcare-hipaa',
        icon: Lock,
        children: [
          { title: 'HIPAA Security Rule', slug: 'healthcare-hipaa/security-rule', icon: Lock },
          { title: 'Data Encryption & PHI', slug: 'healthcare-hipaa/encryption', icon: Lock },
          { title: 'Incident Response', slug: 'healthcare-hipaa/incident-response', icon: Lock },
        ],
      },
      {
        title: 'Clinical IT Operations',
        slug: 'healthcare-clinical',
        icon: Heart,
        children: [
          { title: 'Lab Device Troubleshooting', slug: 'healthcare-clinical/lab-devices', icon: Heart },
          { title: 'Telemedicine Infrastructure', slug: 'healthcare-clinical/telemedicine', icon: Heart },
          { title: 'Downtime Procedures', slug: 'healthcare-clinical/downtime', icon: Heart },
        ],
      },
    ],
  },
];

const trackBorderColors: Record<string, string> = {
  emerald: 'border-emerald-500/30 dark:border-emerald-500/20',
  teal: 'border-teal-500/30 dark:border-teal-500/20',
  cyan: 'border-cyan-500/30 dark:border-cyan-500/20',
};

const trackBadgeColors: Record<string, string> = {
  emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
  cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
};

interface NavItemProps {
  item: NavItem;
  depth?: number;
  onNavigate?: () => void;
}

function NavItemRow({ item, depth = 0, onNavigate }: NavItemProps) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const hasChildren = !!item.children?.length;
  const Icon = item.icon;

  const isActive =
    location.hash === `#/${item.slug}` ||
    (item.slug === '' && (location.hash === '' || location.hash === '#/' || location.hash === '#'));

  const isActiveChild = item.children?.some(
    (c) => location.hash === `#/${c.slug}`
  );

  const open = expanded || !!isActiveChild;

  return (
    <div>
      <Link
        to={`/${item.slug}`}
        className={`sidebar-item ${isActive || isActiveChild ? 'active' : ''}`}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
        onClick={(e) => {
          if (hasChildren) {
            e.preventDefault();
            setExpanded((v) => !v);
          } else {
            onNavigate?.();
          }
        }}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 truncate text-[13px]">{item.title}</span>
        {hasChildren && (
          <span className="ml-auto transition-transform duration-200">
            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        )}
      </Link>
      {open && hasChildren && (
        <div className="mt-0.5 space-y-0.5 border-l border-slate-200 dark:border-slate-700 ml-5">
          {item.children!.map((child) => (
            <NavItemRow key={child.slug} item={child} depth={depth + 1} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleDesktop: () => void;
}

export default function Sidebar({ isOpen, onClose, onToggleDesktop }: SidebarProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [openTracks, setOpenTracks] = useState<Record<string, boolean>>({
    'CompTIA A+ Core 1': true,
    'CompTIA A+ Core 2': false,
    'Advanced Healthcare IT': false,
  });

  const toggleTrack = (title: string) =>
    setOpenTracks((prev) => ({ ...prev, [title]: !prev[title] }));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <BookOpen className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white text-[13px] leading-tight">
                Learners Knowledge Base
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">2026-RTT-23</p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            {/* Desktop collapse toggle */}
            <button
              onClick={onToggleDesktop}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Mobile close */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {/* Top-level links */}
          {topNav.map((item) => {
            const isActive =
              location.hash === `#/${item.slug}` ||
              (item.slug === '' && (location.hash === '' || location.hash === '#/' || location.hash === '#'));
            return (
              <NavItemRow key={item.slug} item={item} onNavigate={onClose} />
            );
          })}

          {/* Track groups */}
          {tracks.map((track) => (
            <div key={track.title} className="pt-3">
              {/* Track header */}
              <button
                onClick={() => toggleTrack(track.title)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg border ${trackBorderColors[track.color]} hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors mb-1`}
              >
                <div className="flex-1 text-left">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider leading-tight">
                    {track.title}
                  </p>
                  <p className={`text-[10px] font-medium mt-0.5 ${trackBadgeColors[track.color].split(' ').slice(2).join(' ')}`}>
                    {track.subtitle}
                  </p>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${trackBadgeColors[track.color]}`}>
                  {track.items.length}
                </span>
                {openTracks[track.title] ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                )}
              </button>

              {openTracks[track.title] && (
                <div className="space-y-0.5">
                  {track.items.map((item) => (
                    <NavItemRow key={item.slug} item={item} onNavigate={onClose} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-sm font-medium">Light Mode</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span className="text-sm font-medium">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
