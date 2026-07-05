import { supabase } from '../lib/supabase';
import { redactSensitiveParams } from './markdownLinks';

export interface ValidationResult {
  url: string;
  reachable: boolean;
  status: number | null;
  error?: string;
  corsBlocked?: boolean;
}

const MAX_CONCURRENCY = 3;
const BASE_DELAY_MS = 500;
const MAX_RETRIES = 2;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function validateSingleUrl(url: string): Promise<ValidationResult> {
  const redacted = redactSensitiveParams(url);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
    }

    try {
      const { data, error } = await supabase.functions.invoke('validate-link', {
        body: { url },
      });

      if (error) {
        if (attempt === MAX_RETRIES) {
          return { url: redacted, reachable: false, status: null, error: error.message };
        }
        continue;
      }

      return {
        url: redacted,
        reachable: data?.reachable ?? false,
        status: data?.status ?? null,
        error: data?.error,
        corsBlocked: data?.corsBlocked ?? false,
      };
    } catch (e: any) {
      if (attempt === MAX_RETRIES) {
        return { url: redacted, reachable: false, status: null, error: e?.message ?? 'Network error' };
      }
    }
  }

  return { url: redacted, reachable: false, status: null, error: 'Max retries exceeded' };
}

export async function validateBatch(
  urls: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, ValidationResult>> {
  const results = new Map<string, ValidationResult>();
  const queue = [...urls];
  let completed = 0;

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) break;
      const result = await validateSingleUrl(url);
      results.set(url, result);
      completed++;
      onProgress?.(completed, urls.length);
    }
  }

  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENCY, urls.length) },
    () => worker()
  );

  await Promise.all(workers);
  return results;
}

export async function validateSingle(url: string): Promise<ValidationResult> {
  return validateSingleUrl(url);
}
