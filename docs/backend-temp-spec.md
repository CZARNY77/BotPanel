# Temporary Backend Spec (ConqBot Panel)

Purpose: capture missing data/APIs referenced by the new UI so backend can expose dedicated endpoints instead of overloading existing ones.

## Auth & Transport
- Frontend will supply a short-lived Discord OAuth2 access token with each request (e.g., `Authorization: Bearer <token>`). Token is stored client-side as `conqbot_token`. Backend must validate guild membership/roles per call; do not trust client-supplied roles.
- CORS/cookie settings should continue to support the existing `/api/server_verification` flow.

## Needed Endpoints
- `GET /api/server_roles?server_id=` → returns roles with IDs and member counts. Used on Overview “Manifest” card.
- `GET /api/activity_summary?server_id=` → aggregates hourly/day activity (messages, joins, voice minutes). Replaces current mocked “Aktywność żywa” metrics.
- `POST /api/welcome_settings` with `{ serverId, enabled, channel, type: "embed" | "plain", template }` → saves welcome module configuration. Replace current mock save.
- `GET/POST /api/emoji_triggers` with `{ emojiName, channel, targetUrl }` → manage emoji→media mappings. Currently mocked client-side.
- `PATCH /api/moderation_toggles` with `{ serverId, toggles: { profanity, antiLink, antiCaps, raidMode } }` → persist switch states shown in UI.
- `GET /api/events` could provide history/future events with recurrence metadata; `/api/create_event` remains for creation.

## Notes
- Keep existing endpoints `/api/user_servers`, `/api/get_emojis`, `/api/server_verification`, `/api/create_event`, `/api/change_house_name` intact.
- Any new endpoints should return JSON with `content-type: application/json` and standard error payload `{ message, code? }`.
- Avoid exposing internal bot state directly; provide aggregated/derived metrics instead.
