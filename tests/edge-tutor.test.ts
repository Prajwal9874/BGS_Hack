import test from "node:test";
import assert from "node:assert/strict";
import { handleEdgeTutor } from "../src/lib/edge-tutor";
const env = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "public",
  GEMINI_API_KEY: "server-only-test-key",
};
const request = (token = true) =>
  new Request("https://example.test/tutor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer learner-token" } : {}),
    },
    body: JSON.stringify({
      language: "Kannada",
      messages: [{ role: "user", content: "Teach me greetings" }],
    }),
  });
test("hosted tutor rejects unsigned-in requests before contacting a provider", async () => {
  const response = await handleEdgeTutor(request(false), env, async () => {
    throw new Error("Unexpected provider call");
  });
  assert.equal(response.status, 401);
});
test("hosted tutor requires a verified user and available quota", async () => {
  const urls: string[] = [];
  const response = await handleEdgeTutor(request(), env, async (input) => {
    urls.push(String(input));
    return Response.json(urls.length === 1 ? { id: "learner" } : false);
  });
  const body = await response.json();
  assert.equal(body.source, "offline");
  assert.match(body.notice, /limit reached/);
  assert.equal(urls.length, 2);
  const denied = await handleEdgeTutor(request(), env, async () =>
    Response.json({ error: "invalid user" }, { status: 401 }),
  );
  assert.equal(denied.status, 401);
});
test("hosted tutor forwards only the selected language history and keeps its key in a server header", async () => {
  let call = 0;
  const response = await handleEdgeTutor(
    request(),
    env,
    async (input, init) => {
      call++;
      if (call === 1) return Response.json({ id: "learner" });
      if (call === 2) return Response.json(true);
      assert.match(String(input), /generativelanguage.googleapis.com/);
      assert.equal(
        new Headers(init?.headers).get("x-goog-api-key"),
        env.GEMINI_API_KEY,
      );
      const body = JSON.parse(String(init?.body));
      assert.match(body.systemInstruction.parts[0].text, /Kannada tutor/);
      assert.equal(body.contents.length, 1);
      assert.equal(body.contents[0].parts[0].text, "Teach me greetings");
      return Response.json({
        candidates: [
          { content: { parts: [{ text: "ನಮಸ್ಕಾರ — Namaskāra: Hello." }] } },
        ],
      });
    },
  );
  const body = await response.json();
  assert.equal(body.source, "gemini");
  assert.match(body.reply, /ನಮಸ್ಕಾರ/);
  assert.ok(!JSON.stringify(body).includes(env.GEMINI_API_KEY));
});
