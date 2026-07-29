import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const protectedPrefixes = [
  "/applications",
  "/cover-letters",
  "/dashboard",
  "/discover",
  "/insights",
  "/interview-prep",
  "/onboarding",
  "/resumes",
  "/settings",
  "/tailor",
  "/templates",
];

const isProtectedRoute = createRouteMatcher(
  protectedPrefixes.map((prefix) => `${prefix}(.*)`),
);

/**
 * API routes are default-protected (security review F8): a new route is
 * private unless listed here. Every entry must gate itself another way —
 * this allowlist is the only place a route becomes public.
 */
const isPublicApi = createRouteMatcher([
  "/api/webhooks(.*)", // signature-verified per provider (Clerk/Paystack)
  "/api/cron(.*)", // CRON_SECRET bearer check in-route; Vercel cron has no session
  "/api/og(.*)", // public OG images for share links; params clamped in-route
  "/api/templates(.*)", // sample-data template previews, deliberately public
  "/api/inngest(.*)", // Inngest request signing covers this when wired (Phase 3)
]);
const isApi = createRouteMatcher(["/api(.*)"]);

export const proxy = clerkMiddleware(async (auth, request) => {
  if (isApi(request)) {
    // Defense in depth: routes still call auth() + check ownership themselves.
    if (!isPublicApi(request)) await auth.protect();
    return;
  }
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
