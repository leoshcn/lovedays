# API Compatibility (REST + MCP + OpenAPI)

REST (`/api/v1/days`), MCP tools and server actions share `lib/days/schemas.ts` and `lib/services/*`, so a field change lands in all three at once. External callers (API keys, configured agents) must not break.

## Scenario: Renaming / superseding a public field (e.g. `color` → `category`)

### 1. Scope / Trigger
Any change to a field in `createDayShape` / `updateDayShape` / `DayDto`.

### 2. Signatures
- Schema: `category: z.enum(DAY_CATEGORIES).optional()`, `color: z.enum(DAY_CATEGORIES).optional().meta({ deprecated: true })` in both create and update shapes.
- Service: one helper used by create **and** update: `inputCategory(v) => v.category ?? v.color`.

### 3. Contracts
- Output: new field + any derived display field (`category`, `categoryName`) **and** the old field (`color` = `category`, read-only, derived).
- Input: new field preferred; old field accepted as alias; both present → new field wins.
- OpenAPI: `Day.color` has `deprecated: true`; CreateDay/UpdateDay get it from zod `.meta`.

### 4. Validation & Error Matrix
| Input | Result |
|---|---|
| only `color: "sky"` | 201, `category=sky`, `color=sky` |
| `color: "sky", category: "violet"` | `category=violet`, `color=violet` |
| `category: "xxx"` | 400 `validation_error` |
| PATCH with only `color` | updates category |

### 5. Good/Base/Bad Cases
- Good: old client only sends/reads `color` → unchanged behaviour.
- Base: new client uses `category` only.
- Bad: removing `color` from input schema → old scripts get 400.

### 6. Tests Required
`src/lib/services/integration.test.ts`: REST color-only, both fields, PATCH color-only, GET returns all three fields, OpenAPI deprecated markers, MCP `create_day`/`update_day` with the new field.

### 7. Wrong vs Correct
#### Wrong
```ts
category: data.category ?? DEFAULT_CATEGORY, // silently ignores legacy `color`
```
#### Correct
```ts
category: inputCategory(data) ?? DEFAULT_CATEGORY,
```
