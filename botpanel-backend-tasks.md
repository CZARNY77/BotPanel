---
name: botpanel-backend-tasks
description: Backend tasks needed in ConqBot for panel auth and APIs.
---

# Plan

Outline backend tasks needed in ConqBot to support the web panel (Discord OAuth, session auth, and server settings APIs). This is a task list only; implementation will be done later.

## Requirements
- Discord OAuth2 login using `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` from backend `.env`.
- Session or token-based auth for panel requests.
- APIs to list user-manageable servers and read/update per-server settings.
- Endpoint to generate a Discord invite URL to add the bot to new servers.
- Support welcome message configuration (channel, message type, embed fields, variables).
- Support event creation (title, description, date, time, repeating, channel, role, duration) and listing.
- Support emoji triggers (up to 10 per server) with image URL responses.
- Support a Warthog toggle per server.

## Decisions (initial defaults)
- OAuth endpoints stay as `GET /auth/discord` and `GET /auth/discord/callback`.
- After successful login redirect to `https://conqbot-panel.blcdev.com/dashboard`.
- Use server-side sessions stored in MongoDB; set cookie:
  - `HttpOnly`, `Secure`, `SameSite=None`, `Domain=.blcdev.com`, `Path=/`, `Max-Age=604800` (7 days).
- OAuth scopes: `identify` + `guilds` (use guild permissions to detect admin).
- Per-server settings fields (MVP): `prefix`, `language`, `timezone`, `welcomeMessage`, `logChannelId`, `autoRoleId`,
  plus feature flags: `autoModeration`, `eventReminders`, `voicePresence`.
- Add per-server panel config sections:
  - `welcome`: `enabled`, `channelId`, `type` (`embed` or `text`), `text`, `embed` (`title`, `description`, `color`, `showAvatar`).
  - `events`: store scheduled events with `title`, `description`, `date`, `time`, `repeating`, `channelId`, `roleId`, `durationMinutes`.
  - `emojiTriggers`: list of up to 10 items with `emoji` and `imageUrl`.
  - `warthogEnabled`: boolean.
- `DISCORD_REDIRECT_URI=https://conqbot.blcdev.com/auth/discord/callback`
- CORS: allow origin `https://conqbot-panel.blcdev.com`, `credentials=true`.

## Scope
- In: New web routes/handlers, config additions, data model for panel settings, auth middleware.
- Out: Frontend implementation, Discord command changes not required by the panel.

## Files and entry points
- `bot/web/routes.py`
- `bot/web/handlers.py`
- `bot/app.py` (middleware wiring)
- `bot/config.py` (new env vars)
- `bot/repositories/` (panel settings persistence)
- `bot/services/` (Discord API integration for OAuth/guilds)

## Data model / API changes
- Store panel session data (cookie + server-side store or signed JWT).
- Optional: store OAuth access/refresh tokens for the user.
- New settings collection keyed by guild id (if not already in MongoDB).

## Action items
[ ] Add config keys for `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, and panel base URL.
[ ] Implement Discord OAuth2 flow endpoints: `/auth/discord` and `/auth/discord/callback`.
[ ] Add OAuth `state` validation (and optional PKCE) to protect the login flow.
[ ] Add session middleware and a `require_auth` guard for panel APIs.
[ ] Create `GET /api/me` for user identity and avatar.
[ ] Create `GET /api/servers` using OAuth token guilds list, filtered by admin perms and bot membership.
[ ] Create `GET /api/servers/:id/settings` and `PATCH /api/servers/:id/settings`.
[ ] Create `GET /api/invite` (or `GET /api/servers/:id/invite`) to return bot invite URL (bot + applications.commands scopes).
[ ] Add `GET /api/servers/:id/metadata` to return channel and role lists for selects.
[ ] Add `GET /api/servers/:id/welcome` and `PATCH /api/servers/:id/welcome`.
[ ] Add `GET /api/servers/:id/events` and `POST /api/servers/:id/events` (optional `DELETE` for cleanup).
[ ] Add `GET /api/servers/:id/emoji-triggers` and `PATCH /api/servers/:id/emoji-triggers`.
[ ] Add `GET /api/servers/:id/warthog` and `PATCH /api/servers/:id/warthog` to toggle Warthog mode.
[ ] Add CORS and cookie configuration for the panel origin.
[ ] Document response shapes and error codes for frontend use.

## Testing and validation
- Manual OAuth login with a test Discord app.
- Verify guild list permissions and bot-presence status.
- Verify settings read/update in MongoDB.

## Risks and edge cases
- OAuth token storage security and refresh handling.
- Bot not present in guild; need invite flow.
- User has admin in many guilds; pagination needed.
- CORS/cookie settings differ between local and prod.

## Open questions
- Where will the panel be hosted (origin/domain)?
- Should sessions be stored server-side or use signed JWT?
- What initial settings fields are required?
