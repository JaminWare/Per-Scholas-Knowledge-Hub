export interface AutoCategoryResult {
  masterCategory: string;
  track: string;
  compObjective?: string;
  submissionType?: 'Diagram' | 'Prompt Playbook';
}

interface Rule {
  keywords: string[];
  lessonNumbers?: string[];
  masterCategory: string;
  track: string;
  compObjective?: string;
}

const RULES: Rule[] = [
  // Core 1 Domain 2.0 Networking
  {
    keywords: ['ip address', 'networking', 'firewall', 'subnet', 'tcp', 'port', 'router', 'switch', 'dns', 'dhcp', 'osi', 'gateway', 'nat', 'vlan', 'ethernet', 'wifi', 'wireless', 'protocol', 'packet', 'soho'],
    lessonNumbers: ['133'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 2.0 (Networking)',
    compObjective: '2.7 Network Configs',
  },
  // Core 1 Domain 3.0 Hardware
  {
    keywords: ['motherboard', 'ram', 'cpu', 'bios', 'post', 'cmos', 'heatsink', 'chipset', 'pcie', 'dimm', 'atx', 'power supply', 'psu', 'sata', 'nvme', 'ssd', 'hdd', 'socket', 'cpu socket', 'pin', 'm.2', 'storage'],
    lessonNumbers: ['132'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
    compObjective: '3.4 Motherboards & CPUs',
  },
  // Core 1 Domain 1.0 Mobile Devices
  {
    keywords: ['laptop', 'mobile display', 'mobile device', 'tablet', 'touchscreen', 'digitizer', 'lcd', 'oled', 'battery', 'docking station'],
    lessonNumbers: ['130'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)',
  },
  // Core 1 Domain 4.0 Cloud / Virtualization
  {
    keywords: ['cloud', 'virtualization', 'virtual machine', 'vm', 'hypervisor', 'iaas', 'paas', 'saas', 'vmware', 'hyper-v', 'container', 'docker'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 4.0 (Cloud)',
    compObjective: '4.1 Cloud Computing Concepts',
  },
  // Core 1 Domain 5.0 Troubleshooting
  {
    keywords: ['troubleshoot', 'blue screen', 'bsod', 'no post', 'boot failure', 'overheating', 'beep code'],
    masterCategory: 'CompTIA A+ Core 1',
    track: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
    compObjective: '5.2 Motherboard/RAM/CPU Issues',
  },
  // Core 2 Domain 1.0 Operating Systems
  {
    keywords: ['windows', 'command line', 'cli', 'powershell', 'linux', 'macos', 'terminal', 'registry', 'task manager', 'disk management', 'cmd', 'bash'],
    lessonNumbers: ['134', '135'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
    compObjective: '1.2 Command-Line Tools',
  },
  // Core 2 Domain 2.0 Security
  {
    keywords: ['malware', 'phishing', 'social engineering', 'encryption', 'antivirus', 'ransomware', 'firewall rule', 'mfa', 'two-factor', 'wpa', 'wep', 'password', 'authentication'],
    lessonNumbers: ['136'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 2.0 (Security)',
    compObjective: '2.1 Security Measures',
  },
  // Core 2 Domain 3.0 Software Troubleshooting
  {
    keywords: ['app crash', 'software issue', 'os problem', 'slow performance', 'startup repair', 'safe mode', 'driver issue'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',
  },
  // Core 2 Domain 4.0 Operational Procedures
  {
    keywords: ['change management', 'documentation', 'disaster recovery', 'backup', 'ticketing', 'incident', 'safety', 'scripting'],
    masterCategory: 'CompTIA A+ Core 2',
    track: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
  },
  // Advanced Healthcare IT EHR Architecture
  {
    keywords: ['ehr', 'fhir', 'hl7', 'epic', 'cerner', 'electronic health record', 'interoperability', 'health information exchange'],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT EHR Architecture',
    compObjective: 'EHR Integrations & Sandboxes',
  },
  // Advanced Healthcare IT HIPAA
  {
    keywords: ['hipaa', 'phi', 'compliance', 'audit', 'privacy rule', 'security rule', 'breach notification', 'baa', 'cybersecurity', 'risk assessment', 'vulnerability'],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT HIPAA Data Security',
    compObjective: 'PHI Protection Strategies',
  },
  // Advanced Healthcare IT Clinical Workflows
  {
    keywords: ['clinical', 'cpoe', 'patient', 'telehealth', 'medical iot', 'nursing', 'discharge', 'admission', 'lab order'],
    masterCategory: 'Advanced Healthcare IT',
    track: 'Advanced Healthcare IT Clinical Workflows',
    compObjective: 'Patient Admission to Discharge',
  },
];

const DIAGRAM_KEYWORDS = ['mermaid', 'flowchart', 'topology', 'diagram', 'blueprint', 'architecture map'];
const PROMPT_KEYWORDS = ['prompt', 'llm', 'system message', 'chatgpt', 'ai role', 'canvas class ai'];

export function autoCategorizeSubmission(
  title: string,
  content: string,
): AutoCategoryResult | null {
  const combined = `${title} ${content}`.toLowerCase();

  // Detect submission type
  let submissionType: 'Diagram' | 'Prompt Playbook' | undefined;
  if (DIAGRAM_KEYWORDS.some((kw) => combined.includes(kw))) {
    submissionType = 'Diagram';
  } else if (PROMPT_KEYWORDS.some((kw) => combined.includes(kw))) {
    submissionType = 'Prompt Playbook';
  }

  // Score each rule by how many keywords match
  let bestRule: Rule | null = null;
  let bestScore = 0;

  for (const rule of RULES) {
    let score = 0;

    for (const kw of rule.keywords) {
      if (combined.includes(kw)) score++;
    }

    if (rule.lessonNumbers) {
      for (const ln of rule.lessonNumbers) {
        if (combined.includes(ln)) score += 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  if (!bestRule || bestScore < 1) {
    if (submissionType) {
      return { masterCategory: '', track: '', submissionType };
    }
    return null;
  }

  return {
    masterCategory: bestRule.masterCategory,
    track: bestRule.track,
    compObjective: bestRule.compObjective,
    submissionType,
  };
}
