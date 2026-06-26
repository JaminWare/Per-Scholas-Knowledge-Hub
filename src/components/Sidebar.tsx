import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  ChevronDown,
  ChevronRight,
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
  BookOpen,
  Lightbulb,
  FileText,
  Sparkles,
  Menu,
  X,
  Layout,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface NavItem {
  title: string;
  slug: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { title: 'Home', slug: '', icon: Home },
  { title: 'Study Tips', slug: 'study-tips', icon: Lightbulb },
  { title: 'Diagrams', slug: 'diagrams', icon: Layout },
  { title: 'Quick References', slug: 'quick-references', icon: FileText },
  { title: 'Azari Prompt Playbook', slug: 'azari-prompt-playbook', icon: Sparkles },
];

const comptiaDomains: NavItem[] = [
  {
    title: '01 - Security',
    slug: '01-security',
    icon: Shield,
    children: [
      { title: 'Threats & Vulnerabilities', slug: '01-security/threats', icon: Shield },
      { title: 'Security Architecture', slug: '01-security/architecture', icon: Shield },
      { title: 'Cryptography', slug: '01-security/cryptography', icon: Shield },
    ],
  },
  {
    title: '02 - Networking',
    slug: '02-networking',
    icon: Network,
    children: [
      { title: 'OSI Model', slug: '02-networking/osi-model', icon: Network },
      { title: 'TCP/IP', slug: '02-networking/tcp-ip', icon: Network },
      { title: 'Network Devices', slug: '02-networking/devices', icon: Network },
    ],
  },
  {
    title: '03 - Hardware',
    slug: '03-hardware',
    icon: Cpu,
    children: [
      { title: 'Components', slug: '03-hardware/components', icon: Cpu },
      { title: 'Peripherals', slug: '03-hardware/peripherals', icon: Cpu },
    ],
  },
  {
    title: '04 - Identity & Access',
    slug: '04-identity-access',
    icon: Lock,
    children: [
      { title: 'Authentication', slug: '04-identity-access/authentication', icon: Lock },
      { title: 'Authorization', slug: '04-identity-access/authorization', icon: Lock },
    ],
  },
  {
    title: '05 - Cloud Computing',
    slug: '05-cloud',
    icon: Cloud,
    children: [
      { title: 'Cloud Models', slug: '05-cloud/models', icon: Cloud },
      { title: 'Virtualization', slug: '05-cloud/virtualization', icon: Cloud },
    ],
  },
  {
    title: '06 - Servers',
    slug: '06-servers',
    icon: Server,
    children: [
      { title: 'Server Types', slug: '06-servers/types', icon: Server },
      { title: 'Server Management', slug: '06-servers/management', icon: Server },
    ],
  },
  {
    title: '07 - Mobile Devices',
    slug: '07-mobile',
    icon: Laptop,
    children: [
      { title: 'Mobile Management', slug: '07-mobile/management', icon: Laptop },
      { title: 'Mobile Security', slug: '07-mobile/security', icon: Laptop },
    ],
  },
  {
    title: '08 - Troubleshooting',
    slug: '08-troubleshooting',
    icon: Wrench,
    children: [
      { title: 'Methodology', slug: '08-troubleshooting/methodology', icon: Wrench },
      { title: 'Tools', slug: '08-troubleshooting/tools', icon: Wrench },
    ],
  },
  {
    title: '09 - Operational Procedures',
    slug: '09-operations',
    icon: Users,
    children: [
      { title: 'Documentation', slug: '09-operations/documentation', icon: Users },
      { title: 'Change Management', slug: '09-operations/change-management', icon: Users },
    ],
  },
  {
    title: '10 - Risk Management',
    slug: '10-risk',
    icon: AlertTriangle,
    children: [
      { title: 'Risk Assessment', slug: '10-risk/assessment', icon: AlertTriangle },
      { title: 'Disaster Recovery', slug: '10-risk/disaster-recovery', icon: AlertTriangle },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function NavItem({
  item,
  isActive,
  onClick,
  depth = 0,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  const isActiveChild = item.children?.some((child) => location.pathname === `/${child.slug}`);

  return (
    <div>
      <Link
        to={`/${item.slug}`}
        className={`sidebar-item ${isActive || isActiveChild ? 'active' : ''}`}
        style={{ paddingLeft: `${12 + depth * 12}px` }}
        onClick={() => {
          if (hasChildren) {
            setExpanded(!expanded);
          } else if (onClick) {
            onClick();
          }
        }}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 truncate">{item.title}</span>
        {hasChildren && (
          <span className="ml-auto">
            {expanded || isActiveChild ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
      </Link>
      {(expanded || isActiveChild) && hasChildren && (
        <div className="mt-0.5 space-y-0.5">
          {item.children!.map((child) => (
            <NavItem
              key={child.slug}
              item={child}
              isActive={location.pathname === `/${child.slug}`}
              onClick={onClick}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 dark:text-white text-sm">AZARI</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Knowledge Base</p>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {/* Main sections */}
            {navigation.map((item) => (
              <NavItem
                key={item.slug}
                item={item}
                isActive={location.pathname === `/${item.slug}` || (item.slug === '' && location.pathname === '/')}
                onClick={onClose}
              />
            ))}

            {/* CompTIA Domains */}
            <div className="pt-4 pb-2">
              <div className="px-3 py-2">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  CompTIA Domains
                </span>
              </div>
              {comptiaDomains.map((item) => (
                <NavItem
                  key={item.slug}
                  item={item}
                  isActive={location.pathname === `/${item.slug}`}
                  onClick={onClose}
                />
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
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
        </div>
      </aside>
    </>
  );
}
