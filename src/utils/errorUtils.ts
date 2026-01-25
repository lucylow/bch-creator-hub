/**
 * Shared error handling utilities for consistent messages and normalization
 */

/** Known error messages we treat as user-friendly as-is */
const USER_FRIENDLY_PATTERNS = [
  /authentication expired/i,
  /invalid.*address/i,
  /insufficient balance/i,
  /user (denied|rejected|cancelled)/i,
  /network (request failed|error)/i,
  /failed to fetch/i,
  /load failed/i,
];

/**
 * Normalize unknown thrown values to an Error instance
 */
export function normalizeError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === 'string') return new Error(err);
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return new Error((err as { message: string }).message);
  }
  return new Error(String(err ?? 'An unexpected error occurred'));
}

/**
 * Return a short, user-facing message for toasts/UI. Avoids exposing stack traces or raw "Failed to fetch".
 */
export function getUserFriendlyMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const error = normalizeError(err);
  const msg = error.message.trim();
  if (!msg) return fallback;
  const isUserFriendly = USER_FRIENDLY_PATTERNS.some((p) => p.test(msg));
  if (isUserFriendly) return msg;
  // Map common low-level errors to clearer text
  if (/failed to fetch|network request failed|load failed|networkerror/i.test(msg)) {
    return 'Network error. Check your connection and try again.';
  }
  if (/timeout|timed out/i.test(msg)) return 'Request timed out. Please try again.';
  if (/aborted/i.test(msg)) return 'Request was cancelled.';
  if (/500|internal server error/i.test(msg)) return 'Server error. Please try again later.';
  if (/502|503|504/i.test(msg)) return 'Service temporarily unavailable. Please try again later.';
  if (/403|forbidden/i.test(msg)) return "You don't have permission to do this.";
  if (/404/i.test(msg)) return 'The requested resource was not found.';
  // For other unknown errors, prefer a generic message in production-style UX
  return fallback;
}

/**
 * Check if an error is a network failure (no response from server)
 */
export function isNetworkError(err: unknown): boolean {
  const message = normalizeError(err).message.toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('network request failed') ||
    message.includes('networkerror') ||
    message.includes('load failed') ||
    message.includes('network error')
  );
}

/**
 * Check if an error indicates auth should be cleared (e.g. 401 / "Authentication expired")
 */
export function isAuthError(err: unknown): boolean {
  const message = normalizeError(err).message;
  return /authentication expired|401|unauthorized/i.test(message);
}
