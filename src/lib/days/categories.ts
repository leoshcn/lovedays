/**
 * Day categories. Fixed set of 7, bound 1:1 to a card color (the key IS the color key).
 * Users may rename categories (per user); they cannot add, delete or recolor them.
 * Pure module — no DB access, safe to import from client components.
 */

export const DAY_CATEGORIES = ["rose", "orange", "amber", "emerald", "sky", "violet", "slate"] as const;
export type DayCategory = (typeof DAY_CATEGORIES)[number];

export const DEFAULT_CATEGORY: DayCategory = "rose";

export const DEFAULT_CATEGORY_NAMES: Record<DayCategory, string> = {
  rose: "纪念日",
  orange: "生日",
  amber: "节日",
  emerald: "生活",
  sky: "工作",
  violet: "学习",
  slate: "其他",
};

export type CategoryNames = Record<DayCategory, string>;

export function isCategory(value: unknown): value is DayCategory {
  return typeof value === "string" && (DAY_CATEGORIES as readonly string[]).includes(value);
}

/** Parse an untrusted value (e.g. a URL search param) into a category; anything invalid → null. */
export function parseCategory(value: unknown): DayCategory | null {
  const v = Array.isArray(value) ? value[0] : value;
  return isCategory(v) ? v : null;
}

/** Merge the user's overrides onto the default names. Blank overrides fall back to the default. */
export function resolveCategoryNames(overrides: Partial<Record<DayCategory, string>> = {}): CategoryNames {
  const names = { ...DEFAULT_CATEGORY_NAMES };
  for (const c of DAY_CATEGORIES) {
    const o = overrides[c]?.trim();
    if (o) names[c] = o;
  }
  return names;
}

/** Number of days per category (pinned included). */
export function countByCategory(days: readonly { category: DayCategory }[]): Record<DayCategory, number> {
  const counts = Object.fromEntries(DAY_CATEGORIES.map((c) => [c, 0])) as Record<DayCategory, number>;
  for (const d of days) counts[d.category] += 1;
  return counts;
}

/**
 * Home-page filter: pinned days are always kept; non-pinned days are kept only when they
 * match `category`. `null` = 全部. Order is preserved.
 */
export function filterDays<T extends { pinned: boolean; category: DayCategory }>(
  days: readonly T[],
  category: DayCategory | null,
): T[] {
  if (!category) return [...days];
  return days.filter((d) => d.pinned || d.category === category);
}
