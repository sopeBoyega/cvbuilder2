"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CreditCard,
  Unplug,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/*
 * The settings sub-tab rail from the design: vertical list beside the content
 * on desktop, horizontally scrollable pills on mobile. Active tab follows the
 * URL, so each tab stays a real route (deep-linkable, own loading states).
 */

const TABS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Profile", href: "/settings/profile", icon: UserRound },
  { label: "Billing", href: "/settings/billing", icon: CreditCard },
  { label: "Integrations", href: "/settings/integrations", icon: Unplug },
  { label: "Notifications", href: "/settings/notifications", icon: Bell },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings sections"
      className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0"
    >
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
              active
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
