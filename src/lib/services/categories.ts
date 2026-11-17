import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { DAY_CATEGORIES, DEFAULT_CATEGORY_NAMES, resolveCategoryNames, type CategoryNames, type DayCategory } from "@/lib/days/categories";
import { categoryNameSchema } from "@/lib/days/schemas";
import { getDb, schema } from "@/lib/db";

/**
 * Per-user category names. Auth-agnostic: callers resolve the userId first.
 * Only renamed categories are stored; a missing row means the default name.
 */

const { categoryLabel } = schema;

/** Full name table (defaults merged with the user's overrides). One query. */
export async function getCategoryNames(userId: string): Promise<CategoryNames> {
  const db = await getDb();
  const rows = await db
    .select({ category: categoryLabel.category, name: categoryLabel.name })
    .from(categoryLabel)
    .where(eq(categoryLabel.userId, userId));
  return resolveCategoryNames(Object.fromEntries(rows.map((r) => [r.category, r.name])));
}

/** Rename a category for this user. `null` / blank resets it to the default name. */
export async function setCategoryName(userId: string, category: DayCategory, name: string | null): Promise<CategoryNames> {
  const key = z.enum(DAY_CATEGORIES).parse(category);
  const db = await getDb();
  // Blank, or identical to the default name → no override row (keeps "row = renamed" invariant).
  if (name === null || name.trim() === "" || name.trim() === DEFAULT_CATEGORY_NAMES[key]) {
    await db.delete(categoryLabel).where(and(eq(categoryLabel.userId, userId), eq(categoryLabel.category, key)));
  } else {
    const value = categoryNameSchema.parse(name);
    const now = new Date();
    await db
      .insert(categoryLabel)
      .values({ userId, category: key, name: value, updatedAt: now })
      .onConflictDoUpdate({ target: [categoryLabel.userId, categoryLabel.category], set: { name: value, updatedAt: now } });
  }
  return getCategoryNames(userId);
}
