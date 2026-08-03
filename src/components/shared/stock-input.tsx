"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { suggestDenominations, type StockRow } from "@/lib/cash-math";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

interface StockInputProps {
  rows: StockRow[];
  quantities: Record<string, number>;
  onChange: (denominationId: string, quantity: number) => void;
  showStock?: boolean;
  suggestTarget?: number;
  disabled?: boolean;
}

export function StockInput({
  rows,
  quantities,
  onChange,
  showStock,
  suggestTarget,
  disabled,
}: StockInputProps) {
  const total = rows.reduce((sum, row) => {
    return sum + row.value * (quantities[row.denominationId] ?? 0);
  }, 0);

  const applySuggestion = () => {
    if (suggestTarget == null || suggestTarget <= 0) return;
    const result = suggestDenominations(rows, suggestTarget);
    if (result.remaining > 0) {
      toast(`Stok tidak cukup: kurang ${formatNumber(result.remaining)}`, "error");
    }
    const next: Record<string, number> = {};
    for (const item of result.items) {
      next[item.denominationId] = item.quantity;
    }
    setAll(next);
  };

  const setAll = (next: Record<string, number>) => {
    for (const row of rows) {
      onChange(row.denominationId, next[row.denominationId] ?? 0);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg ring-1 ring-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Rincian Pecahan
        </p>
        {suggestTarget != null && suggestTarget > 0 && (
          <button
            type="button"
            onClick={applySuggestion}
            className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
          >
            <Sparkles className="h-3 w-3" />
            Isi Otomatis
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">Pecahan</th>
              {showStock && <th className="px-3 py-2 text-right">Stok</th>}
              <th className="px-3 py-2 text-right">Jumlah</th>
              <th className="px-3 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const qty = quantities[row.denominationId] ?? 0;
              const overStock = showStock && qty > row.quantity;
              return (
                <tr key={row.denominationId}>
                  <td className="px-3 py-1.5 font-medium text-slate-800">
                    Rp {formatNumber(row.value)}
                    <span className="ml-1.5 text-[11px] uppercase text-slate-400">
                      {row.type === "lembar" ? "lembar" : "koin"}
                    </span>
                  </td>
                  {showStock && (
                    <td
                      className={cn(
                        "px-3 py-1.5 text-right",
                        overStock ? "font-semibold text-red-600" : "text-slate-500"
                      )}
                    >
                      {formatNumber(row.quantity)}
                    </td>
                  )}
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      min={0}
                      disabled={disabled}
                      placeholder="0"
                      value={qty === 0 ? "" : qty}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        onChange(row.denominationId, Number.isNaN(v) || v < 0 ? 0 : v);
                      }}
                      className={cn(
                        "h-8 w-20 rounded-md px-2 text-right text-sm text-slate-900 ring-1 ring-inset ring-slate-300",
                        "focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:bg-slate-50",
                        overStock && "bg-red-50 text-red-700 ring-red-400"
                      )}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium text-slate-800">
                    {qty > 0 ? `Rp ${formatNumber(qty * row.value)}` : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-100 bg-slate-50">
              <td colSpan={showStock ? 3 : 2} className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">
                Total
              </td>
              <td className="px-3 py-2 text-right text-sm font-bold text-slate-900">
                Rp {formatNumber(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
