const AUTH_ERROR_PATTERNS = [
  'jwt expired',
  'invalid claim',
  'not authenticated',
  'invalid token',
  'token is expired',
  'session_not_found',
  'refresh_token_not_found',
];

export function isAuthError(error: unknown): boolean {
  if (!error) return false;

  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    if (e.status === 401 || e.code === '401' || e.code === 'PGRST301') return true;
    const msg = String(e.message ?? e.error_description ?? e.msg ?? '').toLowerCase();
    if (AUTH_ERROR_PATTERNS.some((p) => msg.includes(p))) return true;
  }

  if (typeof error === 'string') {
    const lower = error.toLowerCase();
    if (AUTH_ERROR_PATTERNS.some((p) => lower.includes(p))) return true;
  }

  return false;
}

export function handleSupabaseError(error: unknown): string {
  if (isAuthError(error)) {
    return 'Your session has expired. Please refresh the page to sign in again.';
  }

  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    if (typeof e.message === 'string' && e.message.length > 0) return e.message;
    if (typeof e.error_description === 'string') return e.error_description;
  }

  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  return 'An unexpected error occurred. Please try again.';
}
