import { languages, type Language } from "./data";
import { fallbackReply, tutorSystem } from "./tutor";

type TutorMessage = { role: "user" | "assistant"; content: string };
export async function handleEdgeTutor(
  request: Request,
  env: Record<string, string | undefined>,
  fetcher: typeof fetch = fetch,
) {
  const origin = request.headers.get("origin");
  const allowed = (
    env.TUTOR_ALLOWED_ORIGINS ||
    "https://fluent-ly-hackathon.bronze-goat-4359.chatgpt.site,http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:3100,http://localhost:3100"
  ).split(",");
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    Vary: "Origin",
    "Access-Control-Allow-Origin":
      origin && allowed.includes(origin) ? origin : allowed[0],
    "Access-Control-Allow-Headers":
      "authorization,apikey,content-type,x-client-info",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });
  if (origin && !allowed.includes(origin))
    return json({ error: "Origin not allowed." }, 403);
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  if (Number(request.headers.get("content-length") || 0) > 40000)
    return json({ error: "Request too large." }, 413);
  let body;
  try {
    const text = await request.text();
    if (text.length > 40000) return json({ error: "Request too large." }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }
  if (
    !body ||
    !languages.some((l) => l.id === body.language) ||
    !Array.isArray(body.messages) ||
    !body.messages.length ||
    body.messages.length > 20 ||
    body.messages.some(
      (m: TutorMessage) =>
        !m ||
        !["user", "assistant"].includes(m.role) ||
        typeof m.content !== "string" ||
        m.content.length > 1500,
    ) ||
    body.messages.at(-1).role !== "user"
  )
    return json(
      {
        error: "Choose a supported language and send up to 20 short messages.",
      },
      400,
    );
  const id = body.language as Language,
    messages = body.messages as TutorMessage[];
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer "))
    return json({ error: "Sign in to use the AI tutor." }, 401);
  const url = env.SUPABASE_URL,
    key = env.SUPABASE_ANON_KEY;
  if (!url || !key)
    return json({ error: "Tutor authentication is not configured." }, 503);
  const fallback = (notice: string) =>
    json({ reply: fallbackReply(id, messages), source: "offline", notice });
  try {
    const authHeaders = {
      apikey: key,
      Authorization: auth,
      "Content-Type": "application/json",
    };
    const user = await fetcher(url + "/auth/v1/user", {
      headers: authHeaders,
      signal: AbortSignal.timeout(10000),
    });
    if (!user.ok || !(await user.json()).id)
      return json({ error: "Please sign in again." }, 401);
    if (!env.GEMINI_API_KEY)
      return fallback("Scripted practice · Gemini key has not been added yet.");
    const quota = await fetcher(url + "/rest/v1/rpc/claim_tutor_request", {
      method: "POST",
      headers: authHeaders,
      body: "{}",
      signal: AbortSignal.timeout(10000),
    });
    if (!quota.ok)
      return fallback(
        "Scripted practice · AI quota is temporarily unavailable.",
      );
    if ((await quota.json()) !== true)
      return fallback(
        "Scripted practice · Tutor limit reached. Try again later.",
      );
    const model = env.GEMINI_MODEL || "gemini-3.1-flash-lite";
    if (!/^[a-zA-Z0-9.-]+$/.test(model))
      return fallback(
        "Scripted practice · Tutor model is not configured correctly.",
      );
    const result = await fetcher(
      "https://generativelanguage.googleapis.com/v1beta/models/" +
        model +
        ":generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: tutorSystem(id) }] },
          contents: messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: { maxOutputTokens: 1200, temperature: 0.6 },
        }),
        signal: AbortSignal.timeout(20000),
      },
    );
    if (!result.ok)
      return fallback(
        result.status === 429
          ? "Scripted practice · Gemini free-tier limit reached. Try again later."
          : "Scripted practice · Gemini is temporarily unavailable.",
      );
    const data = await result.json();
    const reply = data.candidates?.[0]?.content?.parts
      ?.filter(
        (p: { text?: string; thought?: boolean }) =>
          !p.thought && typeof p.text === "string",
      )
      .map((p: { text: string }) => p.text)
      .join("\n")
      .trim();
    if (!reply)
      return fallback(
        "Scripted practice · Gemini returned no lesson. Try again.",
      );
    return json({
      reply,
      source: "gemini",
      notice: "Gemini · Language-learning tutor",
    });
  } catch {
    return fallback(
      "Scripted practice · Tutor connection is temporarily unavailable.",
    );
  }
}

