export interface AutoCategoryResult {
  masterCategory: string;
  track: string;
  compObjective?: string;
  lxStage?: string;
  submissionType?: 'Diagram' | 'Prompt Playbook';
}

interface Rule {
  keywords: string[];
  lessonNumbers?: string[];
  masterCategory: string;
  track: string;
  compObjective?: string;
  lxStage?: string;
}

const MINIMUM_CONFIDENCE_SCORE = 2;

const SEPARATORS = new Set([
  ' ', '\t', '\n', '\r', ',', ';', ':', '!', '?', '(', ')', '[', ']',
  '{', '}', '"', "'", '/', '\\', '|', '<', '>', '~', '`',
]);

function isSeparatorAt(text: string, index: number): boolean {
  if (index < 0 || index >= text.length) return true;
  return SEPARATORS.has(text[index]);
}

function findBoundedMatch(text: string, keyword: string, consumedRanges: [number, number][]): number {
  let searchFrom = 0;
  while (searchFrom <= text.length - keyword.length) {
    const idx = text.indexOf(keyword, searchFrom);
    if (idx === -1) return -1;

    const beforeOk = isSeparatorAt(text, idx - 1);
    const afterOk = isSeparatorAt(text, idx + keyword.length);

    if (beforeOk && afterOk) {
      const alreadyConsumed = consumedRanges.some(
        ([start, end]) => idx >= start && idx + keyword.length <= end,
      );
      if (!alreadyConsumed) return idx;
    }
    searchFrom = idx + 1;
  }
  return -1;
}

const LX_TRACK = 'Learner Experience & FAQs';

const RULES: Rule[] = [
  // ── Learner Experience & FAQs ──────────────────────────────
  {
    keywords: [
      'imposter syndrome', 'mental health', 'time management', 'give up',
      'hard time', 'falling behind', 'cant focus', 'no motivation',
      'feeling stuck', 'want to quit',
      'imposter', 'burnout', 'slump', 'motivation', 'stress', 'overwhelm',
      'exhaust', 'doubt', 'confidence', 'discipline', 'distract', 'drown',
      'struggle', 'tired', 'anxiety', 'behind',
    ],
    masterCategory: LX_TRACK,
    track: LX_TRACK,
    compObjective: 'The Mid-Program Slump',
    lxStage: 'slump',
  },
  {
    keywords: [
      'password reset', 'account setup', 'first week', 'getting started',
      'canvas', 'lms', 'onboarding', 'enrollment', 'orientation', 'login',
      'setup', 'access',
    ],
    masterCategory: LX_TRACK,
    track: LX_TRACK,
    compObjective: 'Onboarding Hurdles',
    lxStage: 'onboarding',
  },
  {
    keywords: [
      'job hunt', 'test day', 'cert prep', 'cover letter', 'exam prep',
      'test strategy', 'practice exam', 'passing score', 'test anxiety',
      'study plan', 'comptia prep',
      'resume', 'interview', 'exam', 'linkedin', 'salary', 'helpdesk',
      'certification', 'career', 'job',
    ],
    masterCategory: LX_TRACK,
    track: LX_TRACK,
    compObjective: 'Job Hunt Triage',
    lxStage: 'job',
  },
  {
    keywords: [
      'software install', 'wifi issue', 'hardware setup', 'not working',
      'wont load', 'wont start',
      'git', 'github', 'vscode', 'virtualbox', 'ide', 'vpn', 'monitor',
      'webcam', 'headset', 'peripheral', 'broken', 'error', 'crash',
      'bug', 'glitch', 'stuck', 'freeze',
    ],
    masterCategory: LX_TRACK,
    track: LX_TRACK,
    compObjective: 'Tech Solutions',
    lxStage: 'labs',
  },
  // ── CompTIA A+ Core 1 ─────────────────────────────────────
  {
    keywords: [
      'ip address', 'networking', 'firewall', 'subnet', 'tcp', 'port',
      'router', 'switch', 'dns', 'dhcp', 'osi', 'gateway', 'nat', 'vlan',
      'ethernet', 'wifi', 'wireless', 'protocol', 'packet', 'soho',
      '802.11ac', '802.11n', '802.11ax', '802.11',
    ],
    lessonNumbers: ['133'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 2.0 (Networking)',
    compObjective: '2.7 Network Configs',
  },
  {
    keywords: [
      'power supply', 'cpu socket', 'motherboard', 'ram', 'cpu', 'bios',
      'cmos', 'heatsink', 'chipset', 'pcie', 'dimm', 'atx', 'psu',
      'sata', 'nvme', 'ssd', 'hdd', 'socket', 'm.2', 'storage',
    ],
    lessonNumbers: ['132'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
    compObjective: '3.4 Motherboards & CPUs',
  },
  {
    keywords: [
      'mobile display', 'mobile device', 'docking station', 'touchscreen',
      'laptop', 'tablet', 'digitizer', 'lcd', 'oled', 'battery',
    ],
    lessonNumbers: ['130'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)',
  },
  {
    keywords: [
      'virtual machine', 'cloud', 'virtualization', 'hypervisor', 'iaas',
      'paas', 'saas', 'vmware', 'hyper-v', 'container', 'docker', 'vm',
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 4.0 (Cloud)',
    compObjective: '4.1 Cloud Computing Concepts',
  },
  {
    keywords: [
      'blue screen', 'boot failure', 'beep code', 'no post',
      'troubleshoot', 'bsod', 'overheat',
    ],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
    compObjective: '5.2 Motherboard/RAM/CPU Issues',
  },
  // ── CompTIA A+ Core 2 ─────────────────────────────────────
  {
    keywords: [
      'command line', 'task manager', 'disk management',
      'windows', 'cli', 'powershell', 'linux', 'macos', 'terminal',
      'registry', 'cmd', 'bash',
    ],
    lessonNumbers: ['134', '135'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.2 Command-Line Tools',
  },
  {
    keywords: [
      'social engineering', 'firewall rule', 'two-factor',
      'malware', 'phishing', 'encryption', 'antivirus', 'ransomware',
      'mfa', 'wpa', 'wep', 'password', 'authentication',
    ],
    lessonNumbers: ['136'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.1 Security Measures',
  },
  {
    keywords: [
      'app crash', 'software issue', 'os problem', 'slow performance',
      'startup repair', 'safe mode', 'driver issue',
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',
  },
  {
    keywords: [
      'change management', 'disaster recovery',
      'documentation', 'backup', 'ticketing', 'incident', 'safety',
      'scripting',
    ],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
  },
  // ── Advanced Healthcare IT ─────────────────────────────────
  {
    keywords: [
      'electronic health record', 'health information exchange',
      'ehr', 'fhir', 'hl7', 'epic', 'cerner', 'interoperability',
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT EHR Architecture',
    compObjective: 'EHR Integrations & Sandboxes',
  },
  {
    keywords: [
      'privacy rule', 'security rule', 'breach notification', 'risk assessment',
      'hipaa', 'phi', 'compliance', 'audit', 'baa', 'cybersecurity',
      'vulnerability',
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT HIPAA Data Security',
    compObjective: 'PHI Protection Strategies',
  },
  {
    keywords: [
      'medical iot', 'lab order',
      'clinical', 'cpoe', 'patient', 'telehealth', 'nursing', 'discharge',
      'admission',
    ],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT Clinical Workflows',
    compObjective: 'Patient Admission to Discharge',
  },
];

const DIAGRAM_KEYWORDS = ['architecture map', 'mermaid', 'flowchart', 'topology', 'diagram', 'blueprint'];
const PROMPT_KEYWORDS = ['canvas class ai', 'system message', 'prompt', 'llm', 'chatgpt', 'ai role'];

function scoreRule(rule: Rule, text: string): number {
  let score = 0;
  const consumedRanges: [number, number][] = [];

  const sorted = [...rule.keywords].sort((a, b) => b.length - a.length);

  for (const kw of sorted) {
    const isPhrase = kw.includes(' ');
    const idx = findBoundedMatch(text, kw, consumedRanges);
    if (idx === -1) continue;

    const points = isPhrase ? 3 : 1;
    score += points;
    consumedRanges.push([idx, idx + kw.length]);
  }

  if (rule.lessonNumbers) {
    for (const ln of rule.lessonNumbers) {
      if (text.includes(ln)) score += 2;
    }
  }

  return score;
}

export function autoCategorizeSubmission(
  title: string,
  content: string,
): AutoCategoryResult | null {
  const combined = `${title} ${content}`.toLowerCase();

  let submissionType: 'Diagram' | 'Prompt Playbook' | undefined;
  if (DIAGRAM_KEYWORDS.some((kw) => combined.includes(kw))) {
    submissionType = 'Diagram';
  } else if (PROMPT_KEYWORDS.some((kw) => combined.includes(kw))) {
    submissionType = 'Prompt Playbook';
  }

  let bestRule: Rule | null = null;
  let bestScore = 0;

  for (const rule of RULES) {
    const score = scoreRule(rule, combined);
    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  if (!bestRule || bestScore < MINIMUM_CONFIDENCE_SCORE) {
    if (submissionType) {
      return { masterCategory: '', track: '', submissionType };
    }
    return null;
  }

  return {
    masterCategory: bestRule.masterCategory,
    track: bestRule.track,
    compObjective: bestRule.compObjective,
    lxStage: bestRule.lxStage,
    submissionType,
  };
}
