import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";

import { PolicyPage } from "@/components/marketing/policy-page";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `Privacy Policy | ${BRAND.name}`,
  description: `How ${BRAND.name} collects, uses, and protects your data.`,
};

// Read at build time (this page is static) so the markdown file is the source
// of truth and edits don't require touching the component.
const content = readFileSync(
  join(process.cwd(), "content/legal/privacy.md"),
  "utf8",
);

export default function PrivacyPage() {
  return <PolicyPage content={content} />;
}
