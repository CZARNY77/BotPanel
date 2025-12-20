---
name: botpanel-frontend-plan
description: Frontend plan for Discord bot panel (landing, auth, dashboard).
---

# Plan

Define and ship a modern, user-friendly web panel for the Discord bot with a clear landing page, Discord login, and a post-login dashboard for server management. Assume a new frontend app in this repo (no existing code), using a lightweight SPA stack and a clean API client to talk to the bot backend.

## Requirements
- Landing page that explains what the bot does and includes a "Login with Discord" CTA.
- Discord OAuth2 login handled by the backend (client id/secret in backend .env).
- After login, a dashboard showing servers the user can manage and a path to add the bot to new servers.
- Per-server settings view (read/update) with clear saving and error states.
- Modern, friendly, responsive UI with purposeful typography, color system, and motion.

## Scope
- In: Frontend app scaffolding, routing, UI/UX design, API integration, auth guard, error handling.
- Out: Backend OAuth implementation, bot logic changes, Discord app configuration changes.

## Files and entry points
- `index.html` (app shell)
- `src/main.tsx` (boot)
- `src/App.tsx` (routes/layout)
- `src/pages/Landing.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/ServerSettings.tsx`
- `src/api/client.ts`
- `src/styles/tokens.css`, `src/styles/app.css`
- `src/components/` (buttons, cards, nav, forms, loading states)

## Data model / API changes
- Expect backend endpoints (to be built in ConqBot):
  - `GET /auth/discord` -> redirect to Discord OAuth
  - `GET /auth/discord/callback` -> set session/cookie
  - `GET /api/me` -> user profile
  - `GET /api/servers` -> servers user can manage + bot presence
  - `GET /api/servers/:id/settings` -> current settings
  - `PATCH /api/servers/:id/settings` -> update settings
  - `GET /api/servers/:id/invite` -> OAuth2 invite URL for adding bot

## Action items
[ ] Confirm stack (suggest Vite + React + TypeScript) and scaffold the app.
[ ] Define design system (color tokens, fonts, spacing, button styles, cards).
[ ] Build landing page hero + feature grid + login CTA.
[ ] Implement auth flow (login redirect, session check, logout, loading states).
[ ] Build dashboard (server list with status, filters, add-server CTA).
[ ] Build server settings view (tabs/forms, save/dirty state, success/error alerts).
[ ] Wire API client with standardized error handling and retries for auth expiry.
[ ] Add responsive layout and page-load animations.
[ ] Validate accessibility basics (contrast, focus states, keyboard nav).

## Testing and validation
- Run the dev server and verify layout on mobile and desktop breakpoints.
- Validate login redirect and post-login routing.
- Mock API responses to verify loading, empty, and error states.

## Risks and edge cases
- OAuth redirect URI mismatch between frontend, backend, and Discord app.
- CORS/session cookie issues across domains.
- Missing API endpoints or inconsistent response shapes from backend.
- Server list large; need pagination or lazy load.

## Open questions
- Preferred frontend stack if not React + Vite?
- Branding requirements (name, colors, fonts)?
- What settings should be exposed per server on day one?
