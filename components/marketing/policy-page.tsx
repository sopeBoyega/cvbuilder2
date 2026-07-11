import { MarkdownDoc } from "@/components/marketing/markdown-doc";
import { MarketingHeader } from "@/components/marketing/marketing-header";

/** Chrome + article wrapper for a markdown-rendered legal/policy document. */
export function PolicyPage({ content }: { content: string }) {
  return (
    <main className="min-h-dvh bg-background text-on-background">
      <MarketingHeader />
      <article className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <MarkdownDoc content={content} />
      </article>
    </main>
  );
}
