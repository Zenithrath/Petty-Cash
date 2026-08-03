import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-lg bg-white px-3 py-2 text-sm text-slate-900",
        "ring-1 ring-inset ring-slate-300 placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-orange-600",
        "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
