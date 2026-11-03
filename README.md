# Prompt Chain Tool

COMS 6998E Week 8 assignment. A Next.js + TypeScript + Supabase + Gemini application for managing reusable, multi-step prompt chains.

## Features

- Google OAuth and server-side `profiles.is_superadmin = true` protection
- Create, list, edit, and delete prompt chains
- Create, edit, delete, and reorder prompt steps (up/down controls)
- Per-step output type: **text** or **AI-generated image**
- Run text and/or uploaded images through a chain in order
- Feed each step's text or generated image to the following step
- Save full execution history, including intermediate step outputs
- View uploaded and AI-generated images for each chain via private signed URLs
- Copy/download the text results from each run
- Light, dark, and system theme selector (bottom right)

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required `.env.local` values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-SUPABASE-PUBLISHABLE-OR-ANON-KEY
GEMINI_API_KEY=YOUR-PRIVATE-GEMINI-KEY
GEMINI_MODEL=YOUR-WORKING-TEXT-MODEL
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
```

Never commit `.env.local` or a service-role key. Rotate credentials if they have been shared.

### Database setup for the existing COMS6998 Supabase project

This assignment reuses an existing database. That database already has `prompt_chains`, `prompt_chain_steps`, and `profiles` with **legacy columns**. Do not drop or recreate those tables.

1. Verify Google OAuth and that your own `profiles.is_superadmin` is true, with an authenticated SELECT policy for your profile row.
2. Keep the legacy compatibility columns on `prompt_chain_steps`: `prompt_chain_id`, `step_number`, `name`, `prompt_template`. The Next.js actions write these alongside `chain_id`, `position`, `title`, `prompt`.
3. Verify `prompt_chain_runs` exists. If missing, apply [the runs migration](supabase/migrations/20261103_prompt_chain_runs.sql) **after** the `is_prompt_chain_admin()` function is created.
4. **Apply [20261103_complete_features.sql](supabase/migrations/20261103_complete_features.sql) in Supabase SQL Editor.** It adds the `output_type` column, saved input image path, private `prompt-chain-media` Storage bucket, superadmin-only Storage policies, and updates the step-reorder function to keep legacy `step_number` and new `position` synchronized.
5. Refresh the page after running the SQL.

Do not run the original `CREATE TABLE IF NOT EXISTS` migration expecting it to add missing columns to an existing table: it will not. Check your schema before applying any migrations to this shared project.

### Google OAuth

In Supabase Authentication, enable Google OAuth with your Google Cloud credentials. Add `http://localhost:3000/auth/callback` to Supabase's Redirect URLs. In Google Cloud's OAuth client, use the **Supabase-hosted auth callback** (typically `https://YOUR-PROJECT.supabase.co/auth/v1/callback`) as the authorized redirect URI.

Add the deployed app's `https://YOUR-DOMAIN.vercel.app/auth/callback` to Supabase's Redirect URLs later.

### Run a chain

1. Sign in as superadmin and create a chain.
2. Add text steps such as **Describe image → Make it funny → Generate five captions**.
3. For actual picture generation, set a step's **Output type** to **Generated image** (for example, "Create a playful cartoon scene based on the previous description").
4. Upload an image (JPG, PNG or WebP, up to 3 MB) and/or type starting text.
5. Click **Run chain**; watch results in **Generated media and recent runs**.
6. Select a generated picture to view it in a new tab; copy or download text output as a `.txt` file.

The model must support image output, and image generation can incur different API charges. Set `GEMINI_IMAGE_MODEL` to an image model enabled for your API key. Generated-image steps require the private Storage bucket created by the final migration.

## Vercel production deployment

1. Create a **new Vercel project** from `oyeprashar/prompt-chain-tool`.
2. Set Framework Preset to Next.js and root directory to the repository root.
3. Set production environment variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, and `GEMINI_IMAGE_MODEL`. Do **not** put the private Gemini key in a `NEXT_PUBLIC_` variable.
4. Deploy and add the production `/auth/callback` redirect in Supabase Authentication.
5. In Vercel project settings, disable **Deployment Protection** for the submission deployment so an incognito visitor can reach your sign-in page.
6. Test sign-in, chain CRUD, reordering, text execution, image generation, media history, and themes on the deployed URL.
7. Submit the **commit-specific Vercel deployment URLs** for this tool, your public app, and your admin app, as required by the assignment. Project production-domain links are not necessarily commit-specific deployment URLs.

Note that Vercel execution time limits vary by plan; long image-generation chains may require additional tuning for production.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

There is also a GitHub Actions workflow that runs these checks on pushes and pull requests. Its results must be reviewed before considering production verified.

## Access control

All chain/step server actions check the logged-in user's database superadmin flag. The execution endpoint does the same. RLS controls access to chain records and run history. Private Storage uses superadmin-only object policies and short-lived signed image URLs.
