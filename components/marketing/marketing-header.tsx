import Link from "next/link";

import { Logo } from "@/components/shell/logo";
import { BRAND } from "@/lib/brand";

/** Shared top bar for the public marketing pages. */
export function MarketingHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="size-6" />
          <span className="font-heading text-lg font-semibold tracking-tight text-primary">
            {BRAND.name}
          </span>
        </Link>
        <Link
          href="/sign-up"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-all hover:brightness-110"
        >
          Sign up free
        </Link>
      </div>
    </header>
  );
}
