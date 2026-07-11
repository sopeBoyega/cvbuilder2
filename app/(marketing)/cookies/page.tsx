import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";

import { PolicyPage } from "@/components/marketing/policy-page";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `Cookie Policy | ${BRAND.name}`,
  description: `How ${BRAND.name} uses cookies and similar technologies.`,
};

const content = readFileSync(
  join(process.cwd(), "content/legal/cookies.md"),
  "utf8",
);

export default function CookiesPage() {
  return <PolicyPage content={content} />;
}
