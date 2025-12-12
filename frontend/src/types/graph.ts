export type ResumeTarget = {
  text: string;
  missing: string;
};

export type UploadResponse = {
  threadId: string;
  question: string | null;
  currentTarget: ResumeTarget | null;
  status: string;
};

export type ChatResponse = {
  question: string | null;
  finalBullet: string | null;
  status: string;
};

export type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};
