"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins, Database, LayoutDashboard, Table2, Users, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";
import { Logo } from "@/components/shared/logo";

const icons: Record<string, React.ReactNode> = {
  "/dashboard": <LayoutDashboard className="h-4 w-4" />,
  "/dashboard/list": <Table2 className="h-4 w-4" />,
  "/dashboard/kas-fisik": <Coins className="h-4 w-4" />,
  "/dashboard/master-data": <Database className="h-4 w-4" />,
  "/dashboard/admin/users": <Users className="h-4 w-4" />,
};

interface SidebarProps {
  role: UserRole;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ role, open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <Logo href="/dashboard" />
          <button
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
            onClick={onClose}
            aria-label="Tutup menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.filter((item) => item.roles.includes(role)).map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-orange-50 text-orange-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {icons[item.href]}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
