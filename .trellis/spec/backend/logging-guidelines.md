# Logging Guidelines

Current state: no logging library. The only log is `console.error("[lovedays] unexpected error", err)` in `toAppError` (`src/lib/errors.ts`).

- Prefix logs with `[lovedays]`.
- Log unexpected errors only; expected `AppError`s are not logged.
- Never log API keys, passwords, session tokens or full request bodies.
