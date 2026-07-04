export interface DomainEntry {
  canonical: string;
  slug: string;
  sectionTitle: string;
  track: string;
}

export const DOMAIN_REGISTRY: DomainEntry[] = [
  // CompTIA A+ Core 1
  { canonical: 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)',    slug: 'core1-mobile',          sectionTitle: 'Domain 1.0 Mobile Devices',                    track: 'CompTIA A+ Core 1' },
  { canonical: 'CompTIA A+ Core 1 Domain 2.0 (Networking)',        slug: 'core1-networking',      sectionTitle: 'Domain 2.0 Networking',                        track: 'CompTIA A+ Core 1' },
  { canonical: 'CompTIA A+ Core 1 Domain 3.0 (Hardware)',          slug: 'core1-hardware',        sectionTitle: 'Domain 3.0 Hardware',                          track: 'CompTIA A+ Core 1' },
  { canonical: 'CompTIA A+ Core 1 Domain 4.0 (Cloud)',             slug: 'core1-cloud',           sectionTitle: 'Domain 4.0 Virtualization & Cloud',            track: 'CompTIA A+ Core 1' },
  { canonical: 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',   slug: 'core1-troubleshooting', sectionTitle: 'Domain 5.0 HW & Network Troubleshooting',      track: 'CompTIA A+ Core 1' },
  // CompTIA A+ Core 2
  { canonical: 'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',       slug: 'core2-os',         sectionTitle: 'Domain 1.0 Operating Systems',            track: 'CompTIA A+ Core 2' },
  { canonical: 'CompTIA A+ Core 2 Domain 2.0 (Security)',                slug: 'core2-security',   sectionTitle: 'Domain 2.0 Security',                     track: 'CompTIA A+ Core 2' },
  { canonical: 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',slug: 'core2-software',   sectionTitle: 'Domain 3.0 Software Troubleshooting',     track: 'CompTIA A+ Core 2' },
  { canonical: 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',  slug: 'core2-operations', sectionTitle: 'Domain 4.0 Operational Procedures',        track: 'CompTIA A+ Core 2' },
  // Advanced Healthcare IT
  { canonical: 'Advanced Healthcare IT EHR Architecture',     slug: 'healthcare-ehr',      sectionTitle: 'EHR Architecture',      track: 'Advanced Healthcare IT' },
  { canonical: 'Advanced Healthcare IT HIPAA Data Security',  slug: 'healthcare-hipaa',    sectionTitle: 'HIPAA Data Security',   track: 'Advanced Healthcare IT' },
  { canonical: 'Advanced Healthcare IT Clinical Workflows',   slug: 'healthcare-clinical', sectionTitle: 'Clinical Workflows',    track: 'Advanced Healthcare IT' },
];

export const CANONICAL_SET = new Set(DOMAIN_REGISTRY.map((d) => d.canonical));

export const SLUG_TO_CANONICAL: Record<string, string> = Object.fromEntries(
  DOMAIN_REGISTRY.map((d) => [d.slug, d.canonical]),
);

export const CANONICAL_TO_SLUG: Record<string, string> = Object.fromEntries(
  DOMAIN_REGISTRY.map((d) => [d.canonical, d.slug]),
);

export const SECTION_TITLE_TO_CANONICAL: Record<string, string> = Object.fromEntries(
  DOMAIN_REGISTRY.map((d) => [d.sectionTitle, d.canonical]),
);

export const SLUG_TO_ENTRY: Record<string, DomainEntry> = Object.fromEntries(
  DOMAIN_REGISTRY.map((d) => [d.slug, d]),
);

// Slug aliases that map to the same domain (e.g. core1-virtualization -> Cloud)
SLUG_TO_CANONICAL['core1-virtualization'] = 'CompTIA A+ Core 1 Domain 4.0 (Cloud)';

// Additional sectionTitle aliases for alternate label forms
SECTION_TITLE_TO_CANONICAL['Domain 5.0 Hardware & Network Troubleshooting'] = 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)';

// Short-form aliases observed in submissions or legacy data
const SHORT_FORM_ALIASES: Record<string, string> = {
  'Domain 1.0 Mobile Devices':                                  'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)',
  'Domain 2.0 Networking':                                      'CompTIA A+ Core 1 Domain 2.0 (Networking)',
  'Domain 3.0 Hardware':                                        'CompTIA A+ Core 1 Domain 3.0 (Hardware)',
  'Domain 4.0 Virtualization & Cloud':                          'CompTIA A+ Core 1 Domain 4.0 (Cloud)',
  'Domain 4.0 Cloud':                                           'CompTIA A+ Core 1 Domain 4.0 (Cloud)',
  'Domain 5.0 Troubleshooting':                                 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
  'Domain 5.0 Hardware & Network Troubleshooting':              'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
  'Domain 5.0 HW & Network Troubleshooting':                   'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
  'Domain 1.0 Operating Systems':                               'CompTIA A+ Core 2 Domain 1.0 (Operating Systems)',
  'Domain 2.0 Security':                                        'CompTIA A+ Core 2 Domain 2.0 (Security)',
  'Domain 3.0 Software Troubleshooting':                        'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',
  'Domain 4.0 Operational Procedures':                          'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
  'EHR Architecture':                                           'Advanced Healthcare IT EHR Architecture',
  'HIPAA Data Security':                                        'Advanced Healthcare IT HIPAA Data Security',
  'Clinical Workflows':                                         'Advanced Healthcare IT Clinical Workflows',
  'CompTIA A+ Core 1 Domain 4.0 (Virtualization & Cloud)':     'CompTIA A+ Core 1 Domain 4.0 (Cloud)',
  'CompTIA A+ Core 1 Domain 5.0 (HW & Network Troubleshooting)': 'CompTIA A+ Core 1 Domain 5.0 (Troubleshooting)',
  'General Troubleshooting':                                    'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
  'Operational Procedures':                                     'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
  'Software & IDEs':                                            'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)',
};

export function resolveToCanonical(raw: string): string | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;
  if (CANONICAL_SET.has(trimmed)) return trimmed;
  if (SHORT_FORM_ALIASES[trimmed]) return SHORT_FORM_ALIASES[trimmed];
  const bySlug = SLUG_TO_CANONICAL[trimmed];
  if (bySlug) return bySlug;
  return null;
}

export function resolveToSlug(raw: string): string | null {
  const canonical = resolveToCanonical(raw);
  if (!canonical) return null;
  return CANONICAL_TO_SLUG[canonical] ?? null;
}

export interface MasterCategory {
  label: string;
  badge: string;
  sub: string[];
}

export const MASTER_CATEGORIES: MasterCategory[] = [
  { label: 'Learner Experience & FAQs', badge: 'Community Contributor', sub: [] },
  {
    label: 'CompTIA A+ Core 1',
    badge: 'Core 1 Expert',
    sub: DOMAIN_REGISTRY.filter((d) => d.track === 'CompTIA A+ Core 1').map((d) => d.canonical),
  },
  {
    label: 'CompTIA A+ Core 2',
    badge: 'Core 2 Expert',
    sub: DOMAIN_REGISTRY.filter((d) => d.track === 'CompTIA A+ Core 2').map((d) => d.canonical),
  },
  {
    label: 'Advanced Healthcare IT',
    badge: 'Healthcare IT Specialist',
    sub: DOMAIN_REGISTRY.filter((d) => d.track === 'Advanced Healthcare IT').map((d) => d.canonical),
  },
];

export function getBadgeForTrack(trackName: string): string {
  if (trackName.startsWith('Learner Experience')) return 'Community Contributor';
  if (trackName.includes('Core 2')) return 'Core 2 Expert';
  if (trackName.includes('Healthcare')) return 'Healthcare IT Specialist';
  return 'Core 1 Expert';
}
