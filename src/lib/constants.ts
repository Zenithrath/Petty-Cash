import type { UserRole } from "@/types";

export const ROLE_META: Record<UserRole, { label: string; badge: string }> = {
  superadmin: { label: "Super Admin", badge: "bg-orange-50 text-orange-700 ring-indigo-200" },
  admin: { label: "Admin", badge: "bg-slate-100 text-slate-700 ring-slate-200" },
};

export const NAV_ITEMS: {
  href: string;
  label: string;
  roles: UserRole[];
}[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["superadmin", "admin"] },
  { href: "/dashboard/list", label: "List Pencatatan", roles: ["superadmin", "admin"] },
  { href: "/dashboard/kas-fisik", label: "Kas Fisik", roles: ["superadmin", "admin"] },
  { href: "/dashboard/master-data", label: "Master Data", roles: ["superadmin", "admin"] },
  { href: "/dashboard/admin/users", label: "Admin", roles: ["superadmin"] },
];

export const APP_NAME = "KOPKAR MAJU";
export const APP_TAGLINE = "Koperasi Karyawan Maju";
