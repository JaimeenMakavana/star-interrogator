"use client";

import { Dispatch, SetStateAction, useState, useRef, useEffect } from "react";
import type { ChatMessage, ChatResponse } from "@/types/graph";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid"; // Optional icon

interface Props {
  threadId: string | null;
  messages: ChatMessage[];
  onMessagesChange: Dispatch<SetStateAction<ChatMessage[]>>;
  onFinalBullet: (bullet: string | null) => void;
}

export default function ChatInterface({
  threadId,
  messages,
  onMessagesChange,
  onFinalBullet,
}: Props) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!threadId || !input.trim()) return;

    const outgoing = input.trim();
    onMessagesChange((prev) => [...prev, { role: "user", content: outgoing }]);
    setInput("");
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, message: outgoing }),
      });
      const payload = (await response.json()) as ChatResponse & {
        detail?: string;
      };
      if (!response.ok) {
        throw new Error(payload.detail ?? "Chat failed");
      }
      if (payload.question) {
        onMessagesChange((prev) => [
          ...prev,
          { role: "assistant", content: payload.question as string },
        ]);
      }
      if (payload.finalBullet) {
        onMessagesChange((prev) => [
          ...prev,
          { role: "assistant", content: payload.finalBullet as string },
        ]);
      }
      onFinalBullet(payload.finalBullet);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to send message";
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="flex h-[600px] flex-col rounded-3xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 lg:h-[calc(100vh-200px)]">
      {/* Chat Header */}
      <header className="flex items-center border-b border-slate-100 px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          {/* Simple Avatar/Icon */}
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>
        <div className="ml-4">
          <h2 className="text-sm font-bold text-slate-900">Interviewer AI</h2>
          <p className="text-xs text-slate-500">
            {threadId ? "Session Active" : "Waiting for resume..."}
          </p>
        </div>
      </header>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-6 overflow-y-auto bg-slate-50/50 p-6"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
            <p className="text-sm text-slate-400">
              Upload a resume to start the interview.
            </p>
          </div>
        )}

        {messages.map((message, index) => {
          const isAI = message.role === "assistant";
          return (
            <div
              key={`${message.role}-${index}`}
              className={`flex w-full ${
                isAI ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`flex max-w-[85%] flex-col ${
                  isAI ? "items-start" : "items-end"
                }`}
              >
                <span
                  className={`px-5 py-3 text-sm leading-relaxed shadow-sm ${
                    isAI
                      ? "rounded-2xl rounded-tl-none bg-white text-slate-700 ring-1 ring-slate-200"
                      : "rounded-2xl rounded-tr-none bg-indigo-600 text-white"
                  }`}
                >
                  {message.content}
                </span>
                <span className="mt-1 text-[10px] uppercase text-slate-400">
                  {isAI ? "Interviewer" : "You"}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-none bg-white px-5 py-3 shadow-sm ring-1 ring-slate-200">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-0"></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-150"></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-300"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-100 p-4">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center gap-2"
        >
          <input
            type="text"
            className="flex-1 rounded-full border-0 bg-slate-100 py-3 pl-5 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            placeholder={
              threadId ? "Type your answer..." : "Upload resume to enable chat"
            }
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={!threadId || isSending}
          />
          <button
            type="submit"
            className="absolute right-2 rounded-full bg-indigo-600 p-2 text-white transition-transform hover:scale-105 hover:bg-indigo-700 disabled:bg-slate-300 disabled:hover:scale-100"
            disabled={!threadId || isSending}
          >
            <PaperAirplaneIcon className="h-4 w-4 -translate-x-0.5 translate-y-0.5 rotate-[-45deg]" />
            <span className="sr-only">Send</span>
          </button>
        </form>
        {error && <p className="mt-2 px-2 text-xs text-red-500">{error}</p>}
      </div>
    </section>
  );
}
