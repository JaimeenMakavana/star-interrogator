import { NextResponse } from "next/server";
import type { ChatResponse } from "@/types/graph";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  const body = await request.json();
  const { threadId, message } = body;
  if (!threadId || !message) {
    return NextResponse.json({ detail: "threadId and message are required" }, { status: 400 });
  }

  const backendResponse = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ thread_id: threadId, message }),
    cache: "no-store",
  });
  const payload = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(payload, { status: backendResponse.status });
  }

  const data: ChatResponse = {
    question: payload.question ?? null,
    finalBullet: payload.final_bullet ?? null,
    status: payload.status,
  };

  return NextResponse.json(data);
}
