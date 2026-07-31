/**
 * Build-time feature flags. Deliberately plain constants, not env vars:
 * `NEXT_PUBLIC_*` is inlined at build time anyway, so an env var would still
 * need a redeploy to flip — without the compile-time visibility of a constant.
 */

/**
 * Google / LinkedIn sign-in buttons on the auth pages, gated independently:
 * each provider needs its own OAuth credentials added to Clerk's production
 * instance (Dashboard → Configure → SSO Connections) before its button is
 * safe to show — flipping one on before that step lets a user click a button
 * that errors on click.
 *
 * Both were OFF since 2026-07-28 (Clerk **production** needs your own OAuth
 * credentials; the dev instance borrows Clerk's shared ones, and Google Cloud
 * verification was blocking the cutover). Nothing is deleted either way:
 * `handleOAuth`, the `/sso-callback` route, and the icon components all stay
 * wired regardless of these flags.
 */
/** ON since 2026-07-31: Google Cloud verification approved, credentials added to Clerk production. */
export const GOOGLE_AUTH_ENABLED: boolean = false;
/** LinkedIn hasn't been through Clerk SSO setup yet — separate from Google's approval. */
export const LINKEDIN_AUTH_ENABLED: boolean = false;
