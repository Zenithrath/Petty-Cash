"use client";

import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  subLabel?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "— pilih —",
  emptyText = "Tidak ada pilihan",
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlighted, setHighlighted] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.subLabel ?? "").toLowerCase().includes(q)
    );
  }, [options, query]);

  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const select = (option: ComboboxOption) => {
    onChange(option.value);
    setQuery("");
    setOpen(false);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered[highlighted]) {
        select(filtered[highlighted]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={open ? query : (selected?.label ?? "")}
          placeholder={selected ? selected.label : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlighted(0);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
            setHighlighted(0);
          }}
          onKeyDown={onKeyDown}
          className={cn(
            "h-9 w-full rounded-lg bg-white pl-9 pr-9 text-sm text-slate-900",
            "ring-1 ring-inset ring-slate-300 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-orange-600",
            "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          )}
        />
        {selected && !disabled && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-7 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
            aria-label="Hapus pilihan"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400",
            selected && "right-2"
          )}
        />
      </div>

      {open && !disabled && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400">{emptyText}</li>
          ) : (
            filtered.map((option, i) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => select(option)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm",
                    i === highlighted
                      ? "bg-orange-50 text-orange-800"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.subLabel && (
                      <span className="truncate text-xs text-slate-400">{option.subLabel}</span>
                    )}
                  </span>
                  {option.value === value && (
                    <Check className="h-4 w-4 shrink-0 text-orange-600" />
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
