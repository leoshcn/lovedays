import { mkdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

interface DbState {
  db: Db;
  ready: Promise<void>;
}

// One connection / PGlite instance per process; survives Next.js dev hot reloads.
const globalForDb = globalThis as unknown as { __lovedaysDb?: DbState };

function create(): DbState {
  const url = process.env.DATABASE_URL;
  if (url) {
    const db = drizzlePostgres(postgres(url, { max: 10 }), { schema });
    return { db: db as unknown as Db, ready: migratePostgres(db, { migrationsFolder: MIGRATIONS_FOLDER }) };
  }
  // Local dev: embedded Postgres (PGlite) persisted under ./.data
  const dataDir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  if (!dataDir.includes("://")) mkdirSync(dataDir, { recursive: true }); // e.g. memory:// in tests
  const db = drizzlePglite(new PGlite(dataDir), { schema });
  return { db: db as unknown as Db, ready: migratePglite(db, { migrationsFolder: MIGRATIONS_FOLDER }) };
}

function state(): DbState {
  globalForDb.__lovedaysDb ??= create();
  return globalForDb.__lovedaysDb;
}

/** Drizzle instance without waiting for migrations. Only for constructing Better Auth. */
export function rawDb(): Db {
  return state().db;
}

/** Drizzle instance after migrations are applied. Use this in every request path. */
export async function getDb(): Promise<Db> {
  const s = state();
  await s.ready;
  return s.db;
}

export { schema };
