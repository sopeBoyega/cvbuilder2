"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

const MESSAGE_INTERVAL_MS = 2500;

/**
 * Loader for AI-backed waits: a "constellation" thread of glowing nodes with a
 * cycling status line. Messages should name the real work happening server-side
 * (they're presentational — the steps aren't reported back), so keep them
 * honest to what the action actually does.
 */
export function AiLoader({
  title,
  messages,
  className,
}: {
  title: string;
  /** Status lines to cycle through; a single entry is shown statically. */
  messages: string[];
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (messages.length < 2) return;
    const interval = setInterval(() => {
      // Fade out, swap the message, fade back in.
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % messages.length);
        setVisible(true);
      }, 300);
    }, MESSAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div
      role="status"
      className={cn("flex flex-col items-center py-16 md:py-24", className)}
    >
      {/* Constellation thread */}
      <div className="relative mb-8 flex h-40 w-full justify-center">
        <div className="ai-loader-thread absolute inset-y-0 w-px" />
        <div className="ai-loader-node absolute top-3 size-3 -translate-x-1/2 rounded-full border border-[var(--border-strong)]" />
        <div
          className="ai-loader-node absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--border-strong)]"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="ai-loader-node absolute bottom-3 size-3 -translate-x-1/2 rounded-full border border-[var(--border-strong)]"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute left-1/2 top-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-hi/5 blur-xl" />
      </div>

      <h2 className="font-heading text-[30px] font-bold leading-[1.15] tracking-tight text-on-background md:text-[40px]">
        {title}
      </h2>
      <div className="mt-4 flex items-center gap-3">
        <RefreshCw className="size-4 animate-spin text-indigo-hi" />
        <p
          className={cn(
            "font-mono text-sm uppercase tracking-widest text-indigo-hi transition-opacity duration-300",
            visible ? "opacity-100" : "opacity-0",
          )}
        >
          {messages[index]}
        </p>
      </div>
    </div>
  );
}
