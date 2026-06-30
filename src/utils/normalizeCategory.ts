const KNOWN_DOMAINS = new Set([
  'Domain 1.0 — Mobile Devices',
  'Domain 2.0 — Networking',
  'Domain 3.0 — Hardware',
  'Domain 4.0 — Virtualization & Cloud',
  'Domain 5.0 — Hardware & Network Troubleshooting',
  'Domain 1.0 — Operating Systems',
  'Domain 2.0 — Security',
  'Domain 3.0 — Software Troubleshooting',
  'Domain 4.0 — Operational Procedures',
  'EHR Architecture',
  'HIPAA Data Security',
  'Clinical Workflows',
]);

type Rule = { test: (s: string) => boolean; target: string };

const RULES: Rule[] = [
  // Domain 5 must come before generic troubleshooting/hardware/network matches
  { test: (s) => s.includes('domain 5'), target: 'Domain 5.0 — Hardware & Network Troubleshooting' },
  { test: (s) => s.includes('troubleshooting') && (s.includes('network') || s.includes('hardware')), target: 'Domain 5.0 — Hardware & Network Troubleshooting' },

  // Core 1 domains
  { test: (s) => s.includes('domain 1') && (s.includes('core 1') || s.includes('mobile')), target: 'Domain 1.0 — Mobile Devices' },
  { test: (s) => s.includes('mobile') || s.includes('mdm'), target: 'Domain 1.0 — Mobile Devices' },
  { test: (s) => s.includes('domain 2') && (s.includes('core 1') || s.includes('network')), target: 'Domain 2.0 — Networking' },
  { test: (s) => s.includes('network') || s.includes('tcp/ip') || s.includes('tcp ip') || s.includes('osi model'), target: 'Domain 2.0 — Networking' },
  { test: (s) => s.includes('domain 3') && (s.includes('core 1') || s.includes('hardware')), target: 'Domain 3.0 — Hardware' },
  { test: (s) => s.includes('motherboard') || s.includes('pbq'), target: 'Domain 3.0 — Hardware' },
  { test: (s) => s.includes('domain 4') && (s.includes('core 1') || s.includes('cloud') || s.includes('virtual')), target: 'Domain 4.0 — Virtualization & Cloud' },
  { test: (s) => s.includes('virtualization') || (s.includes('cloud') && !s.includes('healthcare') && !s.includes('clinical')), target: 'Domain 4.0 — Virtualization & Cloud' },

  // Core 2 domains
  { test: (s) => s.includes('domain 1') && (s.includes('core 2') || s.includes('operating')), target: 'Domain 1.0 — Operating Systems' },
  { test: (s) => s.includes('operating system') || s.includes('windows') || /\bos\b/.test(s), target: 'Domain 1.0 — Operating Systems' },
  { test: (s) => s.includes('domain 2') && (s.includes('core 2') || s.includes('security')), target: 'Domain 2.0 — Security' },
  { test: (s) => s.includes('security') || s.includes('authentication') || s.includes('rbac') || s.includes('access control'), target: 'Domain 2.0 — Security' },
  { test: (s) => s.includes('domain 3') && (s.includes('core 2') || s.includes('software')), target: 'Domain 3.0 — Software Troubleshooting' },
  { test: (s) => s.includes('software') && s.includes('troubleshooting'), target: 'Domain 3.0 — Software Troubleshooting' },
  { test: (s) => s.includes('domain 4') && (s.includes('core 2') || s.includes('operational')), target: 'Domain 4.0 — Operational Procedures' },
  { test: (s) => s.includes('operational') || s.includes('change management'), target: 'Domain 4.0 — Operational Procedures' },

  // Healthcare
  { test: (s) => s.includes('ehr') || s.includes('electronic health'), target: 'EHR Architecture' },
  { test: (s) => s.includes('hipaa') || s.includes('safeguard') || s.includes('audit'), target: 'HIPAA Data Security' },
  { test: (s) => s.includes('workflow') || s.includes('clinical'), target: 'Clinical Workflows' },
];

export function normalizeCategory(rawCategory: string, title: string = ''): string {
  const trimmed = (rawCategory ?? '').trim();
  if (KNOWN_DOMAINS.has(trimmed)) return trimmed;

  const surface = `${trimmed} ${title}`.toLowerCase();

  for (const rule of RULES) {
    if (rule.test(surface)) return rule.target;
  }

  return trimmed;
}
