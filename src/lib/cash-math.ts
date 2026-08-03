import type { Denomination } from "@/types";

export interface StockRow {
  denominationId: string;
  value: number;
  quantity: number;
}

export interface SuggestionResult {
  items: { denominationId: string; value: number; quantity: number }[];
  remaining: number;
}

export function toStockRows(
  denominations: Denomination[],
  stock: { denominationId: string; quantity: number }[]
): StockRow[] {
  const stockByDenom = new Map(stock.map((s) => [s.denominationId, s.quantity]));
  return denominations
    .filter((d) => d.isActive)
    .map((d) => ({
      denominationId: d.id,
      value: Number(d.value),
      quantity: stockByDenom.get(d.id) ?? 0,
    }))
    .sort((a, b) => b.value - a.value);
}

export function suggestDenominations(
  stock: StockRow[],
  target: number
): SuggestionResult {
  const rows = stock
    .filter((r) => r.quantity > 0 && r.value > 0)
    .sort((a, b) => b.value - a.value);

  const items: SuggestionResult["items"] = [];
  let remaining = target;

  for (const row of rows) {
    if (remaining <= 0) break;
    const take = Math.min(Math.floor(remaining / row.value), row.quantity);
    if (take > 0) {
      items.push({ denominationId: row.denominationId, value: row.value, quantity: take });
      remaining -= take * row.value;
    }
  }

  return { items, remaining };
}

export function totalValue(
  quantities: Record<string, number>,
  stock: StockRow[]
): number {
  const valueByDenom = new Map(stock.map((r) => [r.denominationId, r.value]));
  return Object.entries(quantities).reduce((sum, [denomId, qty]) => {
    return sum + (valueByDenom.get(denomId) ?? 0) * qty;
  }, 0);
}
