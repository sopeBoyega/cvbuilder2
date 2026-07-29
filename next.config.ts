import type { NextConfig } from "next";

/**
 * Static security headers (security review F4). CSP is deliberately absent
 * for now: a strict policy needs the Clerk/PostHog/Vercel endpoints
 * enumerated from real browser traffic and a report-only rollout first —
 * shipping a guessed CSP breaks auth/analytics silently. Everything below is
 * safe to enforce immediately.
 */
const securityHeaders = [
  // No MIME sniffing — uploads/exports must be treated as their declared type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // The signed-in app has no legitimate embedding use; block clickjacking.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Vercel already sets HSTS on *.vercel.app; set it explicitly so the custom
  // domain doesn't depend on platform defaults.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  // None of these device APIs are used anywhere in the app.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
