# Repository Guidelines

## Project Structure & Module Organization
- Entrypoint at `src/main.tsx`; app routing in `src/App.tsx`.
- Layout shell in `src/layouts/PanelLayout.tsx`; feature views live under `src/pages` (Dashboard, Welcome, Events, Emoji, Moderation, auth/landing).
- Reusable UI sits in `src/components`; shared logic in `src/hooks`; API helpers/types are in `src/api/client.ts` and `src/api/types.ts`.
- Global styles and Tailwind layers are defined in `src/index.css`; tokens are extended via `tailwind.config.js`.
- Static assets live in `public/`; backend draft notes sit in `docs/backend-temp-spec.md`; root holds Vite/TypeScript/PostCSS configs.

## Build, Test, and Development Commands
- `npm install` installs dependencies (Node 18+ recommended).
- `npm run dev` starts the Vite dev server; add `-- --host` to expose on LAN or inside containers.
- `npm run build` bundles to `dist/`; `npm run preview` serves the built output locally.
- `npm run lint` runs `tsc --noEmit` for type safety; fix any errors before opening PRs.

## Coding Style & Naming Conventions
- TypeScript + JSX with function components; favor hooks and small, focused files.
- Use 2-space indentation and double quotes to match existing code; prefer Tailwind utilities over custom CSS.
- Name components in `PascalCase`, hooks in `camelCase` with a `use` prefix, and files after their primary export (e.g., `DashboardPage.tsx`).
- Route redirects live in `src/App.tsx`; keep paths aligned with navigation links.

## Testing Guidelines
- No automated suite yet; add tests with Vitest + React Testing Library as `*.test.tsx` near components or in `src/__tests__`.
- Mock calls hitting `src/api/client.ts` to avoid real `API_BASE`; cover routing redirects and auth flows when they are added.
- Run `npm run lint` before commits to catch regressions early.

## Commit & Pull Request Guidelines
- History mixes numeric tags and conventional messages; prefer short, imperative subjects with Conventional Commit prefixes (`feat:`, `fix:`, `chore:`, `docs:`).
- Keep commits scoped; note config changes (e.g., `API_BASE`) in their own commits when possible.
- PRs should summarize scope, add screenshots/GIFs for UI changes, list manual test steps, link related issues/tasks, and call out breaking UX/API changes.

## Security & Configuration Notes
- `API_BASE`, `API_URL`, and `AUTH_URL` live in `src/api/client.ts`; update per environment and never commit secrets or tokens.
- Auth relies on HTTP-only cookies plus a localStorage token; align frontend origin with backend CORS/cookie settings when using `--host` or deploying.
- Before release, run `npm run build` to confirm type checks and bundling succeed.
