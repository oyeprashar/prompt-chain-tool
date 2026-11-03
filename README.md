# Prompt Chain Tool

COMS 6998E Week 8 project — superadmin-only Next.js application for creating and executing AI prompt chains.

## Local setup

1. Run `npm install`
2. Copy `.env.example` to `.env.local` and fill in your existing Supabase URL and **anon/publishable key**.
3. Open your **existing Supabase project** → SQL Editor and run [the migration](supabase/migrations/20261103_prompt_chains.sql). This creates only `prompt_chains`, `prompt_chain_steps`, RLS policies, and the step-movement function; it expects `profiles(id, is_superadmin)` to already exist.
4. Run `npm run dev`, then visit http://localhost:3000.

Never commit `.env.local` or a Supabase service-role key.

## Fixing chain creation permissions

If the dashboard can list chains but creating a chain fails, run
[the permissions repair migration](supabase/migrations/20261103_repair_chain_permissions.sql)
in **Supabase → SQL Editor**, after the original prompt-chain migration.
The repair enables RLS and grants authenticated users table privileges,
while the policies continue to restrict reads and writes to superadmins.

In local development, the create form also displays the Supabase error code
and message, while the terminal logs the full database error. In production,
the error is intentionally generic. If the repair does not help, the database
may have an older table schema with extra required columns.

## Google OAuth

In Supabase Authentication, enable Google OAuth and configure its Google Cloud credentials. For local development, configure Supabase's Site URL as `http://localhost:3000` and allow `http://localhost:3000/auth/callback` as a redirect URL. Add your Vercel URL with `/auth/callback` later.

Google Cloud's authorized redirect URI is the **Supabase Auth URL**, typically `https://YOUR-PROJECT.supabase.co/auth/v1/callback`, not your Next.js callback.

Signed-in users must be able to read their own `profiles.is_superadmin` value. The dashboard and all its server actions verify that flag, and the migration adds database RLS for chains and steps. Do not let ordinary users modify `is_superadmin`.

## Features

- Google login, session handling, sign-out, server-side superadmin gate
- Create, list, update, and delete prompt chains
- Create, update, delete, and reorder prompt steps
- Protected Postgres tables with RLS and atomic per-chain step swap

## Execute a prompt chain

1. Run the [run-history SQL migration](supabase/migrations/20261103_prompt_chain_runs.sql) in the **same** Supabase project. The earlier prompt-chain migration must already have been applied.
2. Add `GEMINI_API_KEY` in your local `.env.local` (server-side only). Rotate any key that was shared in chat or exposed elsewhere.
3. Run `npm run dev`, open a chain with at least one step, enter a starting text prompt or upload a JPG/PNG/WebP image (up to 3 MB), and click **Run chain**.
4. The model receives the image only in the first step; each following step receives the previous text output. Run outputs, including intermediate steps and failures, are saved in `prompt_chain_runs`.
5. Optionally use `GEMINI_MODEL` to override the default `gemini-2.5-flash`.

Note: The first version generates **text/captions from text or image input**. It does not generate new image files or persist the uploaded image. That remains a later enhancement if image generation is required.

## Still to build

- Image generation/output file persistence (currently text generation with optional image input)
- Generated text output history is implemented; richer media gallery remains
- Light/dark/system theme selector
- Vercel deployment and authentication testing

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
```
