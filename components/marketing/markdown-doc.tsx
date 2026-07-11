import type { ComponentPropsWithoutRef, ElementType } from "react";
import Markdown, { type Components, type ExtraProps } from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

/**
 * Renders a long markdown document (the legal policies) with GFM tables and
 * heading ids so the in-document table-of-contents anchors work.
 */

type StyledTag =
  | "h1"
  | "h2"
  | "h3"
  | "p"
  | "ul"
  | "ol"
  | "li"
  | "a"
  | "strong"
  | "em"
  | "hr"
  | "blockquote"
  | "thead"
  | "th"
  | "td";

/** Builds a styled element renderer that drops react-markdown's `node` prop. */
function styled<T extends StyledTag>(tag: T, className: string) {
  function Styled({ node, ...props }: ComponentPropsWithoutRef<T> & ExtraProps) {
    void node; // not a valid DOM attribute — strip it
    const Tag = tag as ElementType;
    return <Tag className={className} {...props} />;
  }
  Styled.displayName = `md-${tag}`;
  return Styled;
}

const components: Components = {
  h1: styled(
    "h1",
    "font-heading text-[28px] font-bold leading-tight text-on-surface md:text-[36px]",
  ),
  h2: styled(
    "h2",
    "mt-12 scroll-mt-24 font-heading text-xl font-semibold text-on-surface",
  ),
  h3: styled("h3", "mt-8 scroll-mt-24 text-base font-semibold text-on-surface"),
  p: styled("p", "my-4 text-sm leading-7 text-on-surface-variant"),
  ul: styled(
    "ul",
    "my-4 list-disc space-y-2 pl-6 text-sm leading-7 text-on-surface-variant",
  ),
  ol: styled(
    "ol",
    "my-4 list-decimal space-y-2 pl-6 text-sm leading-7 text-on-surface-variant",
  ),
  li: styled("li", "pl-1"),
  a: styled(
    "a",
    "text-primary underline underline-offset-2 transition-colors hover:text-primary-fixed",
  ),
  strong: styled("strong", "font-semibold text-on-surface"),
  em: styled("em", "italic"),
  hr: styled("hr", "my-10 border-border"),
  blockquote: styled(
    "blockquote",
    "my-4 border-l-2 border-primary/40 pl-4 italic text-on-surface-variant",
  ),
  thead: styled("thead", "bg-surface-container"),
  th: styled(
    "th",
    "border border-border px-3 py-2 text-left align-top font-semibold text-on-surface",
  ),
  td: styled(
    "td",
    "border border-border px-3 py-2 align-top text-on-surface-variant",
  ),
  table: ({ node, ...props }: ComponentPropsWithoutRef<"table"> & ExtraProps) => {
    void node;
    return (
      <div className="my-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm" {...props} />
      </div>
    );
  },
};

export function MarkdownDoc({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug]}
      components={components}
    >
      {content}
    </Markdown>
  );
}
