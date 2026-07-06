import zxcvbn from 'zxcvbn';

export interface StrengthResult {
  score: number;
  feedback: string;
  crackTime: string;
}

export function checkPasswordStrength(password: string): StrengthResult {
  if (!password) return { score: 0, feedback: '', crackTime: '' };
  const result = zxcvbn(password);
  const feedback =
    result.feedback.warning ||
    result.feedback.suggestions[0] ||
    '';
  return {
    score: result.score,
    feedback,
    crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second as string,
  };
}

async function sha1(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export async function checkBreachedPassword(password: string): Promise<boolean> {
  try {
    const hash = await sha1(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    });

    if (!response.ok) return false;

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix] = line.split(':');
      if (hashSuffix.trim() === suffix) return true;
    }

    return false;
  } catch {
    return false;
  }
}
