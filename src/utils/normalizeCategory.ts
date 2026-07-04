const KNOWN_CANONICAL = new Set([
  'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)',
  'CompTIA A+ Core 1 Domain 2.0 (Networking)',
  'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
  'CompTIA A+ Core 1 Domain 4.0 (Cloud)',
  'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
  'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
  'CompTIA A+ Core 2 Domain 2.0 (Security)',
  'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',
  'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
  'Advanced Healthcare IT EHR Architecture',
  'Advanced Healthcare IT HIPAA Data Security',
  'Advanced Healthcare IT Clinical Workflows',
]);

const SHORT_FORM_ALIASES: Record<string, string> = {
  // Healthcare short forms
  'EHR Architecture': 'Advanced Healthcare IT EHR Architecture',
  'HIPAA Data Security': 'Advanced Healthcare IT HIPAA Data Security',
  'Clinical Workflows': 'Advanced Healthcare IT Clinical Workflows',

  // Core 1 alternate strings observed in submissions
  'Domain 1.0 Mobile Devices': 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)',
  'Domain 2.0 Networking': 'CompTIA A+ Core 1 Domain 2.0 (Networking)',
  'Domain 3.0 Hardware': 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
  'Domain 4.0 Cloud': 'CompTIA A+ Core 1 Domain 4.0 (Cloud)',
  'Domain 4.0 Virtualization & Cloud': 'CompTIA A+ Core 1 Domain 4.0 (Cloud)',
  'Domain 5.0 Troubleshooting': 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
  'CompTIA A+ Core 1 Domain 4.0 (Virtualization & Cloud)': 'CompTIA A+ Core 1 Domain 4.0 (Cloud)',
  'CompTIA A+ Core 1 Domain 5.0 (HW & Network Troubleshooting)': 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',

  // Core 2 alternate strings observed in submissions
  'Domain 1.0 Operating Systems': 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
  'Domain 2.0 Security': 'CompTIA A+ Core 2 Domain 2.0 (Security)',
  'Domain 3.0 Software Troubleshooting': 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',
  'Domain 4.0 Operational Procedures': 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
  'General Troubleshooting': 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
  'Operational Procedures': 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
  'Software & IDEs': 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',
};

type Rule = { test: (s: string) => boolean; target: string };

const RULES: Rule[] = [
  // Healthcare rules MUST come before generic CompTIA rules to prevent
  // "security" in "HIPAA Data Security" from matching Core 2 Security
  { test: (s) => s.includes('hipaa') || s.includes('phi') || s.includes('safeguard'), target: 'Advanced Healthcare IT HIPAA Data Security' },
  { test: (s) => s.includes('ehr') || s.includes('electronic health') || s.includes('fhir') || s.includes('hl7'), target: 'Advanced Healthcare IT EHR Architecture' },
  { test: (s) => (s.includes('clinical') && !s.includes('comptia')) || s.includes('cpoe') || s.includes('telehealth'), target: 'Advanced Healthcare IT Clinical Workflows' },

  // Domain 5 must come before generic troubleshooting/hardware/network matches
  { test: (s) => s.includes('domain 5'), target: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)' },
  { test: (s) => s.includes('troubleshooting') && (s.includes('network') || s.includes('hardware')), target: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)' },

  // Core 2 Domain 4.0 Operational Procedures -- must come before generic matches
  { test: (s) => s.includes('domain 4') && (s.includes('core 2') || s.includes('operational')), target: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)' },
  { test: (s) => s.includes('operational') || s.includes('change management') || s.includes('disaster recovery') || s.includes('incident response'), target: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)' },
  { test: (s) => s.includes('backup') && !s.includes('cloud'), target: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)' },
  { test: (s) => s.includes('safety procedure') || s.includes('environmental impact') || s.includes('documentation') || s.includes('ticketing'), target: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)' },
  { test: (s) => s.includes('remote access') || s.includes('scripting language') || s.includes('privacy') || s.includes('licensing'), target: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)' },

  // Core 1 domains
  { test: (s) => s.includes('domain 1') && (s.includes('core 1') || s.includes('mobile')), target: 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)' },
  { test: (s) => s.includes('mobile') || s.includes('mdm'), target: 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)' },
  { test: (s) => s.includes('domain 2') && (s.includes('core 1') || s.includes('network')), target: 'CompTIA A+ Core 1 Domain 2.0 (Networking)' },
  { test: (s) => s.includes('network') || s.includes('tcp/ip') || s.includes('tcp ip') || s.includes('osi model'), target: 'CompTIA A+ Core 1 Domain 2.0 (Networking)' },
  { test: (s) => s.includes('domain 3') && (s.includes('core 1') || s.includes('hardware')), target: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)' },
  { test: (s) => s.includes('motherboard') || s.includes('pbq'), target: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)' },
  { test: (s) => s.includes('domain 4') && (s.includes('core 1') || s.includes('cloud') || s.includes('virtual')), target: 'CompTIA A+ Core 1 Domain 4.0 (Cloud)' },
  { test: (s) => s.includes('virtualization') || (s.includes('cloud') && !s.includes('healthcare') && !s.includes('clinical')), target: 'CompTIA A+ Core 1 Domain 4.0 (Cloud)' },

  // Core 2 domains
  { test: (s) => s.includes('domain 1') && (s.includes('core 2') || s.includes('operating')), target: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)' },
  { test: (s) => s.includes('operating system') || s.includes('windows') || /\bos\b/.test(s), target: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)' },
  { test: (s) => s.includes('domain 2') && (s.includes('core 2') || s.includes('security')), target: 'CompTIA A+ Core 2 Domain 2.0 (Security)' },
  { test: (s) => s.includes('security') || s.includes('authentication') || s.includes('rbac') || s.includes('access control'), target: 'CompTIA A+ Core 2 Domain 2.0 (Security)' },
  { test: (s) => s.includes('domain 3') && (s.includes('core 2') || s.includes('software')), target: 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)' },
  { test: (s) => s.includes('software') && s.includes('troubleshooting'), target: 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)' },
];

export function normalizeCategory(rawCategory: string, title: string = ''): string {
  const trimmed = (rawCategory ?? '').trim();
  if (!trimmed) return trimmed;
  if (KNOWN_CANONICAL.has(trimmed)) return trimmed;
  if (SHORT_FORM_ALIASES[trimmed]) return SHORT_FORM_ALIASES[trimmed];

  const surface = `${trimmed} ${title}`.toLowerCase();

  for (const rule of RULES) {
    if (rule.test(surface)) return rule.target;
  }

  if (typeof console !== 'undefined') {
    console.warn('[normalizeCategory] Unknown track fell through without mapping:', trimmed, '| title:', title);
  }

  return trimmed;
}
