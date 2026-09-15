---
project: vroomly
platform: Cloudflare Workers
planned_at: 2026-09-15
status: in-progress
github_repo: https://github.com/grzeg/vroomly
---

# Vroomly — First Production Deployment (Cloudflare Workers)

## Context

`context/foundation/infrastructure.md` (this session's earlier research) recommends deploying Vroomly to Cloudflare Workers — the project is already scaffolded for it (`@astrojs/cloudflare` adapter, `wrangler.jsonc`), matches the developer's existing familiarity, and stays free at MVP scale. This plan executes that recommendation as the actual first deploy.

Recon at plan time turned up a gap between what the repo's own docs (README.md, CLAUDE.md) claimed and what actually existed:
- No git repository at all — not initialized, no remote, no commits.
- No `.env.example` despite README instructing `cp .env.example .env`/`.dev.vars`.
- No `.github/workflows/ci.yml` despite README/CLAUDE.md describing a lint+build CI gate.
- No `.nvmrc` despite README claiming Node v22.14.0 is pinned there.
- Worker was still named `10x-astro-starter` (scaffold default), not `vroomly`.
- `src/lib/supabase.ts`'s `createClient` silently returns `null` (no throw) if `SUPABASE_URL`/`SUPABASE_KEY` are missing/misnamed — a deploy with bad secrets succeeds and *looks* fine (unauthenticated `/dashboard` still redirects correctly) while auth is actually dead. This makes post-deploy auth verification non-negotiable.

User decisions made before execution:
1. Initialize git now, create a GitHub repo via `gh`, push.
2. User already has an existing Supabase project — the plan asks them to supply the URL/key themselves at the right step; the agent never types/pastes real secret values.
3. Rename the Worker to `vroomly` before the first deploy.
4. Create `.github/workflows/ci.yml` now (lint+build gate); do **not** wire auto-deploy-on-merge yet (see step 11 for why).

Steps marked **[USER]** require the user to act personally (interactive OAuth, entering credentials, account/repo creation confirmation) — prohibited or high-risk for the agent to perform directly. Steps marked **[GO-AHEAD]** are visible/state-changing (GitHub repo creation, first production deploy) and need explicit confirmation at execution time.

## Steps

### 1. Local hygiene fixes — done

- Created `.env.example` (`SUPABASE_URL=`, `SUPABASE_KEY=`).
- Created `.nvmrc` pinned to `22.14.0` (matches README/CLAUDE.md's existing claim; local shell is on Node v24.15.0 — install 22.14.0 via nvm/fnm for local build parity if needed).
- Renamed the Worker in `wrangler.jsonc`: `10x-astro-starter` → `vroomly`.
- Renamed `package.json`'s top-level `name` to `vroomly` for identity consistency.
- Added `deploy` (`astro build && wrangler deploy`) and `tail` (`wrangler tail`) npm scripts so `npm run deploy`/`npm run tail` resolve the locally pinned `wrangler` via `node_modules/.bin` instead of `npx wrangler`, which floats to a newer unpinned version.

### 2. CI workflow — done

`.github/workflows/ci.yml` created: lint+build gate on push/PR to `master`, using `SUPABASE_URL`/`SUPABASE_KEY` repo secrets for the build step. No deploy job (see step 11).

### 3. README accuracy fix — done

Title, clone URL, and deployment section updated to match the real repo and the new `npm run deploy` script.

### 4. Git init + first commit — done

`git init -b master`, reviewed `git status --short` (no secrets found — `.env` contains only an unrelated `CLAUDE_CONFIG_DIR=` line; `.claude/settings.local.json` has no secrets), `git add -A`, committed.

### 5. GitHub repo creation + push — done, with a correction mid-flight

First created under the wrong account (`gmartowski-xebia`) — left in place at `https://github.com/gmartowski-xebia/vroomly` per user's instruction (not deleted), git remote for it kept locally as `xebia`.

User then asked to use `grzegorz.martowski@gmail.com` instead. Re-authenticated `gh` via device-code flow (`gh auth login --web`, then `gh auth refresh -s workflow` for the scope needed to push workflow files), switched active account (`gh auth switch --user grzeg`), and created the real target repo:

**`https://github.com/grzeg/vroomly`** — `origin` remote, `master` pushed.

Note: pushing initially failed with a 403 because macOS's `osxkeychain` credential helper had cached the previous account's token for `github.com` and took priority over `gh`'s own credential helper. Fixed with `gh auth setup-git`, which registers `gh auth git-credential` as the per-host helper for `github.com`/`gist.github.com`, taking precedence over the global `osxkeychain` default.

### 6. GitHub repo secrets — pending, **[USER]**

```bash
gh secret set SUPABASE_URL --repo grzeg/vroomly
gh secret set SUPABASE_KEY --repo grzeg/vroomly
```
Each prompts interactively for the value — the agent does not type/paste real secret values. (Schema field is `optional: true`, so CI runs before these are set just build without them rather than failing on their absence.)

### 7. Local Cloudflare auth + local Supabase dev secrets — pending, **[USER]**

- `./node_modules/.bin/wrangler login` — interactive OAuth browser flow, user-only. Verify after with `./node_modules/.bin/wrangler whoami`. If the account has multiple Cloudflare accounts, note the `account_id` from that output in case later commands prompt ambiguously.
- `cp .env.example .dev.vars` (agent can do this — empty placeholders, gitignored).
- User fills in `.dev.vars` with their existing Supabase project's URL/anon key from the Supabase dashboard themselves.
- Optional sanity check: `npm run dev`, visit `/dashboard`, confirm redirect to `/auth/signin` (proves middleware wiring, not secret correctness — see step 10's caveat).

### 8. Production secrets — pending, after steps 6/7

```bash
./node_modules/.bin/wrangler secret put SUPABASE_URL
./node_modules/.bin/wrangler secret put SUPABASE_KEY
```
**[USER]** enters values at each interactive prompt — never via `--var` (keeps secrets out of shell history/process args). If `secret put` errors because the `vroomly` Worker doesn't exist on Cloudflare yet, deploy once first (step 9), then run these, then redeploy.

### 9. First deploy — pending, **[GO-AHEAD]**

```bash
npm run deploy
```
Confirm with the user before running — first-ever publish, live at a public `*.workers.dev` URL. Watch for a first-time subdomain-registration prompt or a multi-account picker if applicable.

### 10. Post-deploy verification — pending

Agent-checkable directly: root URL loads (200), `/dashboard` unauthenticated redirects to `/auth/signin`, `wrangler tail`/`npm run tail` shows no runtime errors while poking the URL.

**Not sufficient on its own** — the silent-null bug (see Context) means an unauth redirect looks identical whether secrets are correct or completely broken. **[USER]** must sign up/sign in on the live URL themselves (agent cannot enter credentials or create accounts) and confirm `/dashboard` actually renders post-login. Do this promptly — Cloudflare's free-tier log retention is only ~3 days.

### 11. CI auto-deploy: deferred, not part of this plan

Recommendation: keep CI at lint+build only for now; keep deploys manual via `npm run deploy`. This is the *unproven* first deploy — no manual path has been exercised yet to hand off to automation; the app is solo/after-hours with ~3-day log retention, so an unattended auto-deploy could ship the silent-null secret bug straight to production over a quiet stretch unnoticed; wiring auto-deploy also means adding `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` as new GitHub secrets, a surface better introduced once the manual path is trusted. Revisit after a few successful manual deploys, ideally once `src/lib/supabase.ts` is hardened to fail loudly instead of silently on missing secrets.

## Mid-flight fix: CI lint failure

The first CI run on `grzeg/vroomly` failed (`npm run lint`, 20 `@typescript-eslint/no-unsafe-*` errors in `src/middleware.ts`, `src/lib/supabase.ts`, `src/pages/auth/confirm-email.astro`). Root cause: `.astro/types.d.ts` (Astro's generated ambient types for `astro:middleware`/`astro:env/server`) is gitignored and had never been generated in a fresh checkout, so those modules resolved as `any`. Locally this was masked because `npx astro sync` had already been run once by hand.

Fix: added `"postinstall": "astro sync"` to `package.json`'s scripts, so `npm ci`/`npm install` always generates the types first — locally and in CI. Verified by removing `.astro/` and re-running `npm install` + `npm run lint` clean before pushing. Also found and fixed a separate pre-existing gap while investigating: no `.prettierrc.json` existed, so `prettier-plugin-astro` never loaded and `.astro` files failed to parse — added `.prettierrc.json` registering `prettier-plugin-astro` and `prettier-plugin-tailwindcss`.

## Verification checklist

- [x] `npm run lint` and `npm run build` pass locally (including a simulated fresh install).
- [x] CI run green on `grzeg/vroomly` for the postinstall-fix commit.
- [ ] Deployed root URL returns 200; `/dashboard` unauth redirects correctly.
- [ ] **[USER]**-performed sign-in proves auth actually works end-to-end in production.
- [ ] `wrangler tail` shows no runtime exceptions during the verification pass.
