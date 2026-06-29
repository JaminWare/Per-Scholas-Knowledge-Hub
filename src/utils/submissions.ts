const LS_KEY = 'lkb_submissions';

export interface NewSubmission {
  id: string;
  full_name: string;
  track: string;
  badge: string;
  title: string;
  content: string;
  submission_type?: string;
  media_link?: string;
  created_at: string;
}

export function loadLocalSubmissions(): NewSubmission[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); }
  catch { return []; }
}

export function saveLocalSubmission(s: NewSubmission): void {
  const existing = loadLocalSubmissions();
  const merged = [s, ...existing.filter((x) => x.id !== s.id)].slice(0, 60);
  localStorage.setItem(LS_KEY, JSON.stringify(merged));
}
