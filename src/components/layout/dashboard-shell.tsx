"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser, hydrate, useStore } from "@/lib/store";
import { Logo } from "@/components/shared/logo";

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const state = useStore((s) => s);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    hydrate();
  }, []);

  React.useEffect(() => {
    if (state.hydrated && !state.currentUserId) {
      router.replace("/login");
    }
  }, [state.hydrated, state.currentUserId, router]);

  if (!state.hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
            Memuat data…
          </div>
        </div>
      </div>
    );
  }

  const user = getCurrentUser(state);
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role={user.role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Topbar user={user} onOpenSidebar={() => setSidebarOpen(true)} />
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
