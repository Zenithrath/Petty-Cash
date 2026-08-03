"use client";

import * as React from "react";
import { Pencil, Plus, Trash2, Users, FolderTree, Layers } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import {
  addEmployee,
  addKategoriUtama,
  addSubKategori,
  deleteEmployee,
  deleteKategoriUtama,
  deleteSubKategori,
  updateEmployee,
  updateKategoriUtama,
  updateSubKategori,
  useStore,
} from "@/lib/store";
import { cn } from "@/lib/utils";

type Tab = "anggota" | "kategori" | "sub";

export default function MasterDataPage() {
  const state = useStore((s) => s);
  const [tab, setTab] = React.useState<Tab>("anggota");

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "anggota", label: "Anggota", icon: <Users className="h-4 w-4" />, count: state.employees.length },
    { id: "kategori", label: "Kategori Utama", icon: <FolderTree className="h-4 w-4" />, count: state.kategoriUtama.length },
    { id: "sub", label: "Sub Kategori", icon: <Layers className="h-4 w-4" />, count: state.subKategori.length },
  ];

  // ---------- Anggota ----------
  const [empName, setEmpName] = React.useState("");
  const addEmp = async () => {
    const r = await addEmployee(empName);
    if (!r.ok) return toast(r.error ?? "Gagal", "error");
    setEmpName("");
    toast("Anggota ditambahkan");
  };

  const [editingEmp, setEditingEmp] = React.useState<null | { id: string; name: string }>(null);
  const [empEditName, setEmpEditName] = React.useState("");
  const [deletingEmp, setDeletingEmp] = React.useState<null | { id: string; name: string }>(null);

  const openEditEmp = (id: string, name: string) => {
    setEditingEmp({ id, name });
    setEmpEditName(name);
  };
  const saveEditEmp = async () => {
    if (!editingEmp) return;
    const r = await updateEmployee(editingEmp.id, empEditName);
    if (!r.ok) return toast(r.error ?? "Gagal", "error");
    setEditingEmp(null);
    toast("Anggota diperbarui");
  };

  // ---------- Kategori Utama ----------
  const [kuName, setKuName] = React.useState("");
  const addKu = async () => {
    const r = await addKategoriUtama(kuName);
    if (!r.ok) return toast(r.error ?? "Gagal", "error");
    setKuName("");
    toast("Kategori utama ditambahkan");
  };

  const [editingKu, setEditingKu] = React.useState<null | { id: string; name: string }>(null);
  const [kuEditName, setKuEditName] = React.useState("");
  const [deletingKu, setDeletingKu] = React.useState<null | { id: string; name: string }>(null);

  const openEditKu = (id: string, name: string) => {
    setEditingKu({ id, name });
    setKuEditName(name);
  };
  const saveEditKu = async () => {
    if (!editingKu) return;
    const r = await updateKategoriUtama(editingKu.id, kuEditName);
    if (!r.ok) return toast(r.error ?? "Gagal", "error");
    setEditingKu(null);
    toast("Kategori utama diperbarui");
  };

  // ---------- Sub Kategori ----------
  const [subKuId, setSubKuId] = React.useState("");
  const [subCode, setSubCode] = React.useState("");
  const [subName, setSubName] = React.useState("");

  const addSub = async () => {
    const code = parseInt(subCode, 10);
    if (Number.isNaN(code)) return toast("Kode wajib diisi angka", "error");
    if (!subKuId) return toast("Pilih kategori utama", "error");
    const r = await addSubKategori(subKuId, code, subName);
    if (!r.ok) return toast(r.error ?? "Gagal", "error");
    setSubCode("");
    setSubName("");
    toast("Sub kategori ditambahkan");
  };

  const [editingSub, setEditingSub] = React.useState<null | { id: string; code: number; name: string }>(null);
  const [subEditCode, setSubEditCode] = React.useState("");
  const [subEditName, setSubEditName] = React.useState("");
  const [deletingSub, setDeletingSub] = React.useState<null | { id: string; code: number; name: string }>(null);

  const openEditSub = (id: string, code: number, name: string) => {
    setEditingSub({ id, code, name });
    setSubEditCode(String(code));
    setSubEditName(name);
  };
  const saveEditSub = async () => {
    if (!editingSub) return;
    const code = parseInt(subEditCode, 10);
    if (Number.isNaN(code)) return toast("Kode wajib diisi angka", "error");
    const r = await updateSubKategori(editingSub.id, code, subEditName);
    if (!r.ok) return toast(r.error ?? "Gagal", "error");
    setEditingSub(null);
    toast("Sub kategori diperbarui");
  };

  const sortedKu = React.useMemo(
    () => [...state.kategoriUtama].sort((a, b) => a.name.localeCompare(b.name)),
    [state.kategoriUtama]
  );

  const sortedSub = React.useMemo(
    () => [...state.subKategori].sort((a, b) => a.code - b.code),
    [state.subKategori]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data"
        description="Kelola daftar anggota, kategori utama, dan sub kategori transaksi."
      />

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-orange-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            )}
          >
            {t.icon}
            {t.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-xs",
                tab === t.id ? "bg-white/20" : "bg-slate-100 text-slate-500"
              )}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Anggota */}
      {tab === "anggota" && (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Anggota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="emp-name">Nama anggota baru</Label>
                <Input
                  id="emp-name"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="Contoh: Andi Wijaya"
                  onKeyDown={(e) => e.key === "Enter" && addEmp()}
                />
              </div>
              <Button onClick={addEmp} disabled={empName.trim().length < 3}>
                <Plus className="h-4 w-4" />
                Tambah Anggota
              </Button>
            </div>
            {state.employees.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400 ring-1 ring-inset ring-slate-200">
                Belum ada anggota.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.employees.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium text-slate-800">{e.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => openEditEmp(e.id, e.name)}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 ring-red-200 hover:bg-red-50"
                            onClick={() => setDeletingEmp({ id: e.id, name: e.name })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab Kategori Utama */}
      {tab === "kategori" && (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Kategori Utama</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="ku-name">Nama kategori utama baru</Label>
                <Input
                  id="ku-name"
                  value={kuName}
                  onChange={(e) => setKuName(e.target.value)}
                  placeholder="Contoh: Pencairan, Pembelian, …"
                  onKeyDown={(e) => e.key === "Enter" && addKu()}
                />
              </div>
              <Button onClick={addKu} disabled={kuName.trim().length < 2}>
                <Plus className="h-4 w-4" />
                Tambah Kategori Utama
              </Button>
            </div>
            {sortedKu.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400 ring-1 ring-inset ring-slate-200">
                Belum ada kategori utama.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead className="text-right">Jumlah Sub</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedKu.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium text-slate-800">{k.name}</TableCell>
                      <TableCell className="text-right text-slate-500">
                        <Badge className="bg-slate-100 text-slate-600">
                          {state.subKategori.filter((s) => s.kategoriUtamaId === k.id).length} sub
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => openEditKu(k.id, k.name)}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 ring-red-200 hover:bg-red-50"
                            onClick={() => setDeletingKu({ id: k.id, name: k.name })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab Sub Kategori */}
      {tab === "sub" && (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Sub Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="w-full sm:w-52">
                <Label>Kategori Utama</Label>
                <Select value={subKuId} onChange={(e) => setSubKuId(e.target.value)}>
                  <option value="">Pilih…</option>
                  {sortedKu.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-28">
                <Label htmlFor="sub-code">Kode</Label>
                <Input
                  id="sub-code"
                  value={subCode}
                  onChange={(e) => setSubCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="114"
                  inputMode="numeric"
                  maxLength={3}
                  onKeyDown={(e) => e.key === "Enter" && addSub()}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="sub-name">Nama sub kategori baru</Label>
                <Input
                  id="sub-name"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="Contoh: Ongkos kirim"
                  onKeyDown={(e) => e.key === "Enter" && addSub()}
                />
              </div>
              <Button onClick={addSub} disabled={subName.trim().length < 2}>
                <Plus className="h-4 w-4" />
                Tambah Sub Kategori
              </Button>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              Kode diisi <strong>manual</strong> (3 digit). 1xx = pengeluaran, 2xx = pemasukan. Kode tidak boleh duplikat.
            </p>
            {sortedSub.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400 ring-1 ring-inset ring-slate-200">
                Belum ada sub kategori.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kategori Utama</TableHead>
                    <TableHead>Arah</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSub.map((s) => {
                    const ku = state.kategoriUtama.find((k) => k.id === s.kategoriUtamaId);
                    const arah = s.code >= 200 ? "masuk" : "keluar";
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Badge className="bg-slate-100 text-slate-600 ring-slate-200">
                            {String(s.code).padStart(3, "0")}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">{s.name}</TableCell>
                        <TableCell className="text-slate-500">{ku?.name ?? "-"}</TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              arah === "keluar"
                                ? "bg-red-50 text-red-700 ring-red-200"
                                : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            )}
                          >
                            {arah}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => openEditSub(s.id, s.code, s.name)}>
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 ring-red-200 hover:bg-red-50"
                              onClick={() => setDeletingSub({ id: s.id, code: s.code, name: s.name })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Hapus
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog edit anggota */}
      <Dialog
        key={String(!!editingEmp)}
        open={!!editingEmp}
        onClose={() => setEditingEmp(null)}
        title="Edit Anggota"
        description={editingEmp ? `Nama lama: ${editingEmp.name}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingEmp(null)}>
              Batal
            </Button>
            <Button onClick={saveEditEmp} disabled={empEditName.trim().length < 3}>
              Simpan
            </Button>
          </>
        }
      >
        <div>
          <Label htmlFor="emp-edit">Nama anggota</Label>
          <Input
            id="emp-edit"
            value={empEditName}
            onChange={(e) => setEmpEditName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveEditEmp()}
          />
        </div>
      </Dialog>

      {/* Dialog hapus anggota */}
      <Dialog
        key={String(!!deletingEmp)}
        open={!!deletingEmp}
        onClose={() => setDeletingEmp(null)}
        title="Hapus Anggota?"
        description={
          deletingEmp
            ? `"${deletingEmp.name}" akan dihapus dari daftar anggota.`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingEmp(null)}>
              Batal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deletingEmp) return;
                const r = await deleteEmployee(deletingEmp.id);
                if (!r.ok) return toast(r.error ?? "Gagal", "error");
                setDeletingEmp(null);
                toast("Anggota dihapus");
              }}
            >
              <Trash2 className="h-4 w-4" />
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500">Aksi ini tidak bisa dibatalkan.</p>
      </Dialog>

      {/* Dialog edit kategori utama */}
      <Dialog
        key={String(!!editingKu)}
        open={!!editingKu}
        onClose={() => setEditingKu(null)}
        title="Edit Kategori Utama"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingKu(null)}>
              Batal
            </Button>
            <Button onClick={saveEditKu} disabled={kuEditName.trim().length < 2}>
              Simpan
            </Button>
          </>
        }
      >
        <div>
          <Label htmlFor="ku-edit">Nama kategori utama</Label>
          <Input
            id="ku-edit"
            value={kuEditName}
            onChange={(e) => setKuEditName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveEditKu()}
          />
        </div>
      </Dialog>

      {/* Dialog hapus kategori utama */}
      <Dialog
        key={String(!!deletingKu)}
        open={!!deletingKu}
        onClose={() => setDeletingKu(null)}
        title="Hapus Kategori Utama?"
        description={
          deletingKu
            ? `"${deletingKu.name}" akan dihapus. Semua sub kategori di dalamnya juga akan dihapus.`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingKu(null)}>
              Batal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deletingKu) return;
                const r = await deleteKategoriUtama(deletingKu.id);
                if (!r.ok) return toast(r.error ?? "Gagal", "error");
                setDeletingKu(null);
                toast("Kategori utama dihapus");
              }}
            >
              <Trash2 className="h-4 w-4" />
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500">Aksi ini tidak bisa dibatalkan.</p>
      </Dialog>

      {/* Dialog edit sub kategori */}
      <Dialog
        key={String(!!editingSub)}
        open={!!editingSub}
        onClose={() => setEditingSub(null)}
        title="Edit Sub Kategori"
        description={
          editingSub
            ? `Kode ${String(editingSub.code).padStart(3, "0")} — kategori utama tidak bisa diubah.`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingSub(null)}>
              Batal
            </Button>
            <Button onClick={saveEditSub} disabled={subEditName.trim().length < 2}>
              Simpan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="sub-edit-code">Kode</Label>
            <Input
              id="sub-edit-code"
              value={subEditCode}
              onChange={(e) => setSubEditCode(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              maxLength={3}
              onKeyDown={(e) => e.key === "Enter" && saveEditSub()}
            />
          </div>
          <div>
            <Label htmlFor="sub-edit-name">Nama sub kategori</Label>
            <Input
              id="sub-edit-name"
              value={subEditName}
              onChange={(e) => setSubEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveEditSub()}
            />
          </div>
        </div>
      </Dialog>

      {/* Dialog hapus sub kategori */}
      <Dialog
        key={String(!!deletingSub)}
        open={!!deletingSub}
        onClose={() => setDeletingSub(null)}
        title="Hapus Sub Kategori?"
        description={
          deletingSub
            ? `"${String(deletingSub.code).padStart(3, "0")} · ${deletingSub.name}" akan dihapus.`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingSub(null)}>
              Batal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deletingSub) return;
                const r = await deleteSubKategori(deletingSub.id);
                if (!r.ok) return toast(r.error ?? "Gagal", "error");
                setDeletingSub(null);
                toast("Sub kategori dihapus");
              }}
            >
              <Trash2 className="h-4 w-4" />
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500">Aksi ini tidak bisa dibatalkan.</p>
      </Dialog>
    </div>
  );
}
