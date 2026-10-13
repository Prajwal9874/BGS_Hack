# fluent.ly

**Find your people. Find your words.** A hackathon MVP for reciprocal language exchange, with daily accountability, focused language tutors, and original exam practice.

Built in `D:\BGS_Hackathon` with Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/Postgres/Realtime, and Gemini through the AI SDK. The dark design uses subtle purple gradients. Partner exchange is the main experience.

## Run the demo

Use Node.js 22 or newer. In PowerShell:

```powershell
cd D:\BGS_Hackathon
npm.cmd ci
npm.cmd run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). For the smoother presentation build, without development overlays:

```powershell
npm.cmd run build
npm.cmd start
```

Stop the dev server before starting production on the same port. No credentials are required for the local demo.

## What works

- Email/password sign-in and signup, with email-link login as an alternative.
- Onboarding: name, known languages with Native/Fluent/Conversational proficiency, target language, level, daily minutes, availability, and bio.
- Reciprocal matching: both learners must know the other's target language. Reliability fit is ranked with a bonus for matching availability.
- One active partner, exchange chat, and a guided 50/50 practice timer with conversation starters. The timer runs locally, not across devices.
- Daily self-reported check-in, streak, reliability, warnings, 24-hour cooldowns, partnership release, and rematching. A check-in counts at most once per IST calendar day.
- Separate tutor conversations for every supported language. Kannada, Hindi, German, Italian, French, Korean, and Japanese are the main demo languages; Tamil/Telugu have starter support, and the other regional languages have basic functionality.
- 70 original practice questions: German/French/Italian A1–C2, Japanese N5–N1, Korean TOPIK 1–6, Kannada/Hindi beginner and intermediate, Tamil/Telugu beginner. Two starter questions per level, with grammar/vocabulary filters, feedback, scores, and history.
- A searchable resource library, bookmarks, free/free-tier labels, and official exam-material links.
- Browser storage for demo progress; authenticated cloud persistence and Realtime exchanges when Supabase is configured.

## Demo and live data

The app starts in **Demo mode**. Every demo partner is a sample person. Partner replies are simulated and labeled. Progress lives in this browser and survives refresh. **Load sample** supplies a clearly labeled example journey with a partner, a six-day streak, 14 completed days, and one missed day.

Tutors use a scripted offline coach when Gemini is absent, sign-in is required, quota is reached, or the provider fails. It supports greetings, starter grammar, and a short greeting quiz. It does not pretend to provide personalized AI corrections. Every tutor reply labels its source.

**Live account** uses real Supabase users only; demo partners are never seeded into the live directory. Sign-in does not automatically move or upload demo histories. Live mode must be selected explicitly under account settings after sign-in. Returning to demo does not change cloud data.

## Add Supabase

1. Use a **new, dedicated Supabase project**. `supabase/schema.sql` creates new tables and functions and is intended to run once, not against an existing unrelated schema.
2. Run `supabase/schema.sql` in the project's SQL editor. The final statement adds `profiles` and `peer_messages` to the Realtime publication. If the schema committed but this last statement failed, enable those two tables under Database → Replication instead of rerunning the whole schema.
3. Copy `.env.example` to `.env.local`, then fill in:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

4. Enable email authentication. Configure the Auth Site URL and allowed redirect URLs for `http://127.0.0.1:3000` and your eventual deployment URL. Make sure email delivery is configured; default email restrictions may limit testing to your own addresses.
5. Restart Next.js. Open account settings, send a sign-in link, follow the link, and choose **Open live account**.
6. Test with two separate browser profiles/accounts. For example: learner A knows Hindi and English and targets Kannada; learner B knows Kannada and targets Hindi. Save both profiles, pair from A, then exchange messages in both browsers.

No `service_role` key is used. Signed-in learners can read the matching directory. Profiles include their display names and learning preferences, not their email addresses. Only the paired users can read or send exchange messages. Learning histories and bookmarks are user-owned. Stats and pairing are changed through authenticated database functions rather than editable client fields.

The privileged implementations live in the non-exposed `private` schema; public RPC wrappers run as the caller. Run Supabase's Security Advisor after applying the schema. The local test verifies SQL/RLS behavior but cannot validate your project's Auth delivery, REST configuration, or Realtime service.

## Add Gemini

Create a key in [Google AI Studio](https://aistudio.google.com/) and add it to `.env.local`:

```dotenv
GEMINI_API_KEY=YOUR_KEY
GEMINI_MODEL=gemini-3.1-flash-lite
ALLOW_DEMO_AI=false
```

The model is configurable because availability can vary by account and change over time. Use a current text model available to your key. The key stays on the server and must never have a `NEXT_PUBLIC_` prefix.

By default, paid AI requests require a valid Supabase user and the schema's quota function: at most 10 requests per minute and 100 per day per account. A private, supervised hackathon preview may set `ALLOW_DEMO_AI=true` to let demo users call Gemini; this bypasses the account quota and should not be enabled on a public deployment. Set a provider spending limit before enabling it.

Tutor requests contain only the selected language's recent history, with role and length validation. The system instructions restrict the tutor to language learning. These are prompt-based constraints, not a guarantee against every off-topic model response. Verify important grammar and exam advice with official sources.

## Accountability rules

- Reliability = completed days / (completed + missed days), rounded to a percentage. New learners start at 100%.
- A first missed day warns and resets the streak.
- A second lifetime missed day pauses matching and check-ins for 24 hours.
- A third and later missed day releases the partnership and applies a 24-hour cooldown.
- Days touched by a cooldown are exempt from new missed-day penalties, so learners can recover.
- Resources, tutors, and quizzes remain accessible. The demo also leaves existing partner chat available.
- Live missed days are evaluated when the account is refreshed or a protected action runs. This MVP does not run a background scheduler or send warning emails.
- Demo presenter controls let you simulate a missed day or advance 24 hours. Clock advancement deliberately skips missed-day evaluation for the walkthrough. Reset or reload the sample after presenting the penalties.

All daily boundaries and availability labels use **Asia/Kolkata (IST)** for this MVP. Check-ins are an honest self-report, not proof that a session happened.

## Exam materials

In-app questions are **original educational practice**, not copied previous-year questions, complete model tests, or proficiency certificates. CEFR/JLPT/TOPIK labels organize a small starter bank; the bank is not an official assessment of those levels. Regional levels are informal.

Official materials are linked separately:

- [Goethe exam training](https://www.goethe.de/en/spr/prf/ueb.html)
- [DELF official portal](https://www.france-education-international.fr/diplome/delf-tout-public) — follow the DALF section for C1/C2
- [CILS, University of Siena](https://cils.unistrasi.it/)
- [JLPT official sample questions](https://www.jlpt.jp/e/samples/forlearners.html)
- [TOPIK official portal](https://www.topik.go.kr/)

Official sample or released papers vary by publisher. They have not been imported into the app or described as past papers without verification. Resource access/free tiers can change; WaniKani's first three levels are the free starter tier, with later levels paid.

## Present it in three minutes

1. Start a fresh loop: known Hindi + English, target Kannada, 15 minutes, evening.
2. Explain why Ananya is a match: she knows Kannada and wants Hindi. Point out reciprocal compatibility and reliability fit.
3. Pair, open **My loop**, send a greeting, and start the guided exchange. Explain the two equal practice turns.
4. Log a self-reported check-in and show the streak/reliability dashboard.
5. Under **My loop**, simulate three missed days: warning → cooldown → release. Advance 24 hours and show matching is available again. Load the sample journey to restore a clean presentation.
6. Open **Practice lab**, select German B2 or Japanese N5, answer both questions, and show explanations and the official-material link.
7. Open a language tutor, ask for grammar, switch languages, and show that histories stay separate. Mention whether Gemini is connected or offline scripts are being used.

## Deploy to Vercel

The repository is ready for Vercel's Next.js preset; it has **not been deployed**.

1. Create a remote repository and push this local `main` branch. Git commits are local until a remote is configured.
2. Import the repository into Vercel, using the Next.js framework preset and the default build command `npm run build`.
3. Add the Supabase public variables and server-only Gemini variables in Vercel's environment settings. Keep `ALLOW_DEMO_AI=false` for public deployments. Redeploy after environment changes.
4. Add the Vercel URL to Supabase's Auth redirect allowlist and update the Auth Site URL for your intended primary deployment.
5. Test sign-in, two-user pairing, bidirectional messages, check-ins, and Gemini on the deployed URL. A missing key falls back visibly rather than breaking the demo.

## Checks and next steps

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

The test suite covers reciprocal matching, reliability, IST check-ins, missed-day transitions, recovery after cooldown, bank integrity, offline tutor behavior, and an actual embedded Postgres run of the schema. Database tests confirm that clients cannot forge stats, spoof messages, read another learner's notes, or send messages to unpaired users. They also verify mutual pairing, partnership release, and tutor quotas.

Before real public use: add partner invitations/acceptance rather than instant pairing, block/report controls, account deletion, and an abuse/privacy review. For the hackathon, the next useful work is connecting credentials, having two teammates test a live exchange, reviewing Kannada/Hindi examples with fluent speakers, and expanding only the question levels the judges are likely to explore.

Deliberately outside this MVP: audio/video calls, speech recognition, payments, full exam-paper ingestion, push notifications, automated background enforcement, and a complete language curriculum.

## Implementation map

- `src/components/fluent-app.tsx`: application screens and forms
- `src/components/exchange-session.tsx`: guided local session timer
- `src/lib/domain.ts`: matching, reliability, demo accountability
- `src/lib/use-fluent.ts`: persistence, live Auth/database/Realtime integration
- `src/lib/data.ts`: languages, sample learners, resources
- `src/lib/questions.ts`: original practice bank
- `src/lib/tutor.ts`: language constraints and offline lessons
- `src/app/api/tutor/route.ts`: validated server-only Gemini calls and fallback
- `supabase/schema.sql`: tables, policies, protected RPCs, Realtime publication
- `tests/`: domain and Postgres integration tests

## Live chat connection work

The dedicated fluent.ly project (swzxdfaojssfcfldixeh, Mumbai) is configured through the Supabase plugin. The schema and Realtime publication are applied, and Security Advisor has no findings. Public variables are in ignored .env.local. Do not rerun the initial schema against this project.

After a dedicated project is configured, create two real test accounts and pair them through the app. For simultaneous browser testing, use separate browser profiles, or open account A on http://127.0.0.1:3000 and account B on http://localhost:3000 so their sessions use separate browser storage.

To verify actual Realtime delivery and persistence, copy `.env.test-accounts.example` to the ignored `.env.test-accounts`, fill in the two test logins, then run:

```powershell
node --env-file=.env.local --env-file=.env.test-accounts scripts/verify-live-chat.mjs
```

The verifier signs in two distinct Auth users, confirms reciprocal pairing and saved proficiency, sends a message in both directions, waits for both Realtime events, rereads both messages from Postgres, and checks that an unauthenticated client cannot read the chat. It never prints passwords or tokens. It does send two labeled test messages into the paired conversation.

## Two-laptop demo on the same Wi-Fi

After Supabase is configured and the production build is made, stop the localhost preview and run `npm.cmd run start:lan`. Open `http://YOUR_HOST_LAPTOP_WIFI_IP:3000` on both laptops. Each laptop signs in to a different learner account. Both browsers connect directly to the same hosted Supabase database and Realtime service. The host laptop must stay on and running; localhost on the second laptop points to that laptop, not the host. A local network may isolate clients, and Windows Firewall may require allowing Node.js on your private network.

Use two different email addresses you control for self-service signup, and verify each email if Supabase requires it. Learner A: proficient in Hindi, targeting Kannada. Learner B: proficient in Kannada, targeting Hindi. Save both profiles, then choose the other learner under Find a partner. Both users should see the pairing and can open My loop to exchange messages. Refresh both pages to check that sessions and chat persist.

Do not expose the local server to the internet by router port forwarding. Use a hosted deployment for laptops on different networks.

## Public preview on different networks

# fluent.ly public demo

Open https://fluent-ly-hackathon.bronze-goat-4359.chatgpt.site on both laptops. They can be on different networks. No local server needs to stay running for this hosted preview.

## Current status

- The public Sites preview is published and connected to the dedicated fluent.ly Supabase project in Mumbai.
- Profiles store known languages, proficiency for each language, target language, learning level and availability.
- Database permissions restrict private learning histories and partner messages. Profiles and messages are enabled for Realtime.
- Production build and all 10 automated tests pass. Supabase Security Advisor has no findings after the database hardening.
- Email confirmation is disabled for the approved hackathon demo. The live Auth settings confirm automatic email signup.
- Two normal-signup accounts passed live login, saved proficiency, reciprocal matching, bidirectional Realtime delivery, persisted messages and unsigned-in chat denial on October 13. Hosted browser login and sending a message also passed; a partner reply appeared without refreshing. Two physical laptops have not been tested by the agent; use the walkthrough below before presenting.

## Two-laptop walkthrough

1. Email confirmation is already disabled. Open Account and connection settings → Create account on each laptop. Use different email addresses and passwords. Choose Open live account after signing in; sample/demo mode stays separate.
2. Learner A: knows Hindi and English; target Kannada. Learner B: knows Kannada; target Hindi. Set each known language's proficiency and save both profiles.
3. Open Find a partner on A and choose B. Both accounts should show each other as their active partner.
4. Open My loop on both laptops. Send a message in each direction and confirm it appears without refreshing. Refresh both pages and confirm messages persist.
5. Use Release partner to repeat the matching demonstration. Existing conversation history is retained; it becomes available when the same learners pair again.

## Demo limits

The public static preview now calls a protected Supabase Gemini tutor endpoint. Until its GEMINI_API_KEY server secret is added, responses are labeled scripted fallback. The main Next.js project also retains the server-side Gemini integration for the later Vercel deployment. The 50/50 session timer is local to each browser. Quiz questions are original practice; official exam materials are linked separately.

Email/password login does not need an email redirect. Magic links need the hosted URL configured under Supabase Authentication → URL Configuration and working email delivery; use passwords for this demo.

Source is in D:\BGS_Hackathon. The public preview's source and hosting manifest are in the Codex workspace work\fluent-public directory. Do not run the initial database schema again against the configured project. Credentials are kept in ignored local environment files; no service-role key is in the frontend.

For later Vercel publication, import the main Next.js repository, add the Supabase public environment variables and an optional server-only Gemini key, and verify the same two-account flow on that URL.


Two generated demo accounts, Aarav and Kavya, are ready. Their passwords are in a private local test-logins guide, not Git or the public site. After verification, the pair was released so Find a partner can demonstrate matching again. To rerun the live verifier, pair them first. The first live-event check missed updates; subsequent independent runs passed. Rehearse on the actual laptops before judging.


## Hosted AI integration

# fluent.ly AI tutor setup

The public demo is connected to the protected fluent-tutor Supabase Edge Function. Tutors keep separate histories per language and learner. The function verifies the Supabase user, claims the existing database quota, and calls Gemini using a server-only key. No service-role key is used by this function.

## Enable public Gemini

1. Create a key at https://aistudio.google.com/apikey using Create API key and choose/create a project.
2. In https://supabase.com/dashboard/project/swzxdfaojssfcfldixeh/functions/secrets, add Name: GEMINI_API_KEY, Value: your key, then Save. Enter the key yourself; do not put it in Git or a NEXT_PUBLIC variable.
3. Open https://fluent-ly-hackathon.bronze-goat-4359.chatgpt.site and sign in. Open Language tutors and send a question. A live response is labeled Gemini. Signed-out demo learners use the labeled offline coach.
4. Tell Codex when the secret is saved so the actual hosted endpoint and browser can be verified with live generation.

The supplied key was saved only in the ignored local .env.local and verified with live Kannada, Hindi and Japanese generation. The Next.js AI SDK route also generated a live Hindi reply. The public Supabase endpoint still needs its own server secret; a local key does not transfer automatically to hosting.

Default model: gemini-3.1-flash-lite. The first tested larger model returned intermittent high-demand errors, so Flash-Lite was selected and passed all three language checks. GEMINI_MODEL can override this default as a Supabase secret or local server environment variable.

## Limits and fallback

Signed-in AI requests are limited to 10 per minute and 100 per day per account. Provider limits or temporary errors return a clearly labeled scripted response. Only the selected tutor's recent history is sent to Gemini. Language-learning restrictions are prompt based; AI replies can still be mistaken and are not official exam materials.

For local Next.js testing, leave NEXT_PUBLIC_TUTOR_URL blank to use /api/tutor and the local GEMINI_API_KEY. The public static preview uses NEXT_PUBLIC_TUTOR_URL pointing to Supabase. The provider key is never a public variable. A later Vercel deployment can use the original server route.

## Verification

13 automated tests, type checking and the main production build pass. Live model generation passed for Kannada, Hindi and Japanese; live Next.js route generation passed. The deployed function rejects unsigned-in requests, validates language/history, restricts browser origins and honors account quotas. The public frontend has been published as Site version 2. Full public Gemini generation remains pending the Supabase secret.

Source: src/lib/edge-tutor.ts, supabase/functions/fluent-tutor/index.js, src/lib/use-fluent.ts. The key-free plugin deployment payload is generated with node scripts/tutor-deployment.mjs. The deployed function verifies tokens itself, so gateway verify_jwt is disabled to support browser preflight and current signing keys; this does not permit unsigned-in AI calls.

