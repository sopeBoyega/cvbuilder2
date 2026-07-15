"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  Bell,
  Briefcase,
  FileText,
  HelpCircle,
  Home,
  LayoutTemplate,
  LineChart,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
} from "lucide-react";

import { Logo } from "@/components/shell/logo";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/*
 * One nav list drives both the desktop sidebar and the mobile bottom tabs, so
 * their names and icons can never drift apart again.
 */
const APP_NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/applications", label: "Jobs", icon: Briefcase },
  { href: "/insights", label: "Analytics", icon: LineChart },
] as const;

const TOP_NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tailor", label: "Tailor" },
  { href: "/applications", label: "History" },
] as const;

/*
 * Sidebar collapse, remembered across visits. `useSyncExternalStore` (same
 * pattern as the wizard store) reads localStorage post-hydration without the
 * setState-in-effect cascade: the server snapshot is always "expanded", and
 * the client snapshot takes over after mount.
 */
const SIDEBAR_COLLAPSED_KEY = "cvb.sidebar.collapsed";

let sidebarListeners: (() => void)[] = [];

function readCollapsed(): boolean {
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
}

function subscribeCollapsed(listener: () => void): () => void {
  sidebarListeners.push(listener);
  return () => {
    sidebarListeners = sidebarListeners.filter((l) => l !== listener);
  };
}

function writeCollapsed(value: boolean): void {
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, value ? "1" : "0");
  for (const listener of sidebarListeners) listener();
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    () => false,
  );

  function toggleSidebar() {
    writeCollapsed(!collapsed);
  }

  async function handleSignOut() {
    await signOut({ redirectUrl: "/sign-in" });
    router.push("/sign-in");
  }

  return (
    <div className="min-h-dvh bg-background text-on-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 hidden h-dvh flex-col border-r border-border bg-surface-container-low py-6 transition-[width] duration-200 md:flex",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div className={cn("mb-6", collapsed ? "px-0 text-center" : "px-4")}>
          <div
            className={cn(
              "flex items-center gap-2",
              collapsed && "justify-center",
            )}
          >
            <Logo className="size-6 shrink-0" />
            {!collapsed && (
              <h1 className="font-heading text-2xl font-bold tracking-tight text-primary">
                {BRAND.name}
              </h1>
            )}
          </div>
          {!collapsed && (
            <p className="mt-1 text-xs text-on-surface-variant/70">
              {BRAND.tagline}
            </p>
          )}
        </div>

        <div className={cn("mb-4", collapsed ? "px-3" : "px-3")}>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center gap-4 rounded-lg px-4 py-2 text-sm text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5" />
            ) : (
              <>
                <PanelLeftClose className="size-5" />
                Collapse
              </>
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {APP_NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-4 rounded-lg px-4 py-3 text-sm transition-all",
                  collapsed && "justify-center px-0",
                  active
                    ? cn(
                        "border-r-2 border-primary bg-primary-container/10 text-primary",
                        !collapsed && "translate-x-1",
                      )
                    : "text-on-surface-variant hover:bg-surface-container-high",
                )}
              >
                <item.icon className="size-5 shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mb-6 px-3">
          <Link
            href="/tailor"
            title={collapsed ? "Create New CV" : undefined}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-bold text-on-primary transition-all hover:opacity-90 active:scale-95"
          >
            <Plus className="size-5 shrink-0" />
            {!collapsed && "Create New CV"}
          </Link>
        </div>

        <div className="space-y-1 border-t border-border px-3 pt-6">
          <Link
            href="/support"
            title={collapsed ? "Support" : undefined}
            className={cn(
              "flex w-full items-center gap-4 rounded-lg px-4 py-3 text-sm text-on-surface-variant transition-all hover:bg-surface-container-high",
              collapsed && "justify-center px-0",
            )}
          >
            <HelpCircle className="size-5 shrink-0" />
            {!collapsed && "Support"}
          </Link>
          <Link
            href="/settings/profile"
            title={collapsed ? "Settings" : undefined}
            className={cn(
              "flex items-center gap-4 rounded-lg px-4 py-3 text-sm text-on-surface-variant transition-all hover:bg-surface-container-high",
              collapsed && "justify-center px-0",
            )}
          >
            <Settings className="size-5 shrink-0" />
            {!collapsed && "Settings"}
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className={cn(collapsed ? "md:ml-20" : "md:ml-64")}>
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

      {/* Mobile bottom nav — same items and icons as the sidebar */}
      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl border-t border-border bg-surface/90 px-2 py-3 shadow-lg backdrop-blur-md md:hidden">
        {APP_NAV.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[10px] transition-opacity",
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
