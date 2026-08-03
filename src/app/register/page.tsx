"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { registerUser } from "@/lib/store";

export default function RegisterPage() {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 3) {
      setError("Nama lengkap minimal 3 karakter");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Format email tidak valid");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }
    const result = await registerUser({ fullName, email, password });
    if (!result.ok) {
      setError(result.error ?? "Gagal mendaftar");
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">Pendaftaran diterima</h1>
          <p className="mt-2 text-sm text-slate-500">
            Cek email Anda untuk konfirmasi pendaftaran (jika diaktifkan). Akun Anda menunggu
            persetujuan superadmin dan akan bisa login setelah disetujui di menu Admin.
          </p>
          <Link href="/login" className="mt-6 inline-block">
            <Button>
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo />
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Daftar Akun</h1>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="r-name">Nama akun</Label>
              <Input
                id="r-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama untuk akun login"
              />
              <p className="mt-1 text-xs text-slate-400">
                Terpisah dari daftar nama anggota di Master Data.
              </p>
            </div>
            <div>
              <Label htmlFor="r-email">Email</Label>
              <Input
                id="r-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
              />
            </div>
            <div>
              <Label htmlFor="r-password">Password</Label>
              <Input
                id="r-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-inset ring-red-200">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" size="lg">
              Daftar
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-medium text-orange-600 hover:text-orange-700">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
