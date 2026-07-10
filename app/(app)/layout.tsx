"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  Bell,
  Briefcase,
  FileText,
  FolderCheck,
  HelpCircle,
  Home,
  LineChart,
  LogOut,
  Plus,
  Settings,
  Sparkles,
  User,
} from "lucide-react";

import { Logo } from "@/components/shell/logo";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

const SIDEBAR_NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { href: "/applications", label: "Jobs", icon: Briefcase },
  { href: "/insights", label: "Analytics", icon: LineChart },
] as const;

const TOP_NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tailor", label: "Tailor" },
  { href: "/applications", label: "History" },
] as const;

const MOBILE_NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/tailor", label: "Tailor", icon: Sparkles },
  { href: "/resumes", label: "Vault", icon: FolderCheck },
  { href: "/settings/profile", label: "Profile", icon: User },
] as const;

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();

  async function handleSignOut() {
    await signOut({ redirectUrl: "/sign-in" });
    router.push("/sign-in");
  }

  return (
    <div className="min-h-dvh bg-background text-on-background">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-50 hidden h-dvh w-64 flex-col border-r border-border bg-surface-container-low py-6 md:flex">
        <div className="mb-10 px-4">
          <div className="flex items-center gap-2">
            <Logo className="size-6" />
            <h1 className="font-heading text-2xl font-bold tracking-tight text-primary">
              {BRAND.name}
            </h1>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant/70">
            {BRAND.tagline}
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {SIDEBAR_NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 rounded-lg px-4 py-3 text-sm transition-all",
                  active
                    ? "translate-x-1 border-r-2 border-primary bg-primary-container/10 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mb-6 px-3">
          <Link
            href="/tailor"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-bold text-on-primary transition-all hover:opacity-90 active:scale-95"
          >
            <Plus className="size-5" />
            Create New CV
          </Link>
        </div>

        <div className="space-y-1 border-t border-border px-3 pt-6">
          <button
            type="button"
            className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-sm text-on-surface-variant transition-all hover:bg-surface-container-high"
          >
            <HelpCircle className="size-5" />
            Support
          </button>
          <Link
            href="/settings/profile"
            className="flex items-center gap-4 rounded-lg px-4 py-3 text-sm text-on-surface-variant transition-all hover:bg-surface-container-high"
          >
            <Settings className="size-5" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="md:ml-64">
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-background px-4 md:px-8">
          <div className="flex items-center gap-10">
            <span className="font-heading text-2xl font-bold tracking-tight text-primary md:hidden">
              CVB
            </span>
            <nav className="hidden gap-6 lg:flex">
              {TOP_NAV.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "pb-1 text-[18px] font-semibold leading-[1.3] transition-colors",
                      active
                        ? "border-b-2 border-primary text-primary"
                        : "text-on-surface-variant hover:text-primary",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="p-1 text-on-surface-variant transition-all hover:text-primary"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
            </button>
            <Link
              href="/settings/profile"
              className="p-1 text-on-surface-variant transition-all hover:text-primary"
              aria-label="Settings"
            >
              <Settings className="size-5" />
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out (temp)"
              className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-border bg-surface-raised text-on-surface-variant transition-colors hover:border-destructive hover:text-destructive"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>

        <main className="pb-24 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl border-t border-border bg-surface/90 px-4 py-3 shadow-lg backdrop-blur-md md:hidden">
        {MOBILE_NAV.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-xs transition-opacity",
                active
                  ? "text-primary"
                  : "text-on-surface-variant opacity-60 hover:opacity-100",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
