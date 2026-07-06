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

const MINIMUM_CONFIDENCE_SCORE = 2;

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
      'sata', 'nvme', 'ssd', 'hdd', 'socket', 'm.2', 'storage', 'hardware',
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

const SEARCHABLE_ENTRIES: SearchableEntry[] = RULE_DATA.flatMap((rule) =>
  rule.keywords.map((keyword) => ({
    keyword,
    masterCategory: rule.masterCategory,
    track: rule.track,
    compObjective: rule.compObjective,
    lxStage: rule.lxStage,
  })),
);

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

const DIAGRAM_KEYWORDS = ['architecture map', 'mermaid', 'flowchart', 'topology', 'diagram', 'blueprint'];
const PROMPT_KEYWORDS = ['canvas class ai', 'system message', 'prompt', 'llm', 'chatgpt', 'ai role'];

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

  // Inverted Fuse: user text is the dataset, keywords are the queries
  const fuse = new Fuse([{ text: combined }], {
    keys: ['text'],
    threshold: 0.2,
    ignoreLocation: true,
    includeScore: true,
  });

  const trackScores = new Map<string, { points: number; entry: SearchableEntry }>();

  for (const entry of SEARCHABLE_ENTRIES) {
    const results = fuse.search(entry.keyword);
    if (results.length > 0 && results[0].score !== undefined && results[0].score < 0.3) {
      const isPhrase = entry.keyword.includes(' ');
      const points = isPhrase ? 3 : 2;

      const existing = trackScores.get(entry.track);
      if (existing) {
        existing.points += points;
      } else {
        trackScores.set(entry.track, { points, entry });
      }
    }
  }

  let bestTrack: { points: number; entry: SearchableEntry } | null = null;
  for (const candidate of trackScores.values()) {
    if (!bestTrack || candidate.points > bestTrack.points) {
      bestTrack = candidate;
    }
  }

  if (!bestTrack || bestTrack.points < MINIMUM_CONFIDENCE_SCORE) {
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
