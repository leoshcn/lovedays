# Error Handling

- Services throw `AppError(code, message)` (`src/lib/errors.ts`) for expected failures. Codes: `unauthorized` 401, `forbidden` 403, `not_found` 404, `validation_error` 400, `internal` 500.
- Services call `schema.parse()` and let `ZodError` propagate; `toAppError()` turns it into `validation_error` with `path: message` details.
- Edges map errors, never services:
  - REST: `try { ... } catch (err) { return errorResponse(err); }` → `{ "error": { "code", "message" } }`
  - MCP: `run()` in `lib/mcp/server.ts` returns `{ isError: true, content: [{ text: "code: message" }] }`
  - Server actions: `wrap()` in `app/actions.ts` returns `{ ok: false, error }`; it re-throws Next.js errors with a `digest` (redirect/notFound).
- Unknown errors are logged once in `toAppError` and returned as generic `internal` — never leak stack traces or SQL.
