import { z } from "zod";
import { DAY_KINDS, isValidDate, REPEAT_UNITS } from "./engine";

export const DAY_COLORS = ["rose", "orange", "amber", "emerald", "sky", "violet", "slate"] as const;
export type DayColor = (typeof DAY_COLORS)[number];

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
  color: z.enum(DAY_COLORS).describe("Card color"),
};

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
  color: fields.color.optional(),
};

export const createDaySchema = z.object(createDayShape).superRefine(checkRepeat);

export const updateDaySchema = z
  .object(updateDayShape)
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required" });

export type CreateDayInput = z.input<typeof createDaySchema>;
export type UpdateDayInput = z.input<typeof updateDaySchema>;
