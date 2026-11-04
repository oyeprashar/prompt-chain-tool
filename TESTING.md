# Manual acceptance tests

Run these after applying `supabase/migrations/20261103_complete_features.sql`.
Use a test chain so destructive actions do not affect the earlier assignments.

## Preparation
- `git pull origin main && npm install`
- `npm run typecheck && npm run lint && npm run build` must all succeed
- Confirm your local `.env.local` has a valid Supabase URL, publishable key, private Gemini API key and an image-capable `GEMINI_IMAGE_MODEL`
- Run the final SQL migration in the same Supabase project
- Restart `npm run dev`

## Acceptance cases
| # | Action | Expected result |
|---|---|---|
| 1 | Google sign in with a superadmin account | Dashboard shows verified account |
| 2 | Sign in with an account where `is_superadmin` is false | Dashboard inaccessible; access denied |
| 3 | Create a chain named `Acceptance Test` | Appears on dashboard and persists after refresh |
| 4 | Edit name/description of the test chain | Changes persist after refresh |
| 5 | Add text step 1: `Summarize` / `Summarize the input in one sentence.` | Step is saved |
| 6 | Add text step 2: `Make funny` / `Turn the previous summary into a short joke.` | Both steps appear |
| 7 | Edit step 1 title and prompt | New text persists after refresh; no server exception |
| 8 | Move step 2 up, then down | The visible order changes each time and stays after refresh |
| 9 | Text-only run with starting text `A cat learns to program` | Completed run with two distinct step outputs |
| 10 | Upload a JPG/PNG/WebP under 3 MB and run | Completed run, input thumbnail saved, prompts use image details |
| 11 | Add an image-output step: `Illustrate` / `Create a playful cartoon illustration based on the previous text.` | Output type is retained after refresh |
| 12 | Execute an image-output chain | Generated image appears under run history; clicking it opens a signed private URL |
| 13 | Copy/download text outputs | Clipboard/download contains corresponding step results |
| 14 | Switch Light, Dark and System, refresh | Selection persists and System respects OS theme |
| 15 | Delete a step after confirming | Step disappears; cancelling confirmation does nothing |
| 16 | Delete the acceptance-test chain after confirming | Chain disappears; run rows cascade and private media is cleaned up |
| 17 | Visit Vercel deployment in incognito | Public sign-in page visible without Vercel protection |
| 18 | Sign in on Vercel and run a test chain | OAuth callback, Supabase access and Gemini request work |

## If something fails
- Copy the exact error message and the failing operation. Server-action errors appear in the terminal; execution errors also appear near the Run button.
- A missing `output_type` or `input_image_path` database column means the final migration has not been fully applied.
- A storage failure means the `prompt-chain-media` bucket or Storage RLS policies are missing.
- A Gemini HTTP 404 normally calls for checking the model ID against the models accessible to your actual API key.
- GitHub Actions must pass typecheck, lint, and build before production submission.

## Submission
The assignment requires commit-specific Vercel URLs for three apps: public app, admin app, and this prompt-chain tool. Confirm deployment protection is off and all URLs are accessible in an incognito browser.
