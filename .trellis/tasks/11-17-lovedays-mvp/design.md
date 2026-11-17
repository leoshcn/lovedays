# Design: LoveDays MVP

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| App | Next.js (App Router) + React + TypeScript | One deployable for UI, REST API and MCP endpoint |
| Styling | Tailwind CSS v4 | Fast card UI, no component lib needed |
| DB | PostgreSQL via Drizzle ORM | Typed schema + migrations |
| Local DB | PGlite (embedded Postgres, WASM) when `DATABASE_URL` is unset | Zero setup on dev machines |
| Auth | Better Auth (email + password, Drizzle adapter) | Session cookies for web |
| API keys | Own table, SHA-256 hashed, `ld_` prefix | Simple, scoped (read/write) |
| Validation | Zod v4 (also → JSON Schema for OpenAPI and MCP tool inputs) | Single source of truth |
| MCP | `@modelcontextprotocol/sdk`, stateless Streamable HTTP | Agents connect over HTTP with API key |
| Tests | Vitest | Pure date engine is unit tested |

## Layers

```
app/(web pages, server actions)  app/api/v1/*  app/api/mcp
              \                       |              /
               └────── lib/services/days.ts ────────┘   (auth-agnostic: takes userId)
                              |            \
                        lib/db (Drizzle)   lib/days/engine.ts (pure date math)
```

- `lib/days/engine.ts` — pure functions, no I/O: `todayIn(tz)`, `computeDay(day, today)`, `sortDays`.
- `lib/services/days.ts` — CRUD per user; every read first purges expired `once` days for that user (lazy deletion, no cron needed).
- Auth adapters: web uses Better Auth session; API/MCP use `lib/auth/api-key.ts` → `{ userId, scope }`.

## Data model

`day`: id (uuid text), user_id → user.id (cascade), title, note, target_date (`date`, stored as `YYYY-MM-DD` string), kind (`once|countup|repeat`), repeat_unit (`week|month|year` | null), repeat_interval (int | null), pinned (bool), color (text), created_at, updated_at.

`api_key`: id, user_id, name, prefix (first 8 chars for display), key_hash (unique), scope (`read|write`), last_used_at, created_at.

`user.timezone` (additional field, default `Asia/Shanghai`). Better Auth owns `user/session/account/verification`.

## Date engine contract

All dates are calendar dates (`YYYY-MM-DD`), converted to integer epoch-days via UTC — never local `Date` arithmetic.

`computeDay({kind, targetDate, repeatUnit, repeatInterval}, today)` →
`{ status: 'upcoming'|'today'|'elapsed'|'expired', days: number, displayDate: string }`

- once: `>today` upcoming, `=today` today, `<today` expired (to be deleted)
- countup: `>today` upcoming, `=today` today, `<today` elapsed (days = today − target)
- repeat: displayDate = smallest `target + k·n·unit ≥ today` (k ≥ 0); month/year occurrences computed from the original anchor with day clamped to month length

## API

- `GET/POST /api/v1/days`, `GET/PATCH/DELETE /api/v1/days/:id`; responses include computed fields (`status`, `days`, `displayDate`).
- Errors: `{ error: { code: 'unauthorized'|'forbidden'|'not_found'|'validation_error'|'internal', message } }`.
