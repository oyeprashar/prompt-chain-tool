# Prompt Chain Tool

COMS 6998E Week 8 project — superadmin-only Next.js application for creating and executing AI prompt chains.

## Local setup

1. Run `npm install`
2. Copy `.env.example` to `.env.local` and fill in your existing Supabase URL and **anon/publishable key**.
3. Open your **existing Supabase project** → SQL Editor and run [the migration](supabase/migrations/20261103_prompt_chains.sql). This creates only `prompt_chains`, `prompt_chain_steps`, RLS policies, and the step-movement function; it expects `profiles(id, is_superadmin)` to already exist.
4. Run `npm run dev`, then visit http://localhost:3000.

Never commit `.env.local` or a Supabase service-role key.

## Google OAuth

In Supabase Authentication, enable Google OAuth and configure its Google Cloud credentials. For local development, configure Supabase's Site URL as `http://localhost:3000` and allow `http://localhost:3000/auth/callback` as a redirect URL. Add your Vercel URL with `/auth/callback` later.

Google Cloud's authorized redirect URI is the **Supabase Auth URL**, typically `https://YOUR-PROJECT.supabase.co/auth/v1/callback`, not your Next.js callback.

Signed-in users must be able to read their own `profiles.is_superadmin` value. The dashboard and all its server actions verify that flag, and the migration adds database RLS for chains and steps. Do not let ordinary users modify `is_superadmin`.

## Features

- Google login, session handling, sign-out, server-side superadmin gate
- Create, list, update, and delete prompt chains
- Create, update, delete, and reorder prompt steps
- Protected Postgres tables with RLS and atomic per-chain step swap

## Still to build

- Sequential Gemini execution and prompt-to-prompt output passing
- Output/media persistence and history
- Light/dark/system theme selector
- Vercel deployment and authentication testing

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
```
