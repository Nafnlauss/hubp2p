# Repository Guidelines

## Project Structure & Module Organization
- Source in `src/`:
  - `app/` (Next.js App Router; locales in `src/app/[locale]`; global CSS in `src/app/globals.css`)
  - `components/`, `hooks/`, `lib/` (utils, validations, Supabase), `i18n/` (next-intl), `types/`
  - Middleware: `src/middleware.ts`
- Tests are colocated as `*.test.ts(x)` next to code (e.g., `src/lib/utils/format.test.ts`).
- Path alias: import from `@/*` (e.g., `import { cn } from '@/lib/utils'`).

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js dev server on port 3000.
- `npm run build` / `npm start`: Build and serve production.
- `npm run lint` / `npm run lint:fix`: Lint check/fix with ESLint.
- `npm run format`: Format with Prettier (Tailwind plugin enabled).
- `npm run type-check`: TypeScript type checks.
- `npm test`: Unit tests (watch). `npm run test:run`: run once. `npm run test:coverage`: coverage.
- `npm run test:ui`: Vitest UI. `npm run test:e2e` / `npm run test:e2e:ui`: Playwright E2E (first run `npx playwright install`).
- `npm run test-all`: Lint + type-check + unit tests. `npm run validate-env`: validate env vars.

## Coding Style & Naming Conventions
- Prettier: 2 spaces, single quotes, no semicolons, trailing commas, width 80.
- ESLint: Next.js, `simple-import-sort`, `jsx-a11y`, `unicorn` rules.
- Filenames: camelCase or PascalCase (per `unicorn/filename-case`).
- Components in `src/components` use PascalCase; hooks in `src/hooks` start with `useX`.
- Tailwind is utility-first; classes auto-sorted via Prettier Tailwind plugin.

## Testing Guidelines
- Unit: Vitest + Testing Library; co-locate `*.test.ts(x)` with code; prefer small, focused tests.
- E2E: Playwright; cover critical flows; keep tests idempotent.
- Coverage: target ≥80% on new/changed code; use `npm run test:coverage`.

## Commit & Pull Request Guidelines
- Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`).
- Pre-commit: Husky runs lint-staged; only commit clean diffs.
- Before PR: run `npm run test-all` and relevant E2E; fix lints/types.
- PRs include: clear description, linked issues (e.g., `#123`), screenshots for UI changes, test plan (commands + results), and any env/config notes.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local`, then run `npm run validate-env`.
- Do not commit secrets or `.env*` files.
- Supabase: apply `supabase-rls-policies.sql` and enable RLS in production.
- i18n: pages are locale-scoped under `src/app/[locale]`; add translations in `src/i18n`.

