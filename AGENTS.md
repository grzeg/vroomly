# Repository Guidelines

Vroomly is a web app for individual car owners to track fuel costs and maintenance. Built with Astro 6 (server-side rendering), React 19 (interactive islands), TypeScript, Tailwind CSS 4, Supabase (auth + database), and deployed to Cloudflare Workers.

## Build, Test, and Development Commands

- `npm run dev` — start the Astro dev server (Cloudflare workerd runtime)
- `npm run build` — build for production (SSR via `@astrojs/cloudflare`)
- `npm run preview` — preview production build locally
- `npm run lint` — run ESLint with type-checked rules
- `npm run lint:fix` — auto-fix ESLint violations
- `npm run format` — format code and config with Prettier (includes Astro + Tailwind plugins)

Pre-commit hooks (husky + lint-staged) auto-fix TypeScript/Astro files and format JSON/CSS/Markdown on stage.

## Critical Rules & Patterns

**Supabase & Database.** Always enable RLS on new tables with granular per-operation, per-role policies. Migrations live in `supabase/migrations/` with format `YYYYMMDDHHmmss_short_description.sql`. Never expose RLS gaps to the client.

**React Components.** Astro for layout/static content; React only when state/interaction is needed. Extract hooks to `src/components/hooks/`. Components over 150 lines should be split.

**TypeScript.** Strict mode enforced. Unused variables must be prefixed with `_`. Template expressions allow numbers; avoid object/array spreads in template strings.

**Tailwind CSS.** Use `cn()` from `@/lib/utils` (clsx + tailwind-merge) for conditional class merging. Never concatenate class strings manually.

## Project Structure & Naming

- `src/pages/` — Astro routes (file-based)
- `src/pages/api/` — API endpoints (export `const prerender = false`)
- `src/components/` — UI components (Astro + React)
- `src/lib/` — utilities, services, Supabase client
- `src/types.ts` — shared TypeScript types
- **Path alias**: `@/*` maps to `./src/*`
- **API validation**: use Zod for request/response schemas
- **shadcn/ui**: components in `src/components/ui/` (new-york style)

## Testing & CI

No test runner pre-configured. Add Vitest or Playwright as needed. No CI workflow yet; GitHub Actions will run lint + build on push/PR once `.github/workflows/ci.yml` is created.

## Architecture & Auth

See `@CLAUDE.md` for full architecture, rendering mode, auth flow, and Supabase configuration details.
