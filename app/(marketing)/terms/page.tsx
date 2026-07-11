import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";

import { PolicyPage } from "@/components/marketing/policy-page";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `Terms of Service | ${BRAND.name}`,
  description: `The terms that govern your use of ${BRAND.name}.`,
};

const content = readFileSync(
  join(process.cwd(), "content/legal/terms.md"),
  "utf8",
);

export default function TermsPage() {
  return <PolicyPage content={content} />;
}
