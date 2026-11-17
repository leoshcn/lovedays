# Backend Directory Structure

```
src/
  app/
    actions.ts                  # Server actions for the web UI (session auth)
    api/auth/[...all]/route.ts  # Better Auth handler
    api/v1/days/route.ts        # REST: list/create (API key auth)
    api/v1/days/[id]/route.ts   # REST: get/patch/delete
    api/v1/openapi.json/route.ts
    api/mcp/route.ts            # MCP Streamable HTTP endpoint (API key auth)
  lib/
    db/schema.ts                # All Drizzle tables (Better Auth + app)
    db/index.ts                 # getDb() / rawDb(); Postgres or PGlite
    days/engine.ts              # PURE date math (no I/O) + engine.test.ts
    days/schemas.ts             # Zod input schemas + raw shapes for MCP
    services/days.ts            # Day CRUD, lazy purge of expired `once` days
    services/api-keys.ts        # API key create/list/revoke/authenticate
    auth/auth.ts | session.ts | client.ts
    mcp/server.ts               # MCP tools → services
    errors.ts                   # AppError, toAppError, errorResponse
    openapi.ts                  # OpenAPI 3.1 document
drizzle/                        # Generated SQL migrations (commit them)
```

## Rules

- **One service layer, three edges.** Web actions, REST and MCP all call `lib/services/*`. Never put business rules in a route, action or MCP tool.
- Services take `userId` as first argument and never read cookies/headers. Edges resolve identity:
  web → `requireUser()` (`lib/auth/session.ts`); REST/MCP → `authenticateRequest(req)` + `requireWrite(p)` (`lib/services/api-keys.ts`).
- Date logic lives only in `lib/days/engine.ts` and must stay pure.
- Adding a day field touches: `db/schema.ts` → migration → `days/schemas.ts` → `DayDto`/`toDto` in `services/days.ts` → `openapi.ts` → UI form.
