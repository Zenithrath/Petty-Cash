import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  htmlFor,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "block text-xs font-medium text-slate-700 mb-1.5",
        className
      )}
      {...props}
    />
  );
}
