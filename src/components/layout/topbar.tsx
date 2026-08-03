"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ROLE_META } from "@/lib/constants";
import { formatDate, initials } from "@/lib/utils";
import { logout } from "@/lib/store";
import type { User } from "@/types";

interface TopbarProps {
  user: User;
  onOpenSidebar: () => void;
}

export function Topbar({ user, onOpenSidebar }: TopbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Buka menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden text-sm text-slate-500 sm:block">
        <span className="font-medium text-slate-700">{formatDate(new Date().toISOString())}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-xs font-semibold text-white">
              {initials(user.fullName)}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold leading-tight text-slate-900">{user.fullName}</p>
              <p className="text-xs leading-tight text-slate-400">{user.email}</p>
            </div>
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
                aria-hidden
              />
              <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl bg-white p-4 shadow-xl ring-1 ring-slate-200">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-sm font-semibold text-white">
                    {initials(user.fullName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{user.fullName}</p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                  </div>
                </div>
                <div className="py-3">
                  <Badge className={ROLE_META[user.role].badge}>
                    {ROLE_META[user.role].label}
                  </Badge>
                </div>
                <button
                  onClick={async () => {
                    setMenuOpen(false);
                    await logout();
                    router.push("/login");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
