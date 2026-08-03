"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Download, Paperclip, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { StatCard } from "@/components/dashboard/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/components/ui/toast";
import {
  addInflow,
  addOutflow,
  DENOMINATIONS,
  getEmployee,
  getKategoriUtama,
  getLedger,
  getStock,
  getSubKategori,
  trxCodeOfSub,
  updateInflowEvidence,
  updateOutflowEvidence,
  useStore,
} from "@/lib/store";
import { toStockRows, type StockRow } from "@/lib/cash-math";
import type { ListExcelRow } from "@/lib/export-excel";
import { cn, formatDate, formatRupiah, todayIso } from "@/lib/utils";
import type { Attachment, CashInflow, CashOutflow } from "@/types";

const Combobox = dynamic(() => import("@/components/shared/combobox").then((mod) => mod.Combobox));
const RupiahInput = dynamic(() => import("@/components/shared/rupiah-input").then((mod) => mod.RupiahInput));
const StockInput = dynamic(() => import("@/components/shared/stock-input").then((mod) => mod.StockInput));
const AttachmentInput = dynamic(() => import("@/components/shared/attachment-input").then((mod) => mod.AttachmentInput));

type Direction = "keluar" | "masuk";
type Tab = "semua" | "keluar" | "masuk";

const ROWS_PER_PAGE = 20;

interface DisplayRow {
  key: string;
  kind: "in" | "out";
  no: number;
  tanggal: string;
  deskripsi: string;
  noKwitansi: string;
  jenis: string;
  subJenis: string;
  kodeTrx: string;
  namaAnggota: string;
  nominal: number;
  attachment: Attachment | null;
  inflow: CashInflow | null;
  outflow: CashOutflow | null;
}

export default function ListPencatatanPage() {
  const state = useStore((s) => s);
  const ledger = getLedger(state);

  // ---------- Form state ----------
  const [formDirection, setFormDirection] = React.useState<Direction | null>(null);
  const [kategoriUtamaId, setKategoriUtamaId] = React.useState("");
  const [subKategoriId, setSubKategoriId] = React.useState("");
  const [employeeId, setEmployeeId] = React.useState("");
  const [nominal, setNominal] = React.useState(0);
  const [date, setDate] = React.useState(todayIso());
  const [description, setDescription] = React.useState("");
  const [receiptNo, setReceiptNo] = React.useState("");
  const [quantities, setQuantities] = React.useState<Record<string, number>>({});
  const [attachment, setAttachment] = React.useState<Attachment | null>(null);

  const employees = state.employees.filter((e) => e.isActive);
  const kategoriUtamaList = state.kategoriUtama;

  const subList = React.useMemo(() => {
    const subs = state.subKategori.filter((sk) =>
      kategoriUtamaId ? sk.kategoriUtamaId === kategoriUtamaId : true
    );
    return subs
      .filter((sk) => (formDirection === "keluar" ? sk.code < 200 : sk.code >= 200))
      .sort((a, b) => a.code - b.code);
  }, [state.subKategori, kategoriUtamaId, formDirection]);

  const kodeTrx = subKategoriId ? trxCodeOfSub(state, subKategoriId) : "";

  const currentStock: StockRow[] = toStockRows(
    DENOMINATIONS,
    [...getStock(state).entries()].map(([denominationId, quantity]) => ({
      denominationId,
      quantity,
    }))
  );

  const formStock = React.useMemo(() => {
    if (formDirection === "masuk") {
      return currentStock.map((r) => ({ ...r, quantity: Number.MAX_SAFE_INTEGER }));
    }
    return currentStock;
  }, [currentStock, formDirection]);

  const qtySum = currentStock.reduce((s, r) => s + r.value * (quantities[r.denominationId] ?? 0), 0);
  const qtyMismatch = formDirection === "keluar" && nominal > 0 && qtySum !== nominal;

  const canSubmit =
    nominal > 0 &&
    kategoriUtamaId.length > 0 &&
    subKategoriId.length > 0 &&
    employeeId.length > 0 &&
    description.trim().length > 0 &&
    date.length > 0 &&
    !qtyMismatch;

  const openForm = (d: Direction) => {
    if (formDirection === d) {
      setFormDirection(null);
      return;
    }
    setFormDirection(d);
    setKategoriUtamaId("");
    setSubKategoriId("");
    setNominal(0);
    setQuantities({});
  };

  const reset = () => {
    setKategoriUtamaId("");
    setSubKategoriId("");
    setEmployeeId("");
    setNominal(0);
    setDate(todayIso());
    setDescription("");
    setReceiptNo("");
    setQuantities({});
    setAttachment(null);
  };

  const submit = async () => {
    if (!formDirection) return;
    const base = {
      date,
      description: description.trim(),
      receiptNo: receiptNo.trim(),
      kategoriUtamaId,
      subKategoriId,
      employeeId,
      attachments: attachment ? [attachment] : [],
    };

    const result =
      formDirection === "keluar"
        ? await addOutflow({
            ...base,
            amountOut: nominal,
            outStocks: Object.entries(quantities).map(([denominationId, quantity]) => ({
              denominationId,
              quantity,
            })),
          })
        : await addInflow({
            ...base,
            amount: nominal,
            stocks: Object.entries(quantities).map(([denominationId, quantity]) => ({
              denominationId,
              quantity,
            })),
          });

    if (!result.ok) {
      toast(result.error ?? "Gagal menyimpan", "error");
      return;
    }
    reset();
    toast(formDirection === "keluar" ? "Pengeluaran disimpan" : "Pemasukan disimpan");
  };

  // ---------- List state ----------
  const [tab, setTab] = React.useState<Tab>("semua");
  const [page, setPage] = React.useState(1);

  const allRows = React.useMemo<DisplayRow[]>(() => {
    return ledger.rows.map((row, i) => {
      if (row.kind === "in" && row.inflow) {
        const inflow = row.inflow;
        const emp = getEmployee(state, inflow.employeeId);
        const ku = getKategoriUtama(state, inflow.kategoriUtamaId);
        const sub = getSubKategori(state, inflow.subKategoriId);
        return {
          key: `${inflow.id}-${i}`,
          kind: "in" as const,
          no: i + 1,
          tanggal: inflow.date,
          deskripsi: inflow.description,
          noKwitansi: inflow.receiptNo,
          jenis: ku?.name ?? "-",
          subJenis: sub?.name ?? "-",
          kodeTrx: trxCodeOfSub(state, inflow.subKategoriId),
          namaAnggota: emp?.name ?? "-",
          nominal: inflow.amount,
          attachment: inflow.attachments[0] ?? null,
          inflow,
          outflow: null,
        };
      }
      if (row.outflow) {
        const outflow = row.outflow;
        const emp = getEmployee(state, outflow.employeeId);
        const ku = getKategoriUtama(state, outflow.kategoriUtamaId);
        const sub = getSubKategori(state, outflow.subKategoriId);
        return {
          key: `${outflow.id}-${i}`,
          kind: "out" as const,
          no: i + 1,
          tanggal: outflow.date,
          deskripsi: outflow.description,
          noKwitansi: outflow.receiptNo,
          jenis: ku?.name ?? "-",
          subJenis: sub?.name ?? "-",
          kodeTrx: trxCodeOfSub(state, outflow.subKategoriId),
          namaAnggota: emp?.name ?? "-",
          nominal: -outflow.amountOut,
          attachment: outflow.attachments[0] ?? null,
          inflow: null,
          outflow,
        };
      }
      throw new Error("unreachable");
    });
  }, [ledger, state]);

  const visibleRows = React.useMemo(() => {
    if (tab === "keluar") return allRows.filter((r) => r.kind === "out");
    if (tab === "masuk") return allRows.filter((r) => r.kind === "in");
    return allRows;
  }, [allRows, tab]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const firstRow = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedRows = visibleRows.slice(firstRow, firstRow + ROWS_PER_PAGE);

  const selectTab = (nextTab: Tab) => {
    setTab(nextTab);
    setPage(1);
  };

  // ---------- Evidence dialog ----------
  const [evidenceTarget, setEvidenceTarget] = React.useState<null | {
    id: string;
    kind: "in" | "out";
    current: Attachment | null;
    isDelete: boolean;
  }>(null);
  const [evidenceAttachment, setEvidenceAttachment] = React.useState<Attachment | null>(null);

  const openAddEvidence = (id: string, kind: "in" | "out") => {
    setEvidenceTarget({ id, kind, current: null, isDelete: false });
    setEvidenceAttachment(null);
  };
  const openEditEvidence = (id: string, kind: "in" | "out", current: Attachment | null) => {
    setEvidenceTarget({ id, kind, current, isDelete: false });
    setEvidenceAttachment(current);
  };
  const openDeleteEvidence = (id: string, kind: "in" | "out") => {
    setEvidenceTarget({ id, kind, current: null, isDelete: true });
    setEvidenceAttachment(null);
  };
  const saveEvidence = async () => {
    if (!evidenceTarget) return;
    const result =
      evidenceTarget.kind === "in"
        ? await updateInflowEvidence(evidenceTarget.id, evidenceAttachment)
        : await updateOutflowEvidence(evidenceTarget.id, evidenceAttachment);
    if (!result.ok) {
      toast(result.error ?? "Gagal menyimpan evidence", "error");
      return;
    }
    setEvidenceTarget(null);
    toast(evidenceTarget.isDelete ? "Evidence dihapus" : "Evidence disimpan");
  };

  // ---------- Preview ----------
  const [preview, setPreview] = React.useState<Attachment | null>(null);

  // ---------- Export ----------
  const doExport = async () => {
    const { exportListExcel } = await import("@/lib/export-excel");
    const rows: ListExcelRow[] = visibleRows.map((r) => ({
      no: r.no,
      tanggal: formatDate(r.tanggal),
      deskripsi: r.deskripsi,
      noKwitansi: r.noKwitansi,
      jenis: r.jenis,
      subJenis: r.subJenis,
      kodeTrx: r.kodeTrx,
      namaAnggota: r.namaAnggota,
      nominal: r.nominal,
    }));
    exportListExcel(rows, tab === "semua" ? "Gabungan" : tab === "keluar" ? "Pengeluaran" : "Pemasukan");
    toast("File Excel berhasil diunduh");
  };

  const totalNominal = visibleRows.reduce((s, r) => s + r.nominal, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="List Pencatatan"
        description="Catat dan lihat semua transaksi dalam satu halaman."
        actions={
          <Button variant="outline" size="sm" disabled={visibleRows.length === 0} onClick={doExport}>
            <Download className="h-3.5 w-3.5" />
            Export Excel
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Saldo Kas" value={formatRupiah(ledger.balance)} />
        <StatCard title="Total Keluar" value={formatRupiah(ledger.totalOut)} />
        <StatCard title="Total Masuk" value={formatRupiah(ledger.totalIn)} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {([
          { id: "keluar" as Direction, label: "Pengeluaran" },
          { id: "masuk" as Direction, label: "Pemasukan" },
        ]).map((d) => (
          <button
            key={d.id}
            onClick={() => openForm(d.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              formDirection === d.id
                ? d.id === "keluar"
                  ? "bg-red-600 text-white"
                  : "bg-emerald-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            )}
          >
            {formDirection === d.id ? "Tutup" : "Catat"}
            {` ${d.label}`}
          </button>
        ))}
      </div>

      {formDirection && (
        <Card>
          <CardHeader>
            <CardTitle>
              {formDirection === "keluar" ? "Form Pengeluaran" : "Form Pemasukan"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Tanggal</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  <p className="mt-1 text-xs text-slate-400">
                    Bisa diisi backdate (tanggal di masa lalu).
                  </p>
                </div>
                <div>
                  <Label>Deskripsi *</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: Beli ATK, Setoran awal, …"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>No Kwitansi</Label>
                  <Input
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    placeholder="Opsional"
                  />
                </div>
                <div>
                  <Label>Nama Anggota *</Label>
                  <Combobox
                    options={employees.map((e) => ({ value: e.id, label: e.name }))}
                    value={employeeId}
                    onChange={setEmployeeId}
                    placeholder="Ketik nama anggota…"
                    emptyText="Anggota tidak ditemukan"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Jenis (Kategori Utama) *</Label>
                  <Combobox
                    options={kategoriUtamaList.map((k) => ({ value: k.id, label: k.name }))}
                    value={kategoriUtamaId}
                    onChange={(v) => {
                      setKategoriUtamaId(v);
                      setSubKategoriId("");
                    }}
                    placeholder="Pilih kategori…"
                    emptyText="Kategori tidak ditemukan"
                  />
                </div>
                <div>
                  <Label>Sub Jenis *</Label>
                  <Combobox
                    options={subList.map((s) => ({
                      value: s.id,
                      label: `${String(s.code).padStart(3, "0")} · ${s.name}`,
                    }))}
                    value={subKategoriId}
                    onChange={setSubKategoriId}
                    placeholder="Ketik sub jenis…"
                    emptyText="Sub jenis tidak ditemukan"
                    disabled={!kategoriUtamaId}
                  />
                </div>
                <div>
                  <Label>Kode Trx</Label>
                  <Input value={kodeTrx} readOnly placeholder="Otomatis" />
                </div>
              </div>

              <div>
                <Label>Nominal *</Label>
                <RupiahInput value={nominal} onChange={setNominal} />
                <p className="mt-1 text-xs text-slate-400">
                  Nominal tercatat {formDirection === "keluar" ? "minus (-)" : "plus (+)"} di list
                  sesuai arah transaksi.
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rincian pecahan uang {formDirection === "keluar" ? "keluar" : "masuk"}
                </p>
                <StockInput
                  rows={formStock}
                  quantities={quantities}
                  onChange={(id, q) => setQuantities((prev) => ({ ...prev, [id]: q }))}
                  showStock={formDirection === "keluar"}
                  suggestTarget={nominal}
                />
                {qtyMismatch && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    Total pecahan ({formatRupiah(qtySum)}) tidak sama dengan nominal (
                    {formatRupiah(nominal)}).
                  </p>
                )}
              </div>

              <div>
                <Label>Lampiran bukti / nota (opsional)</Label>
                <AttachmentInput value={attachment} onChange={setAttachment} />
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={reset}>
                  Bersihkan
                </Button>
                <Button onClick={submit} disabled={!canSubmit}>
                  <Plus className="h-4 w-4" />
                  Simpan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-1.5">
        {([
          { id: "semua" as Tab, label: "Semua" },
          { id: "keluar" as Tab, label: "Pengeluaran" },
          { id: "masuk" as Tab, label: "Pemasukan" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => selectTab(t.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-orange-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-xs",
                tab === t.id ? "bg-white/20" : "bg-slate-100 text-slate-500"
              )}
            >
              {t.id === "semua"
                ? allRows.length
                : t.id === "keluar"
                  ? allRows.filter((r) => r.kind === "out").length
                  : allRows.filter((r) => r.kind === "in").length}
            </span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Catatan Kas ({visibleRows.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {visibleRows.length === 0 ? (
            <EmptyState
              title="Belum ada catatan"
              description="Tekan tombol Pengeluaran atau Pemasukan di atas untuk mencatat transaksi."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>No Kwitansi</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Sub Jenis</TableHead>
                    <TableHead>Kode Trx</TableHead>
                    <TableHead>Anggota</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead>Evidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.map((r) => (
                    <TableRow key={r.key} className={r.kind === "in" ? "bg-emerald-50/30" : undefined}>
                      <TableCell className="text-slate-500">{r.no}</TableCell>
                      <TableCell className="whitespace-nowrap text-slate-500">
                        {formatDate(r.tanggal)}
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate">{r.deskripsi}</TableCell>
                      <TableCell className="whitespace-nowrap text-slate-500">
                        {r.noKwitansi || "-"}
                      </TableCell>
                      <TableCell className="text-slate-500">{r.jenis}</TableCell>
                      <TableCell className="text-slate-500">{r.subJenis}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-slate-700">
                        {r.kodeTrx}
                      </TableCell>
                      <TableCell>{r.namaAnggota}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium",
                          r.nominal >= 0 ? "text-emerald-600" : "text-red-600"
                        )}
                      >
                        {r.nominal >= 0 ? "+" : ""}
                        {formatRupiah(r.nominal)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {r.attachment && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title={r.attachment.name}
                              onClick={() => setPreview(r.attachment)}
                              className="h-7 px-2 text-sky-600 hover:bg-sky-50"
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              r.attachment
                                ? openEditEvidence(r.outflow?.id ?? r.inflow!.id, r.kind, r.attachment)
                                : openAddEvidence(r.outflow?.id ?? r.inflow!.id, r.kind)
                            }
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            title={r.attachment ? "Edit evidence" : "Tambah evidence"}
                          >
                            {r.attachment ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                          </button>
                          {r.attachment && (
                            <button
                              type="button"
                              onClick={() => openDeleteEvidence(r.outflow?.id ?? r.inflow!.id, r.kind)}
                              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              title="Hapus evidence"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-50">
                    <TableCell colSpan={8} className="font-semibold text-slate-900">
                      TOTAL
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-bold",
                        totalNominal >= 0 ? "text-emerald-700" : "text-red-700"
                      )}
                    >
                      {totalNominal >= 0 ? "+" : ""}
                      {formatRupiah(totalNominal)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {visibleRows.length > ROWS_PER_PAGE && (
        <nav
          aria-label="Pagination daftar catatan kas"
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-slate-500">
            Menampilkan {firstRow + 1}–{Math.min(firstRow + ROWS_PER_PAGE, visibleRows.length)} dari {visibleRows.length} catatan
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Sebelumnya
            </Button>
            <span className="text-sm tabular-nums text-slate-600" aria-live="polite">
              Halaman {currentPage} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              Berikutnya
            </Button>
          </div>
        </nav>
      )}

      {/* Dialog evidence */}
      <Dialog
        open={!!evidenceTarget}
        onClose={() => setEvidenceTarget(null)}
        title={evidenceTarget?.isDelete ? "Hapus Evidence?" : evidenceTarget?.current ? "Edit Evidence" : "Tambah Evidence"}
        footer={
          <>
            <Button variant="outline" onClick={() => setEvidenceTarget(null)}>
              Batal
            </Button>
            {evidenceTarget?.isDelete ? (
              <Button variant="danger" onClick={saveEvidence}>
                <Trash2 className="h-4 w-4" />
                Hapus
              </Button>
            ) : (
              <Button onClick={saveEvidence} disabled={!evidenceAttachment}>
                Simpan
              </Button>
            )}
          </>
        }
      >
        {evidenceTarget?.isDelete ? (
          <p className="text-sm text-slate-500">Evidence ini akan dihapus. Aksi tidak bisa dibatalkan.</p>
        ) : (
          <AttachmentInput value={evidenceAttachment} onChange={setEvidenceAttachment} />
        )}
      </Dialog>

      {/* Dialog preview */}
      <Dialog
        key={preview?.id ?? "none"}
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.name ?? "Evidence"}
        footer={
          <Button variant="outline" onClick={() => setPreview(null)}>
            Tutup
          </Button>
        }
      >
        {preview && (
          <div>
            {preview.type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.dataUrl}
                alt={preview.name}
                className="max-h-96 w-full rounded-lg object-contain ring-1 ring-slate-200"
              />
            ) : (
              <iframe src={preview.dataUrl} title={preview.name} className="h-96 w-full rounded-lg" />
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
