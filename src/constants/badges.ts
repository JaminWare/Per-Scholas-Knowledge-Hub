export const BADGE_COLORS: Record<string, string> = {
  'Founder':             'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400',
  'Core 1 Expert':       'bg-blue-600/10 text-blue-700 dark:text-blue-400',
  'Core 2 Expert':       'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  'HealthIT Specialist': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  'Diagram Architect':   'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'Reference Author':    'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'Cohort Contributor':  'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400',
  'Domain Expert':       'bg-blue-600/15 text-blue-800 dark:text-blue-300 border border-blue-400/30',
  'Master Architect':    'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/30',
};

export const BADGE_COLORS_WITH_BORDER: Record<string, string> = {
  ...BADGE_COLORS,
  'Founder': 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20',
};

export const ROLE_BADGE_STYLES: Record<string, string> = {
  'Founder':             'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20',
  'HealthIT Specialist': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  'Reference Author':    'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'Core 1 Expert':       'bg-blue-600/10 text-blue-700 dark:text-blue-400',
  'Core 2 Expert':       'bg-teal-500/10 text-teal-600 dark:text-teal-400',
};

export const SECTION_ROLE_COLORS: Record<string, string> = {
  'Core 1 Expert':       'bg-blue-600/10 text-blue-400',
  'Core 2 Expert':       'bg-blue-600/10 text-blue-400',
  'HealthIT Specialist': 'bg-blue-600/10 text-blue-400',
  'AI Prompt Engineer':  'bg-blue-600/10 text-blue-400',
  'Reference Author':    'bg-amber-500/10 text-amber-400',
};

export const BADGE_TIER_THRESHOLDS = {
  MASTER_ARCHITECT: 5,
  DOMAIN_EXPERT: 3,
} as const;

export function deriveTierBadge(count: number): string {
  if (count >= BADGE_TIER_THRESHOLDS.MASTER_ARCHITECT) return 'Master Architect';
  if (count >= BADGE_TIER_THRESHOLDS.DOMAIN_EXPERT) return 'Domain Expert';
  return 'Cohort Contributor';
}
