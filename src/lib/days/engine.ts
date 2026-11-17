/**
 * Pure date engine for LoveDays. No I/O, no local-time Date arithmetic.
 * All calendar dates are `YYYY-MM-DD` strings converted to integer epoch-days via UTC.
 */

export const DAY_KINDS = ["once", "countup", "repeat"] as const;
export type DayKind = (typeof DAY_KINDS)[number];

export const REPEAT_UNITS = ["week", "month", "year"] as const;
export type RepeatUnit = (typeof REPEAT_UNITS)[number];

export type DayStatus = "upcoming" | "today" | "elapsed" | "expired";

export interface DayRule {
  kind: DayKind;
  targetDate: string;
  repeatUnit?: RepeatUnit | null;
  repeatInterval?: number | null;
}

export interface ComputedDay {
  status: DayStatus;
  /** Days until displayDate (upcoming) or since targetDate (elapsed/expired). 0 when today. */
  days: number;
  /** Target date, or the next occurrence for repeat days. */
  displayDate: string;
}

const MS_PER_DAY = 86_400_000;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidDate(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(y, mo);
}

function parse(value: string): [number, number, number] {
  const m = DATE_RE.exec(value);
  if (!m) throw new Error(`Invalid date: ${value}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function toEpochDay(value: string): number {
  const [y, m, d] = parse(value);
  return Date.UTC(y, m - 1, d) / MS_PER_DAY;
}

export function fromEpochDay(epochDay: number): string {
  return new Date(epochDay * MS_PER_DAY).toISOString().slice(0, 10);
}

function format(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Add whole months to an anchor date, clamping the day to the month length (no drift). */
export function addMonths(anchor: string, months: number): string {
  const [y, m, d] = parse(anchor);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return format(ny, nm, Math.min(d, daysInMonth(ny, nm)));
}

/** Today's calendar date in an IANA time zone. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Smallest occurrence `anchor + k·interval·unit` that is >= today (k >= 0). */
export function nextOccurrence(
  anchor: string,
  unit: RepeatUnit,
  interval: number,
  today: string,
): string {
  if (!Number.isInteger(interval) || interval < 1) {
    throw new Error(`Invalid repeat interval: ${interval}`);
  }
  const a = toEpochDay(anchor);
  const t = toEpochDay(today);
  if (a >= t) return anchor;

  if (unit === "week") {
    const step = 7 * interval;
    return fromEpochDay(a + Math.ceil((t - a) / step) * step);
  }

  const stepMonths = unit === "year" ? 12 * interval : interval;
  const [ay, am] = parse(anchor);
  const [ty, tm] = parse(today);
  const monthsDiff = (ty - ay) * 12 + (tm - am);
  let k = Math.max(0, Math.floor(monthsDiff / stepMonths));
  let candidate = addMonths(anchor, k * stepMonths);
  while (toEpochDay(candidate) < t) {
    k += 1;
    candidate = addMonths(anchor, k * stepMonths);
  }
  return candidate;
}

export function computeDay(rule: DayRule, today: string): ComputedDay {
  const t = toEpochDay(today);

  if (rule.kind === "repeat") {
    if (!rule.repeatUnit || !rule.repeatInterval) {
      throw new Error("Repeat day requires repeatUnit and repeatInterval");
    }
    const next = nextOccurrence(rule.targetDate, rule.repeatUnit, rule.repeatInterval, today);
    const diff = toEpochDay(next) - t;
    return { status: diff === 0 ? "today" : "upcoming", days: diff, displayDate: next };
  }

  const diff = toEpochDay(rule.targetDate) - t;
  if (diff > 0) return { status: "upcoming", days: diff, displayDate: rule.targetDate };
  if (diff === 0) return { status: "today", days: 0, displayDate: rule.targetDate };
  return {
    status: rule.kind === "once" ? "expired" : "elapsed",
    days: -diff,
    displayDate: rule.targetDate,
  };
}

export interface SortableDay {
  pinned: boolean;
  createdAt: Date | string;
  status: DayStatus;
  days: number;
}

function rank(s: DayStatus): number {
  return s === "today" ? 0 : s === "upcoming" ? 1 : 2;
}

/** Pinned first → today → upcoming (soonest first) → elapsed (most recent first). */
export function sortDays<T extends SortableDay>(days: readonly T[]): T[] {
  return [...days].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const r = rank(a.status) - rank(b.status);
    if (r !== 0) return r;
    const d = a.days - b.days;
    if (d !== 0) return d;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

/** Human-readable Chinese label, e.g. 「还有 12 天」. */
export function describe(title: string, c: ComputedDay): string {
  switch (c.status) {
    case "today":
      return `${title} 就是今天`;
    case "upcoming":
      return `距离 ${title} 还有 ${c.days} 天`;
    case "elapsed":
      return `${title} 已经 ${c.days} 天`;
    case "expired":
      return `${title} 已过期`;
  }
}
