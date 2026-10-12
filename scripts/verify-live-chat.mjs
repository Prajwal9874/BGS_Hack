// Run with real test account credentials; never logs passwords or session tokens.
// In PowerShell: node --env-file=.env.local --env-file=.env.test-accounts scripts/verify-live-chat.mjs
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const credentials = [
  ["LIVE_TEST_EMAIL_A", "LIVE_TEST_PASSWORD_A"],
  ["LIVE_TEST_EMAIL_B", "LIVE_TEST_PASSWORD_B"],
].map(([e, p]) => ({ email: process.env[e], password: process.env[p] }));
if (!url || !key || credentials.some((c) => !c.email || !c.password))
  throw new Error(
    "Configure Supabase and both test accounts in ignored environment files first.",
  );
const clients = credentials.map(() =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
);
const channels = [];
let proof;
try {
  const sessions = await Promise.all(
    clients.map(async (c, i) => {
      const { data, error } = await c.auth.signInWithPassword(credentials[i]);
      if (error)
        throw new Error(`Test account ${i + 1} login: ${error.message}`);
      assert.ok(data.user);
      return data.user;
    }),
  );
  assert.notEqual(
    sessions[0].id,
    sessions[1].id,
    "Two distinct Auth accounts are required",
  );
  const profiles = await Promise.all(
    clients.map(async (c, i) => {
      const r = await c
        .from("profiles")
        .select("id,name,known,proficiency,target,partner_id")
        .eq("id", sessions[i].id)
        .single();
      if (r.error)
        throw new Error(`Test account ${i + 1} profile: ${r.error.message}`);
      return r.data;
    }),
  );
  assert.equal(
    profiles[0].partner_id,
    profiles[1].id,
    "Pair the accounts in the app first",
  );
  assert.equal(profiles[1].partner_id, profiles[0].id);
  assert.ok(profiles[0].known.includes(profiles[1].target));
  assert.ok(profiles[1].known.includes(profiles[0].target));
  const nonce = crypto.randomUUID().slice(0, 8);
  const messages = [
    `Live chat test ${nonce}: Namaskara! Ready to practice Kannada?`,
    `Live chat test ${nonce}: Yes! Let’s exchange Kannada and Hindi.`,
  ];
  const received = [[], []];
  await Promise.all(
    clients.map(
      (c, i) =>
        new Promise((resolve, reject) => {
          const channel = c
            .channel(`verify-chat-${sessions[i].id}-${nonce}`)
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "peer_messages",
                filter: `recipient_id=eq.${sessions[i].id}`,
              },
              (event) => {
                if (messages.includes(event.new.content))
                  received[i].push(event.new.content);
              },
            );
          channels.push({ c, channel });
          const timer = setTimeout(
            () =>
              reject(
                new Error(`Account ${i + 1}: Realtime subscription timed out`),
              ),
            20000,
          );
          channel.subscribe((status) => {
            if (status === "SUBSCRIBED") {
              clearTimeout(timer);
              resolve();
            } else if (status === "CHANNEL_ERROR") {
              clearTimeout(timer);
              reject(new Error(`Account ${i + 1}: Realtime channel error`));
            }
          });
        }),
    ),
  );
  for (let i = 0; i < 2; i++) {
    const { error } = await clients[i]
      .from("peer_messages")
      .insert({
        sender_id: sessions[i].id,
        recipient_id: sessions[1 - i].id,
        content: messages[i],
      });
    if (error) throw new Error(`Message ${i + 1}: ${error.message}`);
  }
  const deadline = Date.now() + 15000;
  while (
    (!received[0].includes(messages[1]) ||
      !received[1].includes(messages[0])) &&
    Date.now() < deadline
  )
    await new Promise((resolve) => setTimeout(resolve, 200));
  assert.ok(
    received[0].includes(messages[1]),
    "Account A did not receive B’s message through Realtime",
  );
  assert.ok(
    received[1].includes(messages[0]),
    "Account B did not receive A’s message through Realtime",
  );
  for (let i = 0; i < 2; i++) {
    const r = await clients[i]
      .from("peer_messages")
      .select("content")
      .in("content", messages);
    if (r.error) throw r.error;
    assert.equal(
      r.data.length,
      2,
      "Both messages must survive a fresh database read",
    );
  }
  const unauthenticated = createClient(url, key, {
    auth: { persistSession: false },
  });
  const denied = await unauthenticated.from("peer_messages").select("id");
  assert.ok(
    denied.error || denied.data?.length === 0,
    "Unauthenticated users must not read chat",
  );
  proof = {
    verifiedAt: new Date().toISOString(),
    project: new URL(url).hostname,
    distinctAuthenticatedAccounts: 2,
    learners: profiles.map((p) => ({
      name: p.name,
      known: p.known,
      proficiency: p.proficiency,
      target: p.target,
    })),
    reciprocalPair: true,
    realtimeMessagesReceivedBothDirections: true,
    persistedMessages: 2,
    unauthenticatedChatAccessDenied: true,
  };
  console.log(JSON.stringify(proof, null, 2));
} finally {
  await Promise.all(channels.map(({ c, channel }) => c.removeChannel(channel)));
  await Promise.all(clients.map((c) => c.auth.signOut({ scope: "local" })));
}
