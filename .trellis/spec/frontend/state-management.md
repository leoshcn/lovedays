# State Management

- No client state library. Server is the source of truth.
- Reads: server components fetch via services.
- Writes: server actions (`app/actions.ts`) call services then `revalidatePath()`; the page re-renders with fresh data. Do not mirror server lists in client state.
- Actions return `ActionResult` (`{ ok: true, data? } | { ok: false, error }`) — show `error` inline.
- Auth state on the client only via `authClient` (`lib/auth/client.ts`) for sign-in/up/out.
