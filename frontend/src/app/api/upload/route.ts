import { NextResponse } from "next/server";
import type { UploadResponse } from "@/types/graph";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ detail: "PDF file is required" }, { status: 400 });
  }

  const backendResponse = await fetch(`${BACKEND_URL}/upload`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });
  const payload = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(payload, { status: backendResponse.status });
  }

  const data: UploadResponse = {
    threadId: payload.thread_id,
    question: payload.question ?? null,
    currentTarget: payload.current_target ?? null,
    status: payload.status,
  };

  return NextResponse.json(data);
}
