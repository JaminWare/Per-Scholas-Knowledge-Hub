import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, ChevronDown, ChevronRight, ChevronLeft,
  Shield, Network, Cpu, Lock, Cloud, Wrench, Users,
  BookOpen, Lightbulb, FileText, Sparkles, Layout,
  Laptop, Monitor, Heart, Database,
} from 'lucide-react';

// ─── Navigation data ──────────────────────────────────────

interface NavLeaf {
  title: string;
  slug: string;
}

interface NavGroup {
  title: string;
  slug: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavLeaf[];
}

interface TrackSection {
  id: string;
  label: string;
  sublabel: string;
  color: 'sky' | 'teal' | 'cyan';
  domains: NavGroup[];
}

const topAccordions: NavGroup[] = [
  {
    title: 'Study Tips',
    slug: 'study-tips',
    icon: Lightbulb,
    children: [
      { title: 'CompTIA A+ Core 1 Overview', slug: 'study-tips/core1-overview' },
      { title: 'Domain 1.0 Mobile Devices', slug: 'core1-mobile' },
      { title: 'Domain 2.0 Networking', slug: 'core1-networking' },
      { title: 'Domain 3.0 Hardware', slug: 'core1-hardware' },
      { title: 'Domain 4.0 Virtualization & Cloud', slug: 'core1-cloud' },
      { title: 'Domain 5.0 HW & Network Troubleshooting', slug: 'core1-troubleshooting' },
      { title: 'CompTIA A+ Core 2 Overview', slug: 'study-tips/core2-overview' },
      { title: 'Domain 1.0 Operating Systems', slug: 'core2-os' },
      { title: 'Domain 2.0 Security', slug: 'core2-security' },
      { title: 'Domain 3.0 Software Troubleshooting', slug: 'core2-software' },
      { title: 'Domain 4.0 Operational Procedures', slug: 'core2-operations' },
      { title: 'Healthcare IT: EHR Architecture', slug: 'healthcare-ehr' },
      { title: 'Healthcare IT: HIPAA Data Security', slug: 'healthcare-hipaa' },
      { title: 'Healthcare IT: Clinical Workflows', slug: 'healthcare-clinical' },
    ],
  },
  {
    title: 'Diagrams',
    slug: 'diagrams',
    icon: Layout,
    children: [
      { title: 'Interactive Motherboard Blueprint', slug: 'diagrams/motherboard' },
      { title: 'Network Topology Mapping Tool', slug: 'diagrams/network-topology' },
      { title: 'EHR Architecture Data Flow', slug: 'diagrams/ehr-dataflow' },
    ],
  },
  {
    title: 'Quick References',
    slug: 'quick-references',
    icon: FileText,
    children: [
      { title: 'Ultimate Port Number Cheatsheet', slug: 'quick-references/ports' },
      { title: 'CompTIA Acronym Speed-Study Guide', slug: 'quick-references/acronyms' },
      { title: 'CLI Runbook', slug: 'quick-references/cli-runbook' },
    ],
  },
  {
    title: 'Prompt Playbook',
    slug: 'azari-prompt-playbook',
    icon: Sparkles,
    children: [
      { title: 'Core 1 PBQ Simulation Prompts', slug: 'azari-prompt-playbook/pbq-prompts' },
      { title: 'Medical Case Study Prompts', slug: 'azari-prompt-playbook/medical-prompts' },
      { title: 'EHR Troubleshooting Frameworks', slug: 'azari-prompt-playbook/ehr-prompts' },
      { title: 'AI Prompt Engineering for Healthcare', slug: 'article/ai-prompt-engineering-healthcare' },
    ],
  },
];

const tracks: TrackSection[] = [
  {
    id: 'core1',
    label: 'CompTIA A+ Core 1',
    sublabel: '220-1201',
    color: 'sky',
    domains: [
      { title: 'Domain 1.0 — Mobile Devices', slug: 'core1-mobile', icon: Laptop,
        children: [
          { title: 'MDM & Enrollment Profiles', slug: 'core1-mobile/mdm' },
          { title: 'Laptop Hardware & Displays', slug: 'core1-mobile/laptop-hardware' },
        ]},
      { title: 'Domain 2.0 — Networking', slug: 'core1-networking', icon: Network,
        children: [
          { title: 'OSI Model & TCP/IP', slug: 'core1-networking/osi-tcpip' },
          { title: 'Ports & Protocols', slug: 'core1-networking/ports-protocols' },
          { title: 'Wireless Standards', slug: 'core1-networking/wireless' },
          { title: 'The Role of Firewalls in Modern Network Security', slug: 'article/firewall-basics' },
        ]},
      { title: 'Domain 3.0 — Hardware', slug: 'core1-hardware', icon: Cpu,
        children: [
          { title: 'RAM, Storage & Form Factors', slug: 'core1-hardware/ram-storage' },
          { title: 'Power & Cooling', slug: 'core1-hardware/power-cooling' },
        ]},
      { title: 'Domain 4.0 — Virtualization & Cloud', slug: 'core1-cloud', icon: Cloud,
        children: [
          { title: 'Hypervisor Setups', slug: 'core1-cloud/virtualization' },
          { title: 'Cloud Infrastructure Models', slug: 'core1-cloud/concepts' },
        ]},
      { title: 'Domain 5.0 — HW & Network Troubleshooting', slug: 'core1-troubleshooting', icon: Wrench,
        children: [
          { title: 'Motherboard Troubleshooting & PBQs', slug: 'core1-troubleshooting/motherboard-pbq' },
          { title: 'Network Connectivity Issues', slug: 'core1-troubleshooting/network' },
          { title: 'Command-Line Interface (CLI) Research', slug: 'article/command-documentation' },
        ]},
    ],
  },
  {
    id: 'core2',
    label: 'CompTIA A+ Core 2',
    sublabel: '220-1202',
    color: 'teal',
    domains: [
      { title: 'Domain 1.0 — Operating Systems', slug: 'core2-os', icon: Monitor,
        children: [
          { title: 'Windows Installation & Upgrade Matrix', slug: 'core2-os/windows-bootcamp' },
          { title: 'macOS & Linux Essentials', slug: 'core2-os/macos-linux' },
          { title: 'Microsoft Management Console (MMC) Snap-ins', slug: 'article/snap-in' },
        ]},
      { title: 'Domain 2.0 — Security', slug: 'core2-security', icon: Shield,
        children: [
          { title: 'Malware Removal Procedures', slug: 'core2-security/malware' },
          { title: 'Social Engineering Defenses', slug: 'core2-security/threats' },
        ]},
      { title: 'Domain 3.0 — Software Troubleshooting', slug: 'core2-software', icon: Wrench,
        children: [
          { title: 'BSOD Log Analysis & SFC/DISM', slug: 'core2-software/bsod' },
        ]},
      { title: 'Domain 4.0 — Operational Procedures', slug: 'core2-operations', icon: Users,
        children: [
          { title: 'ESD Safety & Documentation', slug: 'core2-operations/documentation' },
          { title: 'Change Management', slug: 'core2-operations/change-management' },
        ]},
    ],
  },
  {
    id: 'healthcare',
    label: 'Advanced Healthcare IT',
    sublabel: 'Specialized Modules',
    color: 'cyan',
    domains: [
      { title: 'EHR Architecture', slug: 'healthcare-ehr', icon: Database,
        children: [
          { title: 'HL7 & FHIR Integration', slug: 'healthcare-ehr/integration' },
          { title: 'Epic/Cerner Blueprints', slug: 'healthcare-ehr/hl7-fhir' },
          { title: 'Cloud Computing in Healthcare', slug: 'article/cloud-computing-healthcare' },
        ]},
      { title: 'HIPAA Data Security', slug: 'healthcare-hipaa', icon: Lock,
        children: [
          { title: 'PHI Encryption & Access Control', slug: 'healthcare-hipaa/encryption' },
          { title: 'Audit Log Requirements', slug: 'healthcare-hipaa/security-rule' },
          { title: 'Introduction to Healthcare IT Security', slug: 'article/intro-healthcare-it-security' },
        ]},
      { title: 'Clinical Workflows', slug: 'healthcare-clinical', icon: Heart,
        children: [
          { title: 'CPOE Optimization', slug: 'healthcare-clinical/cpoe' },
          { title: 'Downtime Procedures', slug: 'healthcare-clinical/downtime' },
        ]},
    ],
  },
];

// ─── Color maps ───────────────────────────────────────────

const trackBorder = {
  sky:  'border-sky-500/30 dark:border-sky-500/30',
  teal: 'border-teal-500/30 dark:border-teal-500/30',
  cyan: 'border-cyan-500/30 dark:border-cyan-500/30',
};
const trackBadge = {
  sky:  'bg-sky-500/10 text-sky-500 dark:text-sky-400',
  teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
};
const trackText = {
  sky:  'text-sky-500 dark:text-sky-400',
  teal: 'text-teal-600 dark:text-teal-400',
  cyan: 'text-cyan-600 dark:text-cyan-400',
};

// ─── Leaf link ────────────────────────────────────────────

function Leaf({ title, slug }: { title: string; slug: string }) {
  const location = useLocation();
  const isActive = location.hash === `#/${slug}`;
  return (
    <Link
      to={`/${slug}`}
      className={`flex items-center gap-2 py-1.5 pl-4 pr-3 rounded-lg text-[12px] font-medium transition-all ${
        isActive
          ? 'text-sky-500 dark:text-sky-400 bg-sky-500/10'
          : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
      }`}
    >
      <span className="w-1 h-1 rounded-full bg-current flex-shrink-0 opacity-60" />
      <span className="truncate">{title}</span>
    </Link>
  );
}

// ─── Domain row (expandable) ──────────────────────────────

function DomainRow({ domain }: { domain: NavGroup }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const Icon = domain.icon;
  const isActive = location.hash === `#/${domain.slug}`;
  const isChildActive = domain.children?.some((c) => location.hash === `#/${c.slug}`);

  return (
    <div>
      <div className="flex items-center">
        <Link
          to={`/${domain.slug}`}
          className={`sidebar-item flex-1 ${isActive || isChildActive ? 'active' : ''}`}
          style={{ paddingLeft: '12px' }}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate text-[12px]">{domain.title}</span>
        </Link>
        {domain.children && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-1.5 text-zinc-500 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors flex-shrink-0"
          >
            {open || isChildActive ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        )}
      </div>
      {(open || isChildActive) && domain.children && (
        <div className="ml-4 pl-2 border-l border-zinc-300 dark:border-zinc-800 space-y-0.5 mt-0.5 mb-1">
          {domain.children.map((c) => (
            <Leaf key={c.slug} title={c.title} slug={c.slug} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Top accordion row ────────────────────────────────────

function TopAccordion({ group }: { group: NavGroup }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const Icon = group.icon;
  const isActive = location.hash === `#/${group.slug}`;
  const isChildActive = group.children?.some((c) => location.hash === `#/${c.slug}`);
  const expanded = open || !!isChildActive;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`sidebar-item w-full ${isActive || isChildActive ? 'active' : ''}`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left truncate text-[13px]">{group.title}</span>
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
          : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />}
      </button>
      {expanded && group.children && (
        <div className="ml-4 pl-2 border-l border-zinc-300 dark:border-zinc-800 space-y-0.5 mt-0.5 mb-1">
          {group.children.map((c) => (
            <Leaf key={c.slug} title={c.title} slug={c.slug} />
          ))}
        </div>
      )}
    </div>
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
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/20 flex-shrink-0">
            <BookOpen className="w-[18px] h-[18px] text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-zinc-100 dark:text-zinc-100 text-[13px] leading-tight truncate">
              Learners Knowledge Base
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500">2026-RTT-23</p>
          </div>
        </Link>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-500 hover:text-zinc-200 dark:hover:text-zinc-200 hover:bg-zinc-800 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
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

        {topAccordions.map((group) => (
          <TopAccordion key={group.slug} group={group} />
        ))}

        {tracks.map((track) => (
          <div key={track.id} className="pt-3">
            <button
              onClick={() => setOpenTracks((p) => ({ ...p, [track.id]: !p[track.id] }))}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg border ${trackBorder[track.color]} hover:bg-zinc-800/50 dark:hover:bg-zinc-800/50 hover:bg-zinc-200/50 transition-colors mb-1`}
            >
              <div className="flex-1 text-left min-w-0">
                <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider truncate">
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
