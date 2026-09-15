---
project: vroomly
researched_at: 2026-09-15
recommended_platform: Cloudflare Workers
runner_up: Netlify
context_type: mvp
tech_stack:
  language: JavaScript/TypeScript
  framework: Astro 6 (SSR) + React 19 islands
  runtime: Cloudflare Workers (workerd, nodejs_compat)
---

## Recommendation

**Deploy on Cloudflare Workers.**

The project is already scaffolded via `@astrojs/cloudflare` and `npx wrangler deploy` (10x-astro-starter), the developer already has hands-on Cloudflare familiarity, and cost-minimization was the top interview priority — Workers stays fully on the free tier (100k req/day) at this project's small, single-region user scale. Cloudflare passed all five agent-friendly criteria (CLI-first, managed, agent-readable docs, stable deploy API, GA MCP server), the highest of any researched platform. The tech-stack.md hint of `cloudflare-pages` is outdated: Cloudflare now recommends Workers + Static Assets for new SSR projects (Pages is not deprecated, but its capabilities have folded into Workers as of early 2026) — the project's existing `wrangler deploy` command is already the correct, current path.

## Platform Comparison

### Scoring Matrix

| Criterion | Cloudflare | Vercel | Netlify | Render | Railway | Fly.io |
|---|---|---|---|---|---|---|
| CLI-first maintenance | **Pass** | Pass | Partial | Partial | Partial | Pass |
| Managed / serverless | **Pass** | Pass | Pass | Pass | Pass | Pass (managed VMs) |
| Agent-accessible docs | **Pass** | Pass | Pass | Pass | Pass | Pass |
| Stable deployment API | **Pass** | Pass | Partial | Pass | Partial | Pass |
| MCP / first-class integration | **Pass** (GA) | Pass (GA, read-only) | Pass (GA) | Pass (GA) | Pass (unlabeled) | Partial (beta) |
| **Total** | **5 Pass** | 5 Pass | 3 Pass / 2 Partial | 4 Pass / 1 Partial | 2 Pass / 3 Partial | 4 Pass / 1 Partial |

Notes:
- **Netlify/Render "Partial" on CLI/deploy-API**: no single scriptable rollback command — rollback is a republish action via dashboard or API, not `platform rollback <id>`.
- **Railway "Partial"**: Astro SSR auto-detection is unreliable (community-reported); the platform's own guide recommends a Dockerfile for reliability.
- **Fly.io "Partial" on MCP**: official MCP tooling exists but is explicitly documented as beta.

### Shortlisted Platforms

#### 1. Cloudflare Workers (Recommended)

Full pass on all five criteria. `wrangler deploy` / `wrangler rollback` / `wrangler tail` cover the entire operational loop from a CLI. Docs are markdown-native (`llms.txt`, content-negotiated markdown on any page). An official GA remote MCP server exists. Free tier (100k req/day) covers this project's traffic indefinitely at MVP scale; paid tier is $5/mo for 10M requests if it ever grows. The team already has hands-on familiarity and the project is already scaffolded against this target — zero migration cost.

Trade-off (see cross-check below): the workerd isolate runtime is not Node.js. `@supabase/ssr` and other Node-shaped dependencies need `nodejs_compat`, which is a compatibility shim, not a full Node runtime — this is the platform's real cost, paid in debugging time rather than dollars.

#### 2. Netlify

Official `@astrojs/netlify` adapter, actively maintained by the Astro team. Docs are markdown-native (`llms.txt` + `.md` suffix on any page). Official GA MCP server (deploys, functions, env vars, `netlify.toml` edits). Free tier (300 credits/month) comfortably covers this project's scale. Gap versus Cloudflare: no single CLI command for rollback — republishing a prior deploy is a dashboard/API action. Also runs on a genuine Node.js runtime rather than an edge isolate, which removes the workerd-specific compatibility risk entirely — the strongest reason to swap here if the Cloudflare risks in the register below prove more disruptive than expected.

#### 3. Render

Zero-Docker Node web service — official Astro SSR guide and one-click template exist, `npm install && npm run build` / `node dist/server/entry.mjs`, no Dockerfile authoring required (out of this skill's scope, and out of this team's stated experience). Official GA MCP server (20+ tools). Gap: free-tier services cold-start (~1 min) after 15 minutes idle, which is a poor UX for an auth-gated app if traffic is sparse between sessions — the $7/mo Starter tier removes this and stays cheap. Also lacks a single CLI rollback command like Netlify.

Vercel and Fly.io were researched but excluded from the shortlist: Vercel's Hobby tier carries commercial-use restrictions in its ToS, pushing likely cost to the $20/mo Pro tier against the stated cost-minimize priority; Fly.io requires authoring/maintaining a Dockerfile (this skill's explicit non-goal, and the team has no stated container experience). Railway was excluded for the same Dockerfile-dependency reason (its own docs recommend one for reliable Astro SSR deploys).

## Anti-Bias Cross-Check: Cloudflare Workers

### Devil's Advocate — Weaknesses

1. **Isolate CPU-time limits vs. SSR render cost.** Workers bill/cap CPU time, not wall-clock (free tier ~10ms, paid burst ~30s). A React 19 SSR render with several shadcn/ui islands, or a page issuing several synchronous Supabase queries, risks `Worker exceeded CPU time limit` — a hard kill with no graceful timeout, surfaced to users as a raw error page with no stack trace.
2. **`@supabase/ssr` cookie handling assumes Node-like request/response semantics** that a Fetch-based Astro adapter doesn't provide identically. `createServerClient` wants explicit `get/set/remove` cookie handlers wired to Astro's cookie API, not raw `Headers` — get this wrong and sessions silently drop, since Workers isolates have no shared memory for any in-memory token-caching pattern copied from Node-style examples.
3. **`nodejs_compat` is a compatibility shim, not real Node.** Transitive dependencies of `@supabase/ssr`/`@supabase/supabase-js` touching `stream` or `crypto` internals can throw only in production workerd, never in `wrangler dev` (which itself runs a slightly different workerd build than the deployed edge) — a classic dev/prod parity gap discovered only after `wrangler deploy`.
4. **Secrets aren't auto-synced from `.env`.** `wrangler secret put SUPABASE_KEY` is a separate step from local `.env` config; forgetting it means the build succeeds and deploys fine, but every SSR request 500s at runtime with an opaque "environment variable not defined" error — compounded by a known Astro issue where `astro:env` schema validation can disagree with actual Workers runtime env-binding timing ([astro#13503](https://github.com/withastro/astro/issues/13503)).
5. **Debugging is materially worse than a Node server.** No persistent process, no attachable debugger, just `wrangler tail` output — a Supabase auth bug that only reproduces under concurrent isolates is hard to chase down inside a 3-week, after-hours-only build.

### Pre-Mortem — How This Could Fail

Six months in, the team is fighting fires nobody warned them about. The first crack was subtle: the Supabase SSR client, written assuming Node's fetch/stream semantics, occasionally misbehaved under workerd's stricter isolate model — cookie-refresh logic that worked locally under `astro dev` silently dropped sessions in production, because local dev never exercised the actual deployed runtime. Debugging was miserable: no step-through debugger, just `wrangler tail` output and guesswork, and errors that were clear stack traces in Node became opaque isolate crashes with no line numbers. The team, hired for React/Node experience, had never budgeted time to learn workerd's constraints (no persistent TCP, CPU-time limits, cold-isolate quirks), so every incident took three times longer than a Node engineer would expect. Meanwhile "serverless is cheap" turned into a surprise bill once a Supabase connection-pooling misconfiguration caused request retries to hammer the paid tier. A dependency upgrade broke the Workers build weeks after everyone had moved on, and nobody remembered the wrangler config well enough to fix it fast — the 3-week crunch had left zero documentation behind.

### Unknown Unknowns

- `@supabase/ssr` with `nodejs_compat` still hits `stream`-related "Dynamic require" errors in some reported cases — budget debug time on the auth flow on day one, not after it's built ([supabase/supabase#37592](https://github.com/supabase/supabase/issues/37592)).
- Workers enforce a **1-second module-scope startup limit** (error `10021`), separate from the per-request CPU budget — a shadcn/Radix/zod/Supabase dependency graph can approach this on cold start ([Cloudflare limits](https://developers.cloudflare.com/workers/platform/limits/)).
- Astro 6 dev now runs real workerd via Cloudflare's Vite plugin (better prod parity than earlier Astro versions), but this surfaces new dev-only failure modes, including Preact/React-island collisions in SSR module resolution ([astro#17868](https://github.com/withastro/astro/issues/17868)).
- `wrangler dev --remote` can silently write to **live production** KV/bindings if a separate dev Cloudflare account/resources aren't set up — a real risk for a small team that hasn't provisioned staging resources.
- Workers Logs on the free tier retain only ~3 days / ~6M events — for after-hours debugging of an issue discovered days later, the logs may already be gone; check logs the same week an issue is reported.

**Decision**: proceeded with Cloudflare Workers, risks logged into the register below rather than triggering a platform swap — team judged them manageable given free-tier scale, existing familiarity, and zero migration cost from the current scaffold.

## Operational Story

- **Preview deploys**: Cloudflare Workers supports preview URLs per deployment via `wrangler versions upload` (staged, not yet live) and `wrangler deploy` for production; PR-based preview automation would need a GitHub Actions step calling wrangler (not configured yet in this project's CI, which currently only runs lint + build).
- **Secrets**: `SUPABASE_URL` / `SUPABASE_KEY` currently live in `.dev.vars` (local, gitignored) and must be separately pushed to production via `wrangler secret put <NAME>` — this is a manual, easy-to-forget step (see Devil's Advocate #4). GitHub Actions CI needs `SUPABASE_URL`/`SUPABASE_KEY` repository secrets for the build step per CLAUDE.md.
- **Rollback**: `wrangler rollback [VERSION_ID]` (find prior versions via `wrangler deployments list`) instantly re-routes 100% of traffic — fast and deterministic, no DB-migration rollback implications since Supabase is external and unaffected by a Workers rollback.
- **Approval**: routine deploys (`wrangler deploy`) may run unattended once CI is wired up. Human-only: rotating `SUPABASE_KEY`, changing the Cloudflare account's billing tier, and any DNS/domain changes.
- **Logs**: `wrangler tail [worker] --format pretty|json` streams live logs from the terminal; Workers Logs dashboard retains ~3 days on the free tier — check promptly after an incident is reported.

## Risk Register

| Risk | Source | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| SSR request killed by CPU-time limit under heavy render or N+1 Supabase queries | Devil's advocate | L | M | Keep SSR queries batched/parallel (`Promise.all`), avoid sequential per-row Supabase calls; monitor `wrangler tail` for `1102` errors |
| Supabase SSR cookie handler miswired to Workers' Fetch-based API, causing silent session drops | Devil's advocate | M | H | Follow `@astrojs/cloudflare` + `@supabase/ssr` reference wiring exactly (use `Astro.cookies`, not raw `Headers`); add an explicit auth-session smoke test post-deploy |
| `nodejs_compat` shim gap causes a dependency to fail only in production, never in `wrangler dev` | Devil's advocate / Unknown unknowns | M | M | Test against `wrangler dev --remote` (real workerd) before each deploy, not just local Node-based `astro dev`; watch `supabase/supabase#37592` for compat updates |
| Forgotten `wrangler secret put` after `.env` change causes opaque 500s in production | Devil's advocate | M | H | Add a pre-deploy checklist step (or CI check) diffing `.dev.vars` keys against `wrangler secret list` |
| Debugging production-only Supabase auth bugs is slow without a debugger, especially in an after-hours/part-time schedule | Devil's advocate / Pre-mortem | M | M | Rely on `wrangler tail --format pretty` proactively; keep the auth flow's cookie logic minimal and well-commented since it's the highest-risk surface |
| Workers Logs free-tier retention (~3 days) loses evidence for delayed bug reports | Unknown unknowns | M | L | Check `wrangler tail`/dashboard logs within the same week of any reported issue; consider a lightweight external logging sink if bugs start slipping past the retention window |
| `wrangler dev --remote` writes to production KV/bindings without a separate dev environment | Unknown unknowns | L | M | This project doesn't use Workers-native KV/D1/R2 (Supabase is external), so exposure is currently minimal; revisit if any Cloudflare-native binding is added later |
| Module-scope 1s startup limit (`10021`) hit as dependency graph (shadcn/Radix/zod/Supabase) grows | Unknown unknowns | L | M | Watch cold-start times in `wrangler tail`; keep top-level imports lean, defer heavy client-only libraries to islands |
| Vendor lock-in to workerd-specific patterns (cookie wiring, compat flags) makes a future platform migration nontrivial | Research finding | L | L | Keep Supabase/auth logic behind a thin abstraction where practical; not a near-term MVP concern |

## Getting Started

1. Confirm the existing scaffold already targets Workers correctly: check `wrangler.jsonc`/`wrangler.toml` for `compatibility_flags = ["nodejs_compat"]` and a recent `compatibility_date` (≥2026-08-04 makes `nodejs_compat` default-on).
2. Push production secrets (not yet in Wrangler): `npx wrangler secret put SUPABASE_URL` and `npx wrangler secret put SUPABASE_KEY`.
3. Deploy: `npx wrangler deploy`.
4. Verify auth end-to-end against the deployed URL (sign up, sign in, session persistence across a reload) — this is the highest-risk surface per the cross-check above.
5. Tail logs during/after the first real deploy: `npx wrangler tail --format pretty`.
6. Add `SUPABASE_URL` and `SUPABASE_KEY` as GitHub Actions repository secrets so `.github/workflows/ci.yml`'s build step passes.

## Out of Scope

The following were not evaluated in this research:
- Docker image configuration
- CI/CD pipeline setup (beyond noting existing CLAUDE.md CI requirements)
- Production-scale architecture (multi-region, HA, DR)
