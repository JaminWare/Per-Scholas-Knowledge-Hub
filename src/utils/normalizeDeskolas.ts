const DESKOLAS_CATEGORY_MAP: Record<string, string> = {
  'Hardware and AV': 'Hardware & AV Setup',
  'Network and Access': 'Network & Access',
  'Software and IDE': 'Software & IDEs',
  'Git and GitHub': 'Git & GitHub',
  'Accounts and LMS': 'Accounts & LMS',
};

export function normalizeDeskCategory(raw: string): string {
  const trimmed = raw.trim();
  return DESKOLAS_CATEGORY_MAP[trimmed] ?? 'General Troubleshooting';
}

export const DESKOLAS_FOCUS_AREAS = [
  'Hardware & AV Setup',
  'Network & Access',
  'Software & IDEs',
  'Git & GitHub',
  'Accounts & LMS',
  'General Troubleshooting',
] as const;

export type DeskolasFocusArea = (typeof DESKOLAS_FOCUS_AREAS)[number];

export function parseTicketContent(raw: string): { problem: string; solution: string } {
  const problemMatch = raw.match(/Problem:\s*([\s\S]*?)(?=Solution:|$)/i);
  const solutionMatch = raw.match(/Solution:\s*([\s\S]*)/i);

  return {
    problem: problemMatch?.[1]?.trim() ?? raw.trim(),
    solution: solutionMatch?.[1]?.trim() ?? '',
  };
}
