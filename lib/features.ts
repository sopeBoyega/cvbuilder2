/**
 * Build-time feature flags. Deliberately plain constants, not env vars:
 * `NEXT_PUBLIC_*` is inlined at build time anyway, so an env var would still
 * need a redeploy to flip — without the compile-time visibility of a constant.
 */

/**
 * Google / LinkedIn sign-in buttons on the auth pages.
 *
 * OFF since 2026-07-28. A Clerk **production** instance needs your own OAuth
 * credentials (the dev instance borrows Clerk's shared ones), and Google Cloud
 * verification was blocking the production cutover. Email + password needs no
 * Google Cloud involvement at all, so social login is parked rather than
 * letting it hold up launch.
 *
 * Nothing is deleted: `handleOAuth`, the `/sso-callback` route, and the icon
 * components all stay wired. To re-enable, flip this to `true` after adding
 * your Google/LinkedIn credentials in the Clerk dashboard's SSO connections.
 */
export const SOCIAL_AUTH_ENABLED: boolean = false;
