# Type Safety

- Shared types come from the backend modules with `import type` (erased at build): `DayDto` (`lib/services/days`), `ApiKeyDto`, `ApiScope` (`lib/services/api-keys`), `DayKind`, `RepeatUnit` (`lib/days/engine`), `CreateDayInput`, `DayColor` (`lib/days/schemas`).
- Client components may import runtime values only from pure modules (`lib/days/engine`, `lib/days/schemas`, `components/colors`) — never from `lib/db`, `lib/services` or `lib/auth/auth` as values.
- Path alias `@/*` → `src/*`. No `any` in app code.
