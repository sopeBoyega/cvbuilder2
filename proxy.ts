import { NextResponse, type NextRequest } from "next/server";

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

export function proxy(request: NextRequest) {
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
