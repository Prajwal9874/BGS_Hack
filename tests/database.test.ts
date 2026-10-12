import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const a = "00000000-0000-4000-8000-000000000001",
  b = "00000000-0000-4000-8000-000000000002",
  outsider = "00000000-0000-4000-8000-000000000003";
test("Postgres integration: guarded profiles, atomic pairing, private messages, check-in and cooldown", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;insert into auth.users values('${a}'),('${b}'),('${outsider}');`,
    );
    const schema = await readFile(
      new URL("../supabase/schema.sql", import.meta.url),
      "utf8",
    );
    // PGlite verifies SQL and RLS, but does not run Supabase's Realtime publication.
    await db.exec(
      schema.replace(
        /alter publication supabase_realtime add table public.profiles, public.peer_messages;/,
        "",
      ),
    );
    const asUser = async (id: string) => {
      await db.exec(
        `reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);`,
      );
    };
    await asUser(a);
    await db.query(`select public.save_profile($1,$2,$3,$4,$5,$6,$7)`, [
      "Prajwal",
      ["Hindi", "English"],
      "Kannada",
      "Beginner",
      "Evening",
      15,
      "Hello",
    ]);
    await asUser(b);
    await db.query(`select public.save_profile($1,$2,$3,$4,$5,$6,$7)`, [
      "Ananya",
      ["Kannada"],
      "Hindi",
      "Beginner",
      "Evening",
      15,
      "Hello",
    ]);
    await asUser(outsider);
    await db.query(`select public.save_profile($1,$2,$3,$4,$5,$6,$7)`, [
      "Yuki",
      ["Japanese"],
      "English",
      "Beginner",
      "Evening",
      15,
      "Hello",
    ]);
    await asUser(a);
    await assert.rejects(
      db.query("update public.profiles set completed=999 where id=$1", [a]),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select public.pair_partner($1)", [outsider]),
      /not reciprocal/,
    );
    await db.query("select public.pair_partner($1)", [b]);
    const paired = await db.query<{ partner_id: string }>(
      "select partner_id from public.profiles where id=$1",
      [b],
    );
    assert.equal(paired.rows[0].partner_id, a);
    await db.query("select public.daily_checkin()");
    await db.query("select public.daily_checkin()");
    const stats = await db.query<{ completed: number; streak: number }>(
      "select completed,streak from public.profiles where id=$1",
      [a],
    );
    assert.equal(stats.rows[0].completed, 1);
    assert.equal(stats.rows[0].streak, 1);
    await db.query(
      "insert into public.peer_messages(sender_id,recipient_id,content) values($1,$2,$3)",
      [a, b, "ನಮಸ್ಕಾರ"],
    );
    await assert.rejects(
      db.query(
        "insert into public.peer_messages(sender_id,recipient_id,content) values($1,$2,$3)",
        [b, a, "Spoof"],
      ),
      /row-level security/,
    );
    await db.query(
      "insert into public.learning_state(user_id,data) values($1,$2)",
      [a, { bookmarks: ["kn1"] }],
    );
    await asUser(outsider);
    assert.equal(
      (await db.query("select * from public.peer_messages")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from public.learning_state")).rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        "insert into public.peer_messages(sender_id,recipient_id,content) values($1,$2,$3)",
        [outsider, a, "Unpaired"],
      ),
      /row-level security/,
    );
    await asUser(b);
    assert.equal(
      (await db.query("select * from public.peer_messages")).rows.length,
      1,
    );
    await asUser(a);
    for (let i = 0; i < 10; i++) {
      assert.equal(
        (
          await db.query<{ ok: boolean }>(
            "select public.claim_tutor_request() as ok",
          )
        ).rows[0].ok,
        true,
      );
    }
    assert.equal(
      (
        await db.query<{ ok: boolean }>(
          "select public.claim_tutor_request() as ok",
        )
      ).rows[0].ok,
      false,
    );
    await db.exec(
      `reset role;update public.profiles set last_evaluated=(now() at time zone 'Asia/Kolkata')::date-1,last_checkin=null,misses=0 where id='${a}';`,
    );
    await asUser(a);
    await db.query("select public.refresh_accountability()");
    assert.equal(
      (
        await db.query<{ misses: number }>(
          "select misses from public.profiles where id=$1",
          [a],
        )
      ).rows[0].misses,
      1,
    );
    await db.exec(
      `reset role;update public.profiles set last_evaluated=(now() at time zone 'Asia/Kolkata')::date-1 where id='${a}';`,
    );
    await asUser(a);
    await db.query("select public.refresh_accountability()");
    await assert.rejects(db.query("select public.daily_checkin()"), /cooldown/);
    // A cooldown must not create an endless cycle of new offenses.
    await db.exec(
      `reset role;update public.profiles set last_evaluated=(now() at time zone 'Asia/Kolkata')::date-1,cooldown_until=now()-interval '1 second' where id='${a}';`,
    );
    await asUser(a);
    await db.query("select public.refresh_accountability()");
    assert.equal(
      (
        await db.query<{ misses: number }>(
          "select misses from public.profiles where id=$1",
          [a],
        )
      ).rows[0].misses,
      2,
    );
    await db.query("select public.daily_checkin()");
    await db.exec(
      `reset role;update public.profiles set last_evaluated=(now() at time zone 'Asia/Kolkata')::date-1,last_checkin=null,cooldown_until=null where id='${a}';`,
    );
    await asUser(a);
    await db.query("select public.refresh_accountability()");
    const released = await db.query<{ id: string; partner_id: string | null }>(
      "select id,partner_id from public.profiles where id in ($1,$2)",
      [a, b],
    );
    assert.ok(released.rows.every((p) => p.partner_id === null));
    await db.exec(`reset role;set role anon;`);
    await assert.rejects(
      db.query("select public.daily_checkin()"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
