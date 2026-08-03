"use client";

import * as React from "react";

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold text-slate-900">Terjadi kesalahan</p>
        <p className="mt-2 text-xs text-slate-500">
          Terjadi masalah saat memuat halaman. Silakan coba lagi.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="mt-5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
