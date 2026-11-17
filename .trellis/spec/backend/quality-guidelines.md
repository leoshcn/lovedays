# Backend Quality Guidelines

## Must pass before commit
`pnpm typecheck` · `pnpm test` · `pnpm build`

## Tests (Vitest, `src/**/*.test.ts`)
- `lib/days/engine.test.ts`: pure unit tests — any date rule change needs a test (month-end clamp, leap day, week multiples, time zones).
- `lib/services/integration.test.ts`: in-memory PGlite; exercises services, REST route handlers and the MCP route directly. Set `PGLITE_DIR=memory://` **before** importing `@/lib/db` (use dynamic `await import`).

## Rules
- TS strict + `noUncheckedIndexedAccess`.
- Validate all external input with Zod schemas from `lib/days/schemas.ts`; for partial updates validate the **merged** row (see `updateDay`).
- `once` days: reject past `targetDate`; purge expired ones lazily at the start of every read (`purgeExpired`). No cron.
- Single pin: at most one pinned day per user. Enforced in `createDay`/`updateDay` (`unpinOthers` in the same `db.transaction`), so web, REST and MCP all obey it — never enforce it only in the UI.
- API keys: store only SHA-256 hash; plaintext returned once. Write endpoints/tools must call `requireWrite(p)`.
- Key in URL (`authenticateRequest(req, { allowQueryKey: true })`): only for header-less clients (iOS widget `/api/v1/widget/w12`), read keys only (write key → 403). Never enable it on CRUD routes.

## Forbidden
- Local-time `Date` arithmetic for calendar dates (use `toEpochDay`/`addMonths` in engine).
- Queries on user data without a `userId` filter.
- Business logic in route handlers, actions or MCP tools.
- Using `rawDb()` in request paths.
