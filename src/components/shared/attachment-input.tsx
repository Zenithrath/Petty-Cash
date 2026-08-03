"use client";

import * as React from "react";
import { FileText, ImageIcon, Paperclip, X } from "lucide-react";
import type { Attachment } from "@/types";
import { cn } from "@/lib/utils";
import { getAttachmentUrl, uploadAttachment } from "@/lib/store";

const MAX_SIZE = 2 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

interface AttachmentInputProps {
  value: Attachment | null;
  onChange: (attachment: Attachment | null) => void;
  disabled?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function AttachmentInput({ value, onChange, disabled }: AttachmentInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState("");
  const [uploading, setUploading] = React.useState(false);

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("Hanya file gambar (PNG/JPG/WebP) atau PDF yang diizinkan.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Ukuran file maksimal 2 MB.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const result = await uploadAttachment(file);
      if (!result.ok || !result.attachment) {
        setError(result.error ?? "Gagal mengupload file");
        return;
      }
      onChange(result.attachment);
    } finally {
      setUploading(false);
    }
  };

  const isImage = value?.type.startsWith("image/");
  const previewUrl = value ? getAttachmentUrl(value) : "";

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.pdf"
        disabled={disabled || uploading}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {value ? (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1 ring-inset",
            isImage ? "bg-slate-50 ring-slate-200" : "bg-red-50 ring-red-200"
          )}
        >
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={value.name}
              className="h-10 w-10 rounded-md object-cover ring-1 ring-slate-200"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-red-100 text-red-600">
              <FileText className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{value.name}</p>
            <p className="text-xs text-slate-400">{formatSize(value.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Hapus lampiran"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-3 text-sm text-slate-500",
            "border-slate-300 hover:border-orange-400 hover:bg-orange-50/50 hover:text-orange-700",
            "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
          )}
        >
          <Paperclip className="h-4 w-4" />
          {uploading ? "Mengunggah…" : "Lampirkan bukti / nota (satu file, maks 2 MB)"}
        </button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="flex items-center gap-1 text-xs text-slate-400">
        <ImageIcon className="h-3 w-3" />
        PDF, PNG, JPG, atau WebP
      </p>
    </div>
  );
}
