import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { AppError } from "@/lib/errors";

export type ApiScope = "read" | "write";

export interface ApiPrincipal {
  userId: string;
  scope: ApiScope;
  keyId: string;
}

export interface ApiKeyDto {
  id: string;
  name: string;
  prefix: string;
  scope: ApiScope;
  lastUsedAt: string | null;
  createdAt: string;
}

const KEY_PREFIX = "ld_";
const { apiKey } = schema;

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(40),
  scope: z.enum(["read", "write"]),
});

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** Creates a key. The plaintext key is returned only once; only its hash is stored. */
export async function createApiKey(
  userId: string,
  input: z.infer<typeof createApiKeySchema>,
): Promise<{ key: string; apiKey: ApiKeyDto }> {
  const data = createApiKeySchema.parse(input);
  const key = KEY_PREFIX + randomBytes(24).toString("base64url");
  const db = await getDb();
  const [row] = await db
    .insert(apiKey)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: data.name,
      prefix: key.slice(0, 10),
      keyHash: hashKey(key),
      scope: data.scope,
    })
    .returning();
  return { key, apiKey: toDto(row!) };
}

function toDto(row: typeof apiKey.$inferSelect): ApiKeyDto {
  return {
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    scope: row.scope,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listApiKeys(userId: string): Promise<ApiKeyDto[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(apiKey)
    .where(eq(apiKey.userId, userId))
    .orderBy(desc(apiKey.createdAt));
  return rows.map(toDto);
}

export async function revokeApiKey(userId: string, id: string): Promise<void> {
  const db = await getDb();
  const rows = await db
    .delete(apiKey)
    .where(and(eq(apiKey.id, id), eq(apiKey.userId, userId)))
    .returning({ id: apiKey.id });
  if (rows.length === 0) throw new AppError("not_found", "API key not found");
}

export interface AuthOptions {
  /**
   * Also accept the key as a `?key=ld_...` query parameter, for clients that cannot send
   * headers (e.g. iOS API Widget). URLs end up in logs and history, so only **read** keys
   * are accepted this way; a write key in the URL is rejected with 403.
   */
  allowQueryKey?: boolean;
}

/**
 * Resolve `Authorization: Bearer ld_...` (or, when allowed, `?key=ld_...`) into a principal.
 * Throws 401 on failure.
 */
export async function authenticateRequest(req: Request, opts: AuthOptions = {}): Promise<ApiPrincipal> {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  const queryKey = opts.allowQueryKey ? new URL(req.url).searchParams.get("key") : null;
  const fromQuery = !match && !!queryKey;
  const key = match?.[1] ?? queryKey ?? undefined;
  if (!key || !key.startsWith(KEY_PREFIX)) {
    throw new AppError(
      "unauthorized",
      opts.allowQueryKey
        ? "Missing or malformed API key. Use 'Authorization: Bearer ld_...' or '?key=ld_...' (read keys only)"
        : "Missing or malformed API key. Use 'Authorization: Bearer ld_...'",
    );
  }
  const db = await getDb();
  const [row] = await db.select().from(apiKey).where(eq(apiKey.keyHash, hashKey(key)));
  if (!row) throw new AppError("unauthorized", "Invalid API key");
  if (fromQuery && row.scope !== "read") {
    throw new AppError("forbidden", "Only read-only API keys may be passed in the URL; create a read key in Settings");
  }
  await db.update(apiKey).set({ lastUsedAt: new Date() }).where(eq(apiKey.id, row.id));
  return { userId: row.userId, scope: row.scope, keyId: row.id };
}

export function requireWrite(p: ApiPrincipal): void {
  if (p.scope !== "write") throw new AppError("forbidden", "This API key is read-only");
}
