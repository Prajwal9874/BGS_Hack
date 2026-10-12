import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createClient } from "@supabase/supabase-js";
import { languages, type Language } from "@/lib/data";
import { fallbackReply, tutorSystem } from "@/lib/tutor";
import type { Message } from "@/lib/domain";
export const maxDuration = 30;
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 120000)
    return Response.json({ error: "Request too large." }, { status: 413 });
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 40000)
      return Response.json({ error: "Request too large." }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const b = body as { language?: unknown; messages?: unknown };
  if (
    !b ||
    !languages.some((l) => l.id === b.language) ||
    !Array.isArray(b.messages) ||
    b.messages.length === 0 ||
    b.messages.length > 20 ||
    b.messages.some(
      (m) =>
        !m ||
        !["user", "assistant"].includes(m.role) ||
        typeof m.content !== "string" ||
        m.content.length > 1500,
    ) ||
    b.messages.at(-1)?.role !== "user"
  )
    return Response.json(
      {
        error: "Choose a supported language and send up to 20 short messages.",
      },
      { status: 400 },
    );
  const id = b.language as Language,
    messages = b.messages as Message[],
    fallback = fallbackReply(id, messages);
  if (!process.env.GEMINI_API_KEY)
    return Response.json({
      reply: fallback,
      source: "offline",
      notice: "Scripted practice · Gemini is not configured.",
    });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (process.env.ALLOW_DEMO_AI !== "true") {
    if (!url || !key)
      return Response.json({
        reply: fallback,
        source: "offline",
        notice: "Scripted practice · Sign-in is required for Gemini.",
      });
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token)
      return Response.json({
        reply: fallback,
        source: "offline",
        notice: "Scripted practice · Sign in to use Gemini.",
      });
    const db = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user)
      return Response.json({ error: "Please sign in again." }, { status: 401 });
    const quota = await db.rpc("claim_tutor_request");
    if (quota.error)
      return Response.json({
        reply: fallback,
        source: "offline",
        notice:
          "Scripted practice · AI quota unavailable. Check the database setup.",
      });
    if (!quota.data)
      return Response.json({
        reply: fallback,
        source: "offline",
        notice: "Scripted practice · Tutor limit reached. Try again later.",
      });
  }
  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    const result = await generateText({
      model: google(process.env.GEMINI_MODEL || "gemini-3.8-flash"),
      instructions: tutorSystem(id),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      maxOutputTokens: 800,
      abortSignal: AbortSignal.timeout(20000),
      maxRetries: 0,
    });
    if (!result.text.trim()) throw new Error("Empty response");
    return Response.json({
      reply: result.text,
      source: "gemini",
      notice: "Gemini · Language-learning tutor",
    });
  } catch {
    return Response.json({
      reply: fallback,
      source: "offline",
      notice: "Scripted practice · Gemini is temporarily unavailable.",
    });
  }
}
