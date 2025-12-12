"use client";

import { ChangeEvent, useState } from "react";
import type { UploadResponse } from "@/types/graph";

interface Props {
  onComplete: (data: UploadResponse) => void;
}

export default function PDFUploader({ onComplete }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    event.target.value = "";
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.detail ?? "Upload failed");
      }
      onComplete(payload as UploadResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="w-full rounded-2xl border border-dashed border-zinc-300 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Upload your resume (PDF)</h2>
      <p className="mt-2 text-sm text-zinc-500">
        We parse the PDF locally, embed it with ChromaDB, and feed context into the interview graph.
      </p>
      <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800">
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        {isUploading ? "Uploading..." : "Select PDF"}
      </label>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </section>
  );
}
