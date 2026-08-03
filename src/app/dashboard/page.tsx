"use client";

import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser, getLedger, getSubKategori, trxCodeOfSub, useStore } from "@/lib/store";
import { formatDate, formatRupiah } from "@/lib/utils";

export default function DashboardPage() {
  const state = useStore((s) => s);
  const user = getCurrentUser(state);
  const ledger = getLedger(state);

  const recent = [...ledger.rows].reverse().slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          <span>
            Halo, <strong className="text-slate-700">{user?.fullName}</strong> — selamat datang di
            KOPKAR MAJU.
          </span>
        }
        actions={
          <Link href="/dashboard/list">
            <Button size="sm">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Catat Transaksi
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Saldo Kas" value={formatRupiah(ledger.balance)} />
        <StatCard title="Total Keluar" value={formatRupiah(ledger.totalOut)} />
        <StatCard title="Total Masuk" value={formatRupiah(ledger.totalIn)} />
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Pencatatan Terbaru</h2>
        </div>
        <CardContent className="px-0 py-0">
          {recent.length === 0 ? (
            <EmptyState
              title="Belum ada pencatatan"
              description="Catat pengeluaran atau pemasukan di halaman Pencatatan."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((row, i) => {
                  const inflow = row.inflow;
                  const outflow = row.outflow;
                  const sub = inflow
                    ? getSubKategori(state, inflow.subKategoriId)
                    : outflow
                      ? getSubKategori(state, outflow.subKategoriId)
                      : undefined;
                  const kodeTrx = inflow
                    ? trxCodeOfSub(state, inflow.subKategoriId)
                    : outflow
                      ? trxCodeOfSub(state, outflow.subKategoriId)
                      : "";
                  return (
                    <TableRow key={i}>
                      <TableCell className="whitespace-nowrap text-slate-500">
                        {formatDate(inflow?.date ?? outflow?.date)}
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate">
                        <span className="flex items-center gap-2">
                          <Badge
                            className={
                              row.kind === "in"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-red-50 text-red-700 ring-red-200"
                            }
                          >
                            {row.kind === "in" ? "Masuk" : "Keluar"}
                          </Badge>
                          <span className="text-slate-400">{kodeTrx}</span>
                          {sub?.name ?? "-"}
                        </span>
                      </TableCell>
                      <TableCell
                        className={
                          "text-right font-medium " +
                          (row.kind === "in" ? "text-emerald-600" : "text-red-600")
                        }
                      >
                        {row.kind === "in" ? "+" : "-"}
                        {formatRupiah(row.amount)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatRupiah(row.saldo)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
