"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold text-slate-900">Terjadi kesalahan</p>
        <p className="mt-2 text-xs text-slate-500">
          Gagal memuat halaman ini. Silakan coba lagi.
        </p>
        <Button onClick={() => unstable_retry()} className="mt-5">
          Coba Lagi
        </Button>
      </div>
    </div>
  );
}
