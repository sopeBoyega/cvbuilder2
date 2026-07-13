/**
 * Client-safe quota message + matcher. Lives apart from `lib/ai/usage.ts`
 * (which imports the DB and can't be bundled client-side) so components can
 * recognize a quota failure in the error string a server action returns and
 * show an upgrade prompt instead of a dead-end error.
 */
export const QUOTA_ERROR_MESSAGE =
  "You've reached today's AI limit. It resets in 24 hours.";

export function isQuotaError(message: string): boolean {
  return message === QUOTA_ERROR_MESSAGE;
}
