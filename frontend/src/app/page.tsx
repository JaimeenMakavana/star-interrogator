"use client";

import { useState } from "react";
import ChatInterface from "./components/ChatInterface";
import PDFUploader from "./components/PDFUploader";
import type { ChatMessage, ResumeTarget, UploadResponse } from "@/types/graph";
import {
  SparklesIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"; // Assuming you have heroicons or similar, if not, remove icons.

export default function HomePage() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTarget, setCurrentTarget] = useState<ResumeTarget | null>(null);
  const [finalBullet, setFinalBullet] = useState<string | null>(null);

  const handleUploadComplete = (data: UploadResponse) => {
    setThreadId(data.threadId);
    setCurrentTarget(data.currentTarget ?? null);
    setFinalBullet(null);
    setMessages(
      data.question ? [{ role: "assistant", content: data.question }] : []
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <header className="mb-10 flex flex-col items-start gap-4 border-b border-slate-200 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                v2.0 Beta
              </span>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Sidecar Architecture
              </p>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              STAR Interrogator
            </h1>
            <p className="max-w-xl text-sm text-slate-500">
              Refine your resume bullets using the Situation, Task, Action,
              Result framework.
            </p>
          </div>
        </header>

        {/* Main Grid Layout */}
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left Panel: Context & Uploader */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            {/* Uploader Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm transition-shadow hover:shadow-md">
              <PDFUploader onComplete={handleUploadComplete} />
            </div>

            {/* Current Target Card (Problem State) */}
            {currentTarget && (
              <section className="group relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-sm ring-1 ring-amber-900/5">
                <div className="mb-4 flex items-center gap-2 text-amber-900/80">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    Weak Point Detected
                  </h3>
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="rounded-xl bg-white/60 p-4 shadow-sm ring-1 ring-amber-100 backdrop-blur-sm">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                      &ldquo;{currentTarget.text}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-amber-700">
                    <span className="font-semibold">Missing Context:</span>
                    <span>{currentTarget.missing}</span>
                  </div>
                </div>
              </section>
            )}

            {/* Final Result Card (Success State) */}
            {finalBullet && (
              <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-md ring-1 ring-emerald-900/5">
                <div className="mb-4 flex items-center gap-2 text-emerald-700">
                  <SparklesIcon className="h-5 w-5" />
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    Optimized STAR Bullet
                  </h3>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-emerald-100">
                  <p className="text-base font-medium text-slate-800">
                    {finalBullet}
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* Right Panel: Chat Interface */}
          <div className="lg:col-span-7">
            <ChatInterface
              threadId={threadId}
              messages={messages}
              onMessagesChange={setMessages}
              onFinalBullet={setFinalBullet}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
