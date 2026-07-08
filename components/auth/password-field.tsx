"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

export function PasswordField({
  id,
  className,
  icon,
  inputClassName,
  ...props
}: React.ComponentProps<"input"> & {
  icon?: ReactNode;
  inputClassName?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("relative", className)}>
      {icon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-on-surface-variant/50">
          {icon}
        </span>
      ) : null}
      <input
        id={id}
        type={visible ? "text" : "password"}
        className={cn(
          "w-full rounded-[8px] border border-border bg-surface-raised px-4 py-3 pr-11 text-sm text-on-surface placeholder:text-on-surface-variant/50 transition-all outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/60",
          icon && "pl-10",
          inputClassName,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-on-surface-variant transition-colors hover:text-primary"
      >
        {visible ? (
          <Eye className="size-[18px]" />
        ) : (
          <EyeOff className="size-[18px]" />
        )}
      </button>
    </div>
  );
}
