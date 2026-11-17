import { and, eq, lt } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { DayRow } from "@/lib/db/schema";
import { computeDay, describe, sortDays, todayIn, type ComputedDay } from "@/lib/days/engine";
import {
  createDaySchema,
  updateDaySchema,
  type CreateDayInput,
  type UpdateDayInput,
} from "@/lib/days/schemas";
import { AppError } from "@/lib/errors";

/**
 * Day service. Auth-agnostic: callers (web actions, REST, MCP) resolve the userId first.
 * Every read purges the user's expired one-time days (lazy deletion — no cron needed).
 */

export interface DayDto extends ComputedDay {
  id: string;
  title: string;
  note: string | null;
  targetDate: string;
  kind: DayRow["kind"];
  repeatUnit: DayRow["repeatUnit"];
  repeatInterval: number | null;
  pinned: boolean;
  color: string;
  /** Human-readable label, e.g. 「距离 生日 还有 3 天」 */
  label: string;
  createdAt: string;
  updatedAt: string;
}

const { day, user } = schema;

/** Today's date (YYYY-MM-DD) in the user's time zone. */
export async function userToday(userId: string): Promise<string> {
  const db = await getDb();
  const [row] = await db.select({ timezone: user.timezone }).from(user).where(eq(user.id, userId));
  if (!row) throw new AppError("unauthorized", "User not found");
  return todayIn(row.timezone);
}

async function purgeExpired(userId: string, today: string): Promise<void> {
  const db = await getDb();
  await db
    .delete(day)
    .where(and(eq(day.userId, userId), eq(day.kind, "once"), lt(day.targetDate, today)));
}

function toDto(row: DayRow, today: string): DayDto {
  const computed = computeDay(row, today);
  return {
    id: row.id,
    title: row.title,
    note: row.note,
    targetDate: row.targetDate,
    kind: row.kind,
    repeatUnit: row.repeatUnit,
    repeatInterval: row.repeatInterval,
    pinned: row.pinned,
    color: row.color,
    ...computed,
    label: describe(row.title, computed),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Clear repeat fields unless kind is repeat, so stored rows are always consistent. */
function normalizeRepeat<T extends { kind: DayRow["kind"]; repeatUnit?: DayRow["repeatUnit"]; repeatInterval?: number | null }>(
  v: T,
): T {
  return v.kind === "repeat" ? v : { ...v, repeatUnit: null, repeatInterval: null };
}

function assertNotExpired(v: { kind: DayRow["kind"]; targetDate: string }, today: string): void {
  if (v.kind === "once" && v.targetDate < today) {
    throw new AppError("validation_error", "targetDate: 一次性倒数日的日期不能早于今天");
  }
}

export async function listDays(userId: string): Promise<DayDto[]> {
  const today = await userToday(userId);
  await purgeExpired(userId, today);
  const db = await getDb();
  const rows = await db.select().from(day).where(eq(day.userId, userId));
  return sortDays(rows.map((r) => toDto(r, today)));
}

async function findRow(userId: string, id: string): Promise<DayRow> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(day)
    .where(and(eq(day.id, id), eq(day.userId, userId)));
  if (!row) throw new AppError("not_found", "Day not found");
  return row;
}

export async function getDay(userId: string, id: string): Promise<DayDto> {
  const today = await userToday(userId);
  await purgeExpired(userId, today);
  return toDto(await findRow(userId, id), today);
}

export async function createDay(userId: string, input: CreateDayInput): Promise<DayDto> {
  const data = normalizeRepeat(createDaySchema.parse(input));
  const today = await userToday(userId);
  assertNotExpired(data, today);
  const db = await getDb();
  const [row] = await db
    .insert(day)
    .values({
      id: crypto.randomUUID(),
      userId,
      title: data.title,
      targetDate: data.targetDate,
      kind: data.kind,
      repeatUnit: data.repeatUnit ?? null,
      repeatInterval: data.repeatInterval ?? null,
      note: data.note || null,
      pinned: data.pinned ?? false,
      color: data.color ?? "rose",
    })
    .returning();
  return toDto(row!, today);
}

export async function updateDay(userId: string, id: string, input: UpdateDayInput): Promise<DayDto> {
  const patch = updateDaySchema.parse(input);
  const current = await findRow(userId, id);
  // Validate the merged result so partial updates cannot produce an invalid repeat day.
  const merged = normalizeRepeat(
    createDaySchema.parse({
      title: patch.title ?? current.title,
      targetDate: patch.targetDate ?? current.targetDate,
      kind: patch.kind ?? current.kind,
      repeatUnit: patch.repeatUnit !== undefined ? patch.repeatUnit : current.repeatUnit,
      repeatInterval: patch.repeatInterval !== undefined ? patch.repeatInterval : current.repeatInterval,
      note: patch.note !== undefined ? patch.note : current.note,
      pinned: patch.pinned ?? current.pinned,
      color: patch.color ?? current.color,
    }),
  );
  const today = await userToday(userId);
  assertNotExpired(merged, today);
  const db = await getDb();
  const [row] = await db
    .update(day)
    .set({
      title: merged.title,
      targetDate: merged.targetDate,
      kind: merged.kind,
      repeatUnit: merged.repeatUnit ?? null,
      repeatInterval: merged.repeatInterval ?? null,
      note: merged.note || null,
      pinned: merged.pinned ?? false,
      color: merged.color ?? "rose",
      updatedAt: new Date(),
    })
    .where(and(eq(day.id, id), eq(day.userId, userId)))
    .returning();
  return toDto(row!, today);
}

export async function setPinned(userId: string, id: string, pinned: boolean): Promise<DayDto> {
  return updateDay(userId, id, { pinned });
}

export async function deleteDay(userId: string, id: string): Promise<void> {
  const db = await getDb();
  const rows = await db
    .delete(day)
    .where(and(eq(day.id, id), eq(day.userId, userId)))
    .returning({ id: day.id });
  if (rows.length === 0) throw new AppError("not_found", "Day not found");
}
