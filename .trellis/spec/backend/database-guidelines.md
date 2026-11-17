# Database Guidelines

- **ORM**: Drizzle (`drizzle-orm/pg-core`). Schema in `src/lib/db/schema.ts` only.
- **Driver**: `DATABASE_URL` set → `postgres` (postgres-js); unset → embedded PGlite at `./.data/pglite` (`PGLITE_DIR` overrides; tests use `memory://`).
- **Migrations**: edit schema → `pnpm db:generate` → commit `drizzle/*`. Migrations auto-apply at runtime on first `getDb()`. Never hand-edit generated SQL.
- **Access**: always `const db = await getDb()` in request paths (waits for migrations). `rawDb()` exists only to construct Better Auth.
- **Naming**: tables singular snake_case (`day`, `api_key`); columns snake_case in SQL, camelCase in TS.
- **IDs**: `text` primary keys, `crypto.randomUUID()` for app tables (Better Auth generates its own).
- **Dates**: calendar dates use `date(..., { mode: "string" })` (`YYYY-MM-DD`); instants use `timestamp(..., { withTimezone: true })`.
- **Ownership**: every query on user data filters by `userId` — `and(eq(day.id, id), eq(day.userId, userId))`. Missing row → `AppError("not_found")` (do not leak existence across users).
- Better Auth tables (`user`, `session`, `account`, `verification`) must keep field names Better Auth expects; `user.timezone` is an `additionalFields` entry in `lib/auth/auth.ts`.

```ts
// Pattern: delete scoped to owner, detect missing via returning()
const rows = await db.delete(day).where(and(eq(day.id, id), eq(day.userId, userId))).returning({ id: day.id });
if (rows.length === 0) throw new AppError("not_found", "Day not found");
```

### Design Decision: Rename a column in TS only, keep the SQL name

**Context**: `day.color` became the semantic `category` (same 7 keys). A real column rename makes `drizzle-kit generate` stop at an interactive rename prompt, and generated SQL must not be hand-edited.

**Decision**: change the TS property, keep the DB column name; document the mismatch inline.

```ts
// DB column stays "color" (historical): value is the category key; color is derived from it.
category: text("color", { enum: DAY_CATEGORIES }).notNull().default("rose"),
```

**Verify**: after `pnpm db:generate`, the new migration must not touch the table (drizzle diffs by column name). If drizzle-kit prompts about a rename, the mapping is wrong — fix the schema, never answer the prompt with rename.

### Convention: per-user overrides of fixed defaults

Store only rows that differ from the default (`category_label`: PK `(user_id, category)`, FK cascade on user). Saving a blank value **or a value equal to the default** deletes the row; reads merge overrides onto defaults (`resolveCategoryNames`). Every query filters by `userId`.
