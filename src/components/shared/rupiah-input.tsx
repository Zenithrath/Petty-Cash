"use client";

import * as React from "react";
import { cn, formatNumber } from "@/lib/utils";

interface RupiahInputProps {
  value: number;
  onChange: (value: number) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function RupiahInput({
  value,
  onChange,
  id,
  placeholder = "0",
  disabled,
  className,
  autoFocus,
}: RupiahInputProps) {
  const [display, setDisplay] = React.useState(() =>
    value > 0 ? formatNumber(value) : ""
  );
  const focused = React.useRef(false);

  React.useEffect(() => {
    if (!focused.current) {
      setDisplay(value > 0 ? formatNumber(value) : "");
    }
  }, [value]);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
        Rp
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onFocus={(e) => {
          focused.current = true;
          e.target.select();
        }}
        onBlur={() => {
          focused.current = false;
          setDisplay(value > 0 ? formatNumber(value) : "");
        }}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, "").slice(0, 14);
          const num = raw ? parseInt(raw, 10) : 0;
          if (focused.current) {
            setDisplay(raw);
          }
          onChange(num);
        }}
        className={cn(
          "h-9 w-full rounded-lg bg-white pl-9 pr-3 text-sm text-slate-900",
          "ring-1 ring-inset ring-slate-300 placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-orange-600",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
          className
        )}
      />
    </div>
  );
}
