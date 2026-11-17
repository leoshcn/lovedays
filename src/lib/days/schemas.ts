import { z } from "zod";
import { DAY_CATEGORIES, type DayCategory } from "./categories";
import { DAY_KINDS, isValidDate, REPEAT_UNITS } from "./engine";

/** Color keys are the category keys (each category has a fixed color). Kept for compatibility. */
export const DAY_COLORS = DAY_CATEGORIES;
export type DayColor = DayCategory;

const dateString = z
  .string()
  .refine(isValidDate, { message: "Must be a valid date in YYYY-MM-DD format" })
  .describe("Calendar date, YYYY-MM-DD");

const fields = {
  title: z.string().trim().min(1).max(50).describe("Title, 1-50 chars"),
  targetDate: dateString.describe("Target date (once/countup) or first occurrence (repeat), YYYY-MM-DD"),
  kind: z
    .enum(DAY_KINDS)
    .describe("once: auto-deleted after the date passes; countup: counts days since after the date; repeat: recurs every n weeks/months/years"),
  repeatUnit: z.enum(REPEAT_UNITS).nullable().describe("Required when kind=repeat"),
  repeatInterval: z.number().int().min(1).max(99).nullable().describe("n in 'every n units', required when kind=repeat"),
  note: z.string().trim().max(500).nullable().describe("Optional note"),
  pinned: z.boolean().describe("Pinned days are listed first"),
  category: z
    .enum(DAY_CATEGORIES)
    .describe(
      "Category key; determines the card color. Default names: rose=纪念日, orange=生日, amber=节日, " +
        "emerald=生活, sky=工作, violet=学习, slate=其他 (users may rename them). Default rose.",
    ),
  color: z
    .enum(DAY_COLORS)
    .describe("Deprecated: alias of category (same keys). Ignored when category is also provided.")
    .meta({ deprecated: true }),
};

/** Category display name: trimmed, 1-10 chars. (Blank = reset to default, handled by the service.) */
export const categoryNameSchema = z.string().trim().min(1, "类别名称不能为空").max(10, "类别名称最多 10 个字");

function checkRepeat(
  v: { kind?: string; repeatUnit?: string | null; repeatInterval?: number | null },
  ctx: z.RefinementCtx,
) {
  if (v.kind === "repeat") {
    if (!v.repeatUnit) ctx.addIssue({ code: "custom", path: ["repeatUnit"], message: "Required when kind is repeat" });
    if (!v.repeatInterval) ctx.addIssue({ code: "custom", path: ["repeatInterval"], message: "Required when kind is repeat" });
  }
}

/** Raw zod shapes — reused by MCP tool input schemas (the MCP SDK takes raw shapes). */
export const createDayShape = {
  title: fields.title,
  targetDate: fields.targetDate,
  kind: fields.kind,
  repeatUnit: fields.repeatUnit.optional(),
  repeatInterval: fields.repeatInterval.optional(),
  note: fields.note.optional(),
  pinned: fields.pinned.optional(),
  category: fields.category.optional(),
  color: fields.color.optional(),
};

export const updateDayShape = {
  title: fields.title.optional(),
  targetDate: fields.targetDate.optional(),
  kind: fields.kind.optional(),
  repeatUnit: fields.repeatUnit.optional(),
  repeatInterval: fields.repeatInterval.optional(),
  note: fields.note.optional(),
  pinned: fields.pinned.optional(),
  category: fields.category.optional(),
  color: fields.color.optional(),
};

export const createDaySchema = z.object(createDayShape).superRefine(checkRepeat);

export const updateDaySchema = z
  .object(updateDayShape)
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required" });

export type CreateDayInput = z.input<typeof createDaySchema>;
export type UpdateDayInput = z.input<typeof updateDaySchema>;
