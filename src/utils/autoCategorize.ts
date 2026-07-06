import Fuse from 'fuse.js';

export interface AutoCategoryResult {
  masterCategory: string;
  track: string;
  compObjective?: string;
  lxStage?: string;
  submissionType?: 'Diagram' | 'Prompt Playbook';
}

interface SearchableEntry {
  keyword: string;
  masterCategory: string;
  track: string;
  compObjective?: string;
  lxStage?: string;
}

interface LessonMapping {
  lessonNumber: string;
  masterCategory: string;
  track: string;
  compObjective?: string;
}

const LX_TRACK = 'Learner Experience & FAQs';

const RULE_DATA: {
  keywords: string[];
  lessonNumbers?: string[];
  masterCategory: string;
  track: string;
  compObjective?: string;
  lxStage?: string;
}[] = [
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

// Flatten all rules into a single searchable array for Fuse
const SEARCHABLE_ENTRIES: SearchableEntry[] = RULE_DATA.flatMap((rule) =>
  rule.keywords.map((keyword) => ({
    keyword,
    masterCategory: rule.masterCategory,
    track: rule.track,
    compObjective: rule.compObjective,
    lxStage: rule.lxStage,
  })),
);

// Separate exact-match lesson number mappings (no fuzzy matching)
const LESSON_MAPPINGS: LessonMapping[] = RULE_DATA
  .filter((r) => r.lessonNumbers)
  .flatMap((r) =>
    r.lessonNumbers!.map((ln) => ({
      lessonNumber: ln,
      masterCategory: r.masterCategory,
      track: r.track,
      compObjective: r.compObjective,
    })),
  );

// Initialize Fuse with tight threshold (0.3) to avoid false positives on IT terms
const fuse = new Fuse(SEARCHABLE_ENTRIES, {
  keys: ['keyword'],
  threshold: 0.3,
  ignoreLocation: true,
  includeScore: true,
});

const DIAGRAM_KEYWORDS = ['architecture map', 'mermaid', 'flowchart', 'topology', 'diagram', 'blueprint'];
const PROMPT_KEYWORDS = ['canvas class ai', 'system message', 'prompt', 'llm', 'chatgpt', 'ai role'];

export function autoCategorizeSubmission(
  title: string,
  content: string,
): AutoCategoryResult | null {
  const combined = `${title} ${content}`.toLowerCase();

  // Submission type detection (exact match, unchanged)
  let submissionType: 'Diagram' | 'Prompt Playbook' | undefined;
  if (DIAGRAM_KEYWORDS.some((kw) => combined.includes(kw))) {
    submissionType = 'Diagram';
  } else if (PROMPT_KEYWORDS.some((kw) => combined.includes(kw))) {
    submissionType = 'Prompt Playbook';
  }

  // Lesson number exact-match pass (no fuzzy)
  for (const mapping of LESSON_MAPPINGS) {
    if (combined.includes(mapping.lessonNumber)) {
      return {
        masterCategory: mapping.masterCategory,
        track: mapping.track,
        compObjective: mapping.compObjective,
        submissionType,
      };
    }
  }

  // Fuzzy search: search the full title first (catches multi-word phrases)
  const trackScores = new Map<string, { score: number; entry: SearchableEntry }>();

  const addHit = (entry: SearchableEntry, fuseScore: number) => {
    // Lower Fuse score = better match. Convert to points (1 - score gives higher points for better matches)
    const points = 1 - fuseScore;
    const existing = trackScores.get(entry.track);
    if (existing) {
      existing.score += points;
    } else {
      trackScores.set(entry.track, { score: points, entry });
    }
  };

  // Search full title as a phrase
  const titleLower = title.toLowerCase().trim();
  if (titleLower.length >= 3) {
    const titleResults = fuse.search(titleLower, { limit: 5 });
    for (const r of titleResults) {
      if (r.score !== undefined && r.score <= 0.3) {
        addHit(r.item, r.score);
      }
    }
  }

  // Tokenize combined text and search each meaningful token
  const tokens = combined
    .split(/[\s,;:!?()[\]{}"'\/\\|<>~`]+/)
    .filter((t) => t.length >= 3);

  // Also extract 2-word and 3-word ngrams from the title for phrase matching
  const titleTokens = titleLower.split(/\s+/).filter((t) => t.length >= 2);
  const ngrams: string[] = [];
  for (let i = 0; i < titleTokens.length - 1; i++) {
    ngrams.push(`${titleTokens[i]} ${titleTokens[i + 1]}`);
    if (i < titleTokens.length - 2) {
      ngrams.push(`${titleTokens[i]} ${titleTokens[i + 1]} ${titleTokens[i + 2]}`);
    }
  }

  const searchTerms = [...new Set([...ngrams, ...tokens])];

  for (const term of searchTerms) {
    const results = fuse.search(term, { limit: 3 });
    for (const r of results) {
      if (r.score !== undefined && r.score <= 0.3) {
        addHit(r.item, r.score);
      }
    }
  }

  // Find the track with the highest aggregated score
  let bestTrack: { score: number; entry: SearchableEntry } | null = null;
  for (const candidate of trackScores.values()) {
    if (!bestTrack || candidate.score > bestTrack.score) {
      bestTrack = candidate;
    }
  }

  // Require at least one strong match (aggregated score > 0.5 means at least one good hit)
  if (!bestTrack || bestTrack.score < 0.5) {
    if (submissionType) {
      return { masterCategory: '', track: '', submissionType };
    }
    return null;
  }

  return {
    masterCategory: bestTrack.entry.masterCategory,
    track: bestTrack.entry.track,
    compObjective: bestTrack.entry.compObjective,
    lxStage: bestTrack.entry.lxStage,
    submissionType,
  };
}
