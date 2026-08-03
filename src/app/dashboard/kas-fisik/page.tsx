"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { StockInput } from "@/components/shared/stock-input";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/components/ui/toast";
import {
  DENOMINATIONS,
  getLedger,
  getStock,
  getStockValue,
  updateKasFisik,
  useStore,
} from "@/lib/store";
import { toStockRows } from "@/lib/cash-math";
import { formatNumber, formatRupiah } from "@/lib/utils";

export default function KasFisikPage() {
  const state = useStore((s) => s);
  const ledger = getLedger(state);
  const stock = getStock(state);
  const stockValue = getStockValue(state);

  const stockRows = React.useMemo(() => {
    const active = DENOMINATIONS.filter((d) => d.isActive);
    return toStockRows(
      active,
      active.map((d) => ({ denominationId: d.id, quantity: stock.get(d.id) ?? 0 }))
    );
  }, [state]);

  const [draft, setDraft] = React.useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const r of stockRows) init[r.denominationId] = r.quantity;
    return init;
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const init: Record<string, number> = {};
    for (const r of stockRows) init[r.denominationId] = r.quantity;
    setDraft(init);
  }, [state]);

  const handleChange = (id: string, qty: number) => {
    setDraft((prev) => ({ ...prev, [id]: qty }));
  };

  const saveDraft = async () => {
    setSaving(true);
    const result = await updateKasFisik(draft);
    setSaving(false);
    if (!result.ok) {
      toast(result.error ?? "Gagal menyimpan kas fisik", "error");
      return;
    }
    toast("Kas fisik diperbarui");
  };

  const totalQty = Object.values(draft).reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Kas Fisik" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Nilai Kas Fisik"
          value={formatRupiah(stockValue)}
          subtitle="Hitung dari pecahan di bawah"
        />
        <StatCard
          title="Saldo Buku"
          value={formatRupiah(ledger.balance)}
          subtitle="Saldo dari pencatatan"
        />
        <StatCard
          title="Total Lembar / Koin"
          value={formatNumber(totalQty)}
        />
      </div>

      {stockValue !== ledger.balance && (
        <div className="rounded-xl bg-amber-50 px-5 py-3.5 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
          Selisih: <strong>{formatRupiah(stockValue - ledger.balance)}</strong>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pecahan Uang di Kas</CardTitle>
        </CardHeader>
        <CardContent>
          {stockRows.length === 0 ? (
            <EmptyState
              title="Kas kosong"
              description="Belum ada uang di dalam kas."
            />
          ) : (
            <StockInput
              rows={stockRows}
              quantities={draft}
              onChange={handleChange}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={saveDraft}
          disabled={saving}
          className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </div>
  );
}
