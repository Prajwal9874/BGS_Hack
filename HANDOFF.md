# fluent.ly — start here

This repository contains the full Next.js project for the hackathon, including its database schema, tutors, practice bank, resource library and tests. Installed dependencies and generated build files are recreated during setup.

## Run it on your laptop

Install Node.js 22 or newer, then:

```sh
git clone https://github.com/Prajwal9874/BGS_Hack.git
cd BGS_Hack
npm install
node scripts/unlock-demo-secrets.mjs
npm run dev
```

Ask Prajwal for the handoff password and enter it when prompted. The encrypted bundle restores `.env.local` (Gemini and Supabase configuration) and `.env.test-accounts` (two demo logins). The password is shared separately and is not in this repository. The decrypted files remain ignored by Git.

Open http://127.0.0.1:3000. Sign in using the demo logins or create your own accounts. Learner A knows Hindi and English and wants Kannada; learner B knows Kannada and wants Hindi. They can match from **Find a partner** and message each other under **My loop**.

Public demo: https://fluent-ly-hackathon.bronze-goat-4359.chatgpt.site

## Shared hackathon backend

The supplied configuration connects to the existing fluent.ly Supabase project. Do **not** rerun `supabase/schema.sql` against that project: it is already configured. The deployed `fluent-tutor` function already has the Gemini secret. AI requires login and retains each language's history separately.

For a separate deployment, follow `README.md` to create your own Supabase project and add environment variables. The tutor URL in the handoff uses the existing Supabase function. Leave `NEXT_PUBLIC_TUTOR_URL` blank to use the local Next.js `/api/tutor` endpoint instead; the supplied local Gemini key supports it too.

## Before judging

```sh
npm test
npm run typecheck
npm run build
```

The demo has passed real two-account Auth, matching, bidirectional Realtime chat and persistence checks, plus live Gemini lessons. Rehearse on the actual presentation laptops. The countdown timer is local to each browser, and exam questions are original practice with official-material links.

See `README.md` for the feature walkthrough, accountability rules and Vercel deployment steps.
