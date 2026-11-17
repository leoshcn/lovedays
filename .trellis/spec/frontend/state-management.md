# State Management

- No client state library. Server is the source of truth.
- Reads: server components fetch via services.
- Writes: server actions (`app/actions.ts`) call services then `revalidatePath()`; the page re-renders with fresh data. Do not mirror server lists in client state.
- Actions return `ActionResult` (`{ ok: true, data? } | { ok: false, error }`) — show `error` inline.
- Auth state on the client only via `authClient` (`lib/auth/client.ts`) for sign-in/up/out.

## UI filter state lives in the URL

Pattern (home category filter, `?category=<key>`):
- Server page awaits `searchParams` (Promise in Next 16) and parses with a pure helper (`parseCategory`): invalid/empty/array → first valid value or `null` (= 全部). Never throw on bad params.
- Client changes it with `router.replace(url, { scroll: false })` — no history entry per filter click; refresh/bookmark keep it.
- Only apply the param if it still matches data (`active = counts[c] > 0 ? c : null`). If a valid param became stale (last item deleted), clear it once with `router.replace(pathname)` in an effect keyed on `stale`; the next server render passes `null`, so it cannot loop. Leave invalid params alone (they already render as 全部).
- Keep the filtering itself in a pure, unit-tested function (`filterDays`: pinned days are always kept, then filter non-pinned).
- Don't use localStorage for filters (cross-device mismatch, users forget a hidden filter).
