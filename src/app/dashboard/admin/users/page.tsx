"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, UserX, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import {
  approveUser,
  getCurrentUser,
  rejectUser,
  setUserRole,
  toggleUserActive,
  useStore,
} from "@/lib/store";
import { formatDateTime, initials } from "@/lib/utils";
import { ROLE_META } from "@/lib/constants";
import type { User } from "@/types";

export default function AdminUsersPage() {
  const router = useRouter();
  const state = useStore((s) => s);
  const currentUser = getCurrentUser(state);

  React.useEffect(() => {
    if (currentUser && currentUser.role !== "superadmin") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== "superadmin") return null;

  const pending = state.users.filter((u) => !u.isActive);
  const active = state.users.filter((u) => u.isActive);

  const roleSelect = (userId: string, role: User["role"]) => (
    <Select
      value={role}
      disabled={userId === currentUser.id}
      onChange={async (e) => {
        const r = await setUserRole(userId, e.target.value as User["role"]);
        if (!r.ok) return toast(r.error ?? "Gagal", "error");
        toast("Peran akun diperbarui");
      }}
      className="h-8 w-[130px] text-xs"
    >
      {(Object.keys(ROLE_META) as User["role"][]).map((r) => (
        <option key={r} value={r}>
          {ROLE_META[r].label}
        </option>
      ))}
    </Select>
  );

  const statusBadge = (u: User) =>
    u.isActive ? (
      <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Aktif</Badge>
    ) : (
      <Badge className="bg-amber-50 text-amber-700 ring-amber-200">Menunggu Persetujuan</Badge>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin — Kelola Akun"
      />

      <Card>
        <CardContent className="px-0 py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pengguna</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...pending, ...active].map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-semibold text-orange-600">
                        {initials(u.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                          {u.fullName}
                          {u.id === currentUser.id && (
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-orange-500">
                              Anda
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{roleSelect(u.id, u.role)}</TableCell>
                  <TableCell>{statusBadge(u)}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDateTime(u.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      {!u.isActive ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={async () => {
                              const r = await approveUser(u.id);
                              if (!r.ok) return toast(r.error ?? "Gagal", "error");
                              toast(`Akun "${u.fullName}" disetujui`);
                            }}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Setujui
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 ring-red-300 hover:bg-red-50"
                            onClick={async () => {
                              const r = await rejectUser(u.id);
                              if (!r.ok) return toast(r.error ?? "Gagal", "error");
                              toast(`Pendaftaran "${u.fullName}" ditolak`, "info");
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                            Tolak
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className={
                              u.id === currentUser.id
                                ? "text-slate-300 ring-slate-200"
                                : "text-slate-600"
                            }
                            disabled={u.id === currentUser.id}
                            onClick={async () => {
                              const r = await toggleUserActive(u.id);
                              if (!r.ok) return toast(r.error ?? "Gagal", "error");
                              toast(`Akun "${u.fullName}" dinonaktifkan`, "info");
                            }}
                          >
                            <UserX className="h-3.5 w-3.5" />
                            Nonaktifkan
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
