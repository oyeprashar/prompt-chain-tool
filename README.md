# Prompt Chain Tool

COMS 6998E Week 8 project — a superadmin-only Next.js application for managing and running AI prompt chains.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`
3. Add your Supabase project URL and **anon/publishable key** to `.env.local`
4. Start the app: `npm run dev`
5. Open http://localhost:3000

Do not commit `.env.local`, the Supabase service-role key, or private API keys.

## Supabase setup

This application expects the **existing Supabase project** to have a `public.profiles` table containing:

- `id uuid`, matching `auth.users.id`
- `is_superadmin boolean`

A signed-in user must be able to **SELECT only their own profile row** using Supabase RLS. If your project does not already have a suitable read policy, check its existing policies before adding one. For example:

```sql
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);
```

Ensure RLS is enabled on the table, and avoid creating duplicate or conflicting policies. The app never updates the superadmin flag; only trusted administrators should assign that role.

### Google OAuth

In Supabase Auth, enable the Google provider and configure the Google OAuth credentials. Set **Site URL** to http://localhost:3000 for local development and add these to **Redirect URLs**:

- http://localhost:3000/auth/callback
- https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback

For Google Cloud's authorized redirect URI, use the **Supabase Auth callback URL** displayed by Supabase, typically `https://YOUR-PROJECT.supabase.co/auth/v1/callback`. This is different from the application callback above.

### How authorization works

- `/auth/sign-in` starts Google OAuth
- `/auth/callback` exchanges the OAuth code for a cookie-backed session
- `/dashboard` calls Supabase `getUser()` and reads `profiles.is_superadmin` from the database on the server
- Non-superadmins see `/access-denied`
- Sign-out clears the session

**Security:** A protected UI alone is not sufficient to secure data. Every future mutation/execution endpoint will also check superadmin authorization, and all relevant Supabase tables need appropriate RLS policies.

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
```

## Remaining work

- Prompt chain and step CRUD/reordering
- Sequential Gemini execution
- Generated output history
- Light/dark/system theme
- Vercel production configuration and end-to-end testing
