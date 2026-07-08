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

// ── Keyword-based slug resolution (moved from AdminControlPage) ──────────────

export const TRACK_RULES: { keywords: string[]; slug: string }[] = [
  { keywords: ['core 1', 'domain 1', 'mobile'],            slug: 'core1-mobile' },
  { keywords: ['core 1', 'domain 2', 'networking'],        slug: 'core1-networking' },
  { keywords: ['core 1', 'domain 3', 'hardware'],          slug: 'core1-hardware' },
  { keywords: ['core 1', 'domain 4'],                      slug: 'core1-cloud' },
  { keywords: ['core 1', 'domain 5'],                      slug: 'core1-troubleshooting' },
  { keywords: ['core 1', 'mobile'],                        slug: 'core1-mobile' },
  { keywords: ['core 1', 'networking'],                    slug: 'core1-networking' },
  { keywords: ['core 1', 'hardware'],                      slug: 'core1-hardware' },
  { keywords: ['core 1', 'virtualization'],                slug: 'core1-cloud' },
  { keywords: ['core 1', 'cloud'],                         slug: 'core1-cloud' },
  { keywords: ['core 1', 'troubleshooting'],               slug: 'core1-troubleshooting' },
  { keywords: ['core 2', 'domain 1', 'operating'],         slug: 'core2-os' },
  { keywords: ['core 2', 'domain 2', 'security'],          slug: 'core2-security' },
  { keywords: ['core 2', 'domain 3', 'software'],          slug: 'core2-software' },
  { keywords: ['core 2', 'domain 4', 'operational'],       slug: 'core2-operations' },
  { keywords: ['core 2', 'operating system'],              slug: 'core2-os' },
  { keywords: ['core 2', 'security'],                      slug: 'core2-security' },
  { keywords: ['core 2', 'software'],                      slug: 'core2-software' },
  { keywords: ['core 2', 'operational'],                   slug: 'core2-operations' },
  { keywords: ['general troubleshooting'],                 slug: 'core2-operations' },
  { keywords: ['healthcare', 'ehr'],                       slug: 'healthcare-ehr' },
  { keywords: ['healthcare', 'hipaa'],                     slug: 'healthcare-hipaa' },
  { keywords: ['healthcare', 'clinical'],                  slug: 'healthcare-clinical' },
];

// ── Unified resolver result ──────────────────────────────────────────────────

export interface ResolvedDomain {
  slug: string;
  trackName: string;
  canonical: string;
}

/**
 * Master resolver: takes any raw track/category string and optionally an article slug,
 * returns the fully-resolved {slug, trackName, canonical} or null if unresolvable.
 */
export function resolveTrackSlug(rawTrack: string, articleSlug?: string): ResolvedDomain | null {
  const trimmed = (rawTrack ?? '').trim();

  // 1. Try direct canonical/alias/slug lookup
  const directSlug = resolveToSlug(trimmed);
  if (directSlug) {
    const entry = SLUG_TO_ENTRY[directSlug];
    if (entry) return { slug: entry.slug, trackName: entry.track, canonical: entry.canonical };
    const canonical = SLUG_TO_CANONICAL[directSlug];
    if (canonical) return { slug: directSlug, trackName: trackNameFromSlug(directSlug), canonical };
  }

  // 2. Try keyword matching against the track rules
  const t = trimmed.toLowerCase();
  for (const rule of TRACK_RULES) {
    if (rule.keywords.every((kw) => t.includes(kw))) {
      const entry = SLUG_TO_ENTRY[rule.slug];
      if (entry) return { slug: entry.slug, trackName: entry.track, canonical: entry.canonical };
      const canonical = SLUG_TO_CANONICAL[rule.slug] ?? '';
      return { slug: rule.slug, trackName: trackNameFromSlug(rule.slug), canonical };
    }
  }

  // 3. Infer from article slug prefix
  if (articleSlug) {
    const fromPrefix = slugPrefixToEntry(articleSlug);
    if (fromPrefix) return fromPrefix;
  }

  return null;
}

/**
 * Resolves any raw track/category string (and optional article slug) to a high-level
 * track name: "CompTIA A+ Core 1", "CompTIA A+ Core 2", "Advanced Healthcare IT",
 * "Learner Experience", or "Other Contributions".
 */
export function resolveToTrackName(rawTrack: string, articleSlug?: string): string {
  const trimmed = (rawTrack ?? '').trim();

  // Deskolas Tech Solutions (must precede learner-experience check since some values contain both)
  const lower0 = trimmed.toLowerCase();
  if (lower0.includes('tech solutions') || lower0.includes('deskolas')) return 'Deskolas Tech Solutions';

  // Learner Experience is its own track (not in DOMAIN_REGISTRY)
  if (lower0.includes('learner experience')) return 'Learner Experience';

  // Try the full resolver
  const resolved = resolveTrackSlug(trimmed, articleSlug);
  if (resolved) return resolved.trackName;

  // Fallback heuristics for track-name bucketing (preserves legacy behavior)
  const lower = trimmed.toLowerCase();
  if (lower.includes('core 1')) return 'CompTIA A+ Core 1';
  if (lower.includes('core 2')) return 'CompTIA A+ Core 2';
  if (lower.includes('healthcare')) return 'Advanced Healthcare IT';
  if (/Domain\s+[1-3]\.0/i.test(trimmed)) return 'CompTIA A+ Core 1';
  if (/Domain\s+[4-5]\.0/i.test(trimmed)) return 'CompTIA A+ Core 2';
  if (lower.includes('networking') || lower.includes('diagram')) return 'CompTIA A+ Core 1';
  if (lower.includes('administration')) return 'CompTIA A+ Core 2';
  if (lower.includes('prompt') || lower.includes('ai')) return 'Advanced Healthcare IT';
  if (lower.includes('quick reference')) return 'CompTIA A+ Core 1';

  // Infer from article slug prefix
  if (articleSlug) {
    if (articleSlug.startsWith('core1-')) return 'CompTIA A+ Core 1';
    if (articleSlug.startsWith('core2-')) return 'CompTIA A+ Core 2';
    if (articleSlug.startsWith('healthcare-') || articleSlug.includes('ai-prompt')) return 'Advanced Healthcare IT';
    if (articleSlug.startsWith('learner-experience')) return 'Learner Experience';
    if (articleSlug.startsWith('deskolas-')) return 'Deskolas Tech Solutions';
  }

  if (!trimmed) return 'Other Contributions';
  return 'Other Contributions';
}

// ── SLUG_TO_DOMAIN_META (replaces SectionPage's SLUG_TO_DOMAIN) ──────────────

export interface DomainMeta {
  domain: string;
  trackIndex: number;
}

export const SLUG_TO_DOMAIN_META: Record<string, DomainMeta> = (() => {
  const trackIndexMap: Record<string, number> = {
    'CompTIA A+ Core 1': 0,
    'CompTIA A+ Core 2': 1,
    'Advanced Healthcare IT': 2,
  };
  const result: Record<string, DomainMeta> = {};
  for (const entry of DOMAIN_REGISTRY) {
    result[entry.slug] = { domain: entry.sectionTitle, trackIndex: trackIndexMap[entry.track] ?? 0 };
  }
  // Alias: core1-virtualization points to the same domain as core1-cloud
  result['core1-virtualization'] = { domain: 'Domain 4.0 Virtualization & Cloud', trackIndex: 0 };
  return result;
})();

// ── Helpers ──────────────────────────────────────────────────────────────────

function trackNameFromSlug(slug: string): string {
  if (slug.startsWith('core1-')) return 'CompTIA A+ Core 1';
  if (slug.startsWith('core2-')) return 'CompTIA A+ Core 2';
  if (slug.startsWith('healthcare-')) return 'Advanced Healthcare IT';
  return 'Other Contributions';
}

function slugPrefixToEntry(articleSlug: string): ResolvedDomain | null {
  if (articleSlug.startsWith('core1-')) {
    const entry = SLUG_TO_ENTRY['core1-mobile'];
    return entry ? { slug: 'core1-mobile', trackName: 'CompTIA A+ Core 1', canonical: entry.canonical } : null;
  }
  if (articleSlug.startsWith('core2-')) {
    const entry = SLUG_TO_ENTRY['core2-os'];
    return entry ? { slug: 'core2-os', trackName: 'CompTIA A+ Core 2', canonical: entry.canonical } : null;
  }
  if (articleSlug.startsWith('healthcare-') || articleSlug.includes('ai-prompt')) {
    const entry = SLUG_TO_ENTRY['healthcare-ehr'];
    return entry ? { slug: 'healthcare-ehr', trackName: 'Advanced Healthcare IT', canonical: entry.canonical } : null;
  }
  return null;
}

// ── Legacy exports (unchanged API surface) ───────────────────────────────────

export interface MasterCategory {
  label: string;
  badge: string;
  sub: string[];
}

export const MASTER_CATEGORIES: MasterCategory[] = [
  { label: 'Learner Experience & FAQs', badge: 'Community Contributor', sub: [] },
  { label: 'Deskolas Tech Solutions', badge: 'Community Contributor', sub: [] },
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
  if (trackName.includes('Deskolas') || trackName.includes('Tech Solutions')) return 'Community Contributor';
  if (trackName.includes('Core 2')) return 'Core 2 Expert';
  if (trackName.includes('Healthcare')) return 'Healthcare IT Specialist';
  return 'Core 1 Expert';
}
