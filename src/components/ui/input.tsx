import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-lg bg-white px-3 text-sm text-slate-900",
        "ring-1 ring-inset ring-slate-300 placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-orange-600",
        "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
