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

const FOCUS_KEYWORD_MAP: Record<string, [string, RegExp][]> = {
  'Hardware & AV Setup': [
    ['Display & Video', /(monitor|display|hdmi|webcam|video|screen)/i],
    ['Audio & Peripherals', /(mic|headset|audio|speaker|usb|keyboard|mouse)/i],
  ],
  'Network & Access': [
    ['WiFi & Connectivity', /(wifi|internet|connection|disconnect|slow)/i],
    ['VPN & Proxy', /(vpn|proxy|firewall|blocked|access)/i],
  ],
  'Software & IDEs': [
    ['VS Code & Extensions', /(vscode|extension|plugin|editor|terminal)/i],
    ['VMs & Environments', /(virtualbox|vm|docker|environment|install)/i],
  ],
  'Git & GitHub': [
    ['Push & Pull Issues', /(push|pull|remote|origin|reject|fetch)/i],
    ['Merge & Conflicts', /(merge|conflict|branch|rebase|reset)/i],
  ],
  'Accounts & LMS': [
    ['Login & Password', /(login|password|locked|reset|mfa|2fa)/i],
    ['Canvas & Coursera', /(canvas|coursera|lms|enrollment|module)/i],
  ],
};

export function deriveFocusArea(topic: string, title: string, content: string): string | null {
  const rules = FOCUS_KEYWORD_MAP[topic];
  if (!rules) return null;
  const haystack = `${title} ${content}`;
  for (const [focus, pattern] of rules) {
    if (pattern.test(haystack)) return focus;
  }
  return null;
}

export function parseTicketContent(raw: string): { problem: string; solution: string } {
  const problemMatch = raw.match(/Problem:\s*([\s\S]*?)(?=Solution:|$)/i);
  const solutionMatch = raw.match(/Solution:\s*([\s\S]*)/i);

  return {
    problem: problemMatch?.[1]?.trim() ?? raw.trim(),
    solution: solutionMatch?.[1]?.trim() ?? '',
  };
}
