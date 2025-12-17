# Repository Guidelines

## Project Structure & Module Organization
- App entry lives in `src/main.tsx` and routes in `src/App.tsx`, with shared layout at `src/layouts/PanelLayout.tsx`.
- Feature pages sit in `src/pages`, reusable UI in `src/components`, shared hooks in `src/hooks`, and API helpers/types in `src/api`.
- Global styling and Tailwind layers are in `src/index.css`; design tokens are extended in `tailwind.config.js`.
- Static assets reside in `public/`; Vite config and TypeScript settings are at the repo root.

## Build, Test, and Development Commands
- Install dependencies: `npm install`.
- Run locally with hot reload: `npm run dev` (add `-- --host` to expose on LAN).
- Production build: `npm run build`.
- Preview built assets: `npm run preview`.
- Type-checking/linting: `npm run lint` (runs `tsc --noEmit`).

## Coding Style & Naming Conventions
- TypeScript + React 18 function components; prefer hooks for state/data fetching and keep components focused per file.
- Use Tailwind utility classes for layout and color tokens (`surface`, `accent`, etc.); keep custom CSS minimal and in `index.css`.
- Follow 2-space indentation, single quotes avoided in favor of double quotes (per existing files), and destructure props where practical.
- Name components in `PascalCase`, hooks in `camelCase` with `use` prefix, and files to mirror their exported component/hook names.

## Testing Guidelines
- No automated test suite is present yet; when adding tests, prefer Vitest + React Testing Library in `src/__tests__` or alongside components as `*.test.tsx`.
- Cover data-fetching hooks and routing behavior; stub network calls to `src/api/client.ts` to avoid hitting the live `API_BASE`.
- Keep new features accompanied by targeted tests and run `npm run lint` before opening a PR.

## Commit & Pull Request Guidelines
- Use short, imperative subjects (e.g., `add dashboard stats`) and group work by scope. Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`) are preferred for clarity.
- Keep commits focused; avoid mixing refactors with feature work.
- PRs should include a summary of changes, screenshots or GIFs for UI updates, steps to reproduce/test, and links to related issues/tasks.
- Note any API or configuration changes, especially if adjusting `API_BASE` or authentication flows.

## Configuration & Security Notes
- API endpoints and OAuth entry points are defined in `src/api/client.ts` (`API_BASE`, `API_URL`, `AUTH_URL`). Update these per environment and avoid hardcoding secrets elsewhere.
- The app expects HTTP-only cookies for auth; ensure backend CORS and cookie settings remain compatible when changing origins or enabling `--host`.
