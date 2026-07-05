import {
  Lightbulb, BookOpen, Flame, Shield, Briefcase, Compass,
} from 'lucide-react';

export interface NestedFilter {
  label: string;
  keywords: string[];
}

export interface CategoryFilter {
  id: string;
  label: string;
  keywords: string[];
  nested: NestedFilter[];
}

export const CATEGORY_FILTERS: Record<string, CategoryFilter[]> = {
  onboarding: [
    { id: 'all-onboarding', label: 'All Onboarding', keywords: [], nested: [] },
    { id: 'canvas-workflows', label: 'Canvas Workflows', keywords: ['canvas', 'lms', 'assignment', 'calendar', 'module', 'syllabus', 'grades'], nested: [
      { label: 'All Canvas', keywords: [] },
      { label: 'Assignments & Grades', keywords: ['assignment', 'rubric', 'grade', 'submission'] },
      { label: 'Schedules & Sync', keywords: ['calendar', 'sync', 'schedule', 'dates'] },
      { label: 'Module Navigation', keywords: ['module', 'syllabus', 'lock'] },
    ]},
    { id: 'google-cert', label: 'Google Cert', keywords: ['google', 'coursera', 'cert', 'sync', 'qwiklabs'], nested: [
      { label: 'All Google Certs', keywords: [] },
      { label: 'Google IT', keywords: ['google it', 'it support', 'qwiklabs'] },
      { label: 'Google AI', keywords: ['google ai', 'ai cert', 'prompting'] },
    ]},
    { id: 'curriculum-pacing', label: 'Curriculum & Pacing', keywords: ['comptia', 'healthcare', 'pacing', 'schedule', 'master pbq'], nested: [
      { label: 'All Curriculum', keywords: [] },
      { label: 'CompTIA Mastery', keywords: ['comptia', 'core 1', 'core 2', 'exam'] },
      { label: 'Healthcare IT Balance', keywords: ['healthcare', 'ehr', 'hipaa', 'clinical'] },
      { label: 'Study & PBQ Tools', keywords: ['master pbq', 'study guide', 'notes'] },
    ]},
  ],
  labs: [
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
  ],
  slump: [
    { id: 'all-slump', label: 'All Slump Advice', keywords: [], nested: [] },
    { id: 'mental-endurance', label: 'Mental Endurance', keywords: ['imposter', 'confidence', 'doubt', 'overwhelm', 'compare', 'burnout', 'exhaustion', 'mental', 'stress', 'break'], nested: [
      { label: 'All Mental Endurance', keywords: [] },
      { label: 'Imposter Syndrome', keywords: ['imposter', 'confidence', 'doubt', 'overwhelm', 'compare'] },
      { label: 'Burnout Recovery', keywords: ['burnout', 'exhaustion', 'mental', 'stress', 'break'] },
    ]},
    { id: 'life-balance', label: 'Time Management', keywords: ['balance', 'family', 'work', 'life', 'distraction', 'behind', 'catch up', 'late', 'schedule', 'time'], nested: [
      { label: 'All Time Management', keywords: [] },
      { label: 'Juggling Responsibilities', keywords: ['balance', 'family', 'work', 'life', 'kids', 'distraction'] },
      { label: 'Catching Up', keywords: ['behind', 'catch up', 'late', 'schedule', 'time'] },
    ]},
    { id: 'motivation', label: 'Motivation & Focus', keywords: ['motivation', 'focus', 'discipline', 'routine', 'habit', 'milestone', 'win', 'progress', 'goal'], nested: [
      { label: 'All Motivation', keywords: [] },
      { label: 'Staying Focused', keywords: ['motivation', 'focus', 'discipline', 'routine', 'habit'] },
      { label: 'Celebrating Small Wins', keywords: ['milestone', 'win', 'progress', 'small step', 'goal'] },
    ]},
  ],
  cert: [
    { id: 'all-cert', label: 'All Cert Advice', keywords: [], nested: [] },
    { id: 'test-strategies', label: 'Test Day Strategies', keywords: ['anxiety', 'stress', 'time', 'flag', 'pearson', 'proctor', 'pace', 'home', 'center'], nested: [
      { label: 'All Test Strategies', keywords: [] },
      { label: 'Anxiety Management', keywords: ['anxiety', 'stress', 'panic', 'breathe', 'calm'] },
      { label: 'Time Management', keywords: ['time', 'flag', 'skip', 'pace', 'clock'] },
      { label: 'Testing Environment', keywords: ['pearson', 'center', 'home', 'proctor', 'camera'] },
    ]},
    { id: 'comptia-tactics', label: 'CompTIA Tactics', keywords: ['pbq', 'simulation', 'port', 'mnemonic', 'methodology', 'troubleshoot', '802.11', 'flashcard'], nested: [
      { label: 'All CompTIA Tactics', keywords: [] },
      { label: 'PBQ Strategies', keywords: ['pbq', 'performance', 'drag', 'drop', 'simulation'] },
      { label: 'Memorization Hacks', keywords: ['port', '802.11', 'flashcard', 'acronym', 'mnemonic'] },
      { label: 'Troubleshooting Steps', keywords: ['methodology', 'step', 'troubleshoot', 'isolate'] },
    ]},
    { id: 'study-benchmarks', label: 'Practice & Benchmarks', keywords: ['score', 'benchmark', 'practice', 'ready', 'dion', 'messer', 'cram', 'review', 'cheat sheet'], nested: [
      { label: 'All Practice & Benchmarks', keywords: [] },
      { label: 'Readiness Benchmarks', keywords: ['score', 'benchmark', 'practice', 'ready', 'dion', 'messer'] },
      { label: 'Last Minute Review', keywords: ['cram', 'day before', 'review', 'cheat sheet'] },
    ]},
  ],
  job: [
    { id: 'all-job', label: 'All Job Advice', keywords: [], nested: [] },
    { id: 'resume-portfolio', label: 'Resume & LinkedIn', keywords: ['resume', 'linkedin', 'cv', 'portfolio', 'bullet', 'ats', 'profile', 'cover letter'], nested: [
      { label: 'All Resume & LinkedIn', keywords: [] },
      { label: 'Resume Reality Checks', keywords: ['resume', 'cv', 'bullet', 'ats', 'cover letter'] },
      { label: 'LinkedIn Optimization', keywords: ['linkedin', 'profile', 'network', 'connection'] },
    ]},
    { id: 'interview-prep', label: 'Interview Preparation', keywords: ['interview', 'behavioral', 'technical', 'star', 'whiteboard', 'question', 'answer'], nested: [
      { label: 'All Interview Prep', keywords: [] },
      { label: 'Behavioral Questions', keywords: ['behavioral', 'star', 'scenario', 'soft skill', 'conflict'] },
      { label: 'Technical Interviews', keywords: ['technical', 'whiteboard', 'quiz', 'troubleshoot', 'scenario'] },
    ]},
    { id: 'field-transition', label: 'Field Transition', keywords: ['offer', 'negotiate', 'salary', 'helpdesk', 'hospital', 'clinical', 'onboarding', 'first day'], nested: [
      { label: 'All Field Transition', keywords: [] },
      { label: 'Offers & Negotiation', keywords: ['offer', 'negotiate', 'salary', 'benefits', 'accept'] },
      { label: 'Surviving the Helpdesk', keywords: ['helpdesk', 'ticket', 'hospital', 'clinical', 'first day', 'onboarding'] },
    ]},
  ],
};

export interface JourneyTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  trackSuffix?: string;
  emptyPrompt: string;
}

export const JOURNEY_TABS: JourneyTab[] = [
  { id: 'all', label: 'All', icon: Compass, emptyPrompt: 'Be the first to share a peer survival tip. Your cohort is waiting.' },
  { id: 'onboarding', label: 'Onboarding Hurdles', icon: Lightbulb, trackSuffix: 'Onboarding Hurdles', emptyPrompt: 'Did you survive the first week setup chaos? Click here to drop a tip for the next cohort.' },
  { id: 'labs', label: 'Tech Solutions', icon: BookOpen, trackSuffix: 'Tech Solutions', emptyPrompt: 'Have a fix for a common tech issue? Share your solution here to help the next learner.' },
  { id: 'slump', label: 'The Mid Program Slump', icon: Flame, trackSuffix: 'The Mid-Program Slump', emptyPrompt: 'Hit a wall mid way through and broken through it? Share your strategy here.' },
  { id: 'cert', label: 'Certification Prep', icon: Shield, trackSuffix: 'Certification Prep', emptyPrompt: 'Have a test day hack or anxiety management trick? The cohort needs it.' },
  { id: 'job', label: 'Job Hunt Triage', icon: Briefcase, trackSuffix: 'Job Hunt Triage', emptyPrompt: 'Landed an interview or fixed your resume? Drop your advice for the next wave.' },
];
