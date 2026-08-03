import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ size = "md", href }: { size?: "sm" | "md"; href?: string }) {
  const mark = (
    <span className="flex flex-col leading-tight">
      <span
        className={cn(
          "font-bold tracking-tight text-orange-600",
          size === "sm" ? "text-sm" : "text-base"
        )}
      >
        KOPKAR MAJU
      </span>
      <span className="text-xs font-medium tracking-wide text-slate-500">
        Koperasi Karyawan Maju
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {mark}
      </Link>
    );
  }
  return <div className="flex items-center">{mark}</div>;
}
