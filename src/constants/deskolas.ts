import type { CategoryFilter } from './learnerExperience';

export const DESKOLAS_CATEGORIES: CategoryFilter[] = [
  { id: 'all-labs', label: 'All Tech Solutions', keywords: [], nested: [] },
  { id: 'hardware-av', label: 'Hardware & AV Setup', keywords: ['hardware', 'av', 'audio', 'video', 'monitor', 'webcam', 'mic', 'headset', 'display', 'usb', 'peripheral', 'cable'], nested: [
    { label: 'All Hardware & AV', keywords: [] },
    { label: 'Display & Video', keywords: ['monitor', 'display', 'hdmi', 'webcam', 'video', 'screen'] },
    { label: 'Audio & Peripherals', keywords: ['mic', 'headset', 'audio', 'speaker', 'usb', 'keyboard', 'mouse'] },
  ]},
  { id: 'network-access', label: 'Network & Access', keywords: ['network', 'wifi', 'vpn', 'internet', 'connection', 'proxy', 'firewall', 'dns', 'ip'], nested: [
    { label: 'All Network', keywords: [] },
    { label: 'WiFi & Connectivity', keywords: ['wifi', 'internet', 'connection', 'disconnect', 'slow'] },
    { label: 'VPN & Proxy', keywords: ['vpn', 'proxy', 'firewall', 'blocked', 'access'] },
  ]},
  { id: 'software-ides', label: 'Software & IDEs', keywords: ['software', 'ide', 'vscode', 'install', 'update', 'crash', 'extension', 'plugin', 'virtualbox', 'vm'], nested: [
    { label: 'All Software', keywords: [] },
    { label: 'VS Code & Extensions', keywords: ['vscode', 'extension', 'plugin', 'editor', 'terminal'] },
    { label: 'VMs & Environments', keywords: ['virtualbox', 'vm', 'docker', 'environment', 'install'] },
  ]},
  { id: 'git-github', label: 'Git & GitHub', keywords: ['git', 'github', 'push', 'pull', 'merge', 'branch', 'commit', 'clone', 'repository', 'conflict'], nested: [
    { label: 'All Git', keywords: [] },
    { label: 'Push & Pull Issues', keywords: ['push', 'pull', 'remote', 'origin', 'reject', 'fetch'] },
    { label: 'Merge & Conflicts', keywords: ['merge', 'conflict', 'branch', 'rebase', 'reset'] },
  ]},
  { id: 'accounts-lms', label: 'Accounts & LMS', keywords: ['account', 'login', 'password', 'canvas', 'lms', 'coursera', 'email', 'access', 'locked', 'reset'], nested: [
    { label: 'All Accounts', keywords: [] },
    { label: 'Login & Password', keywords: ['login', 'password', 'locked', 'reset', 'mfa', '2fa'] },
    { label: 'Canvas & Coursera', keywords: ['canvas', 'coursera', 'lms', 'enrollment', 'module'] },
  ]},
  { id: 'general-troubleshooting', label: 'General Troubleshooting', keywords: ['troubleshoot', 'error', 'issue', 'problem', 'help', 'fix', 'broken', 'other'], nested: [] },
];

export const DESKOLAS_APP_URL = 'https://deskolas.vercel.app';
