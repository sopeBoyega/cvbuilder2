import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const protectedPrefixes = [
  "/applications",
  "/cover-letters",
  "/dashboard",
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

export const proxy = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
