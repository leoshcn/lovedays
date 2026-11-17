import { describe, expect, it } from "vitest";
import {
  countByCategory,
  DAY_CATEGORIES,
  DEFAULT_CATEGORY_NAMES,
  filterDays,
  parseCategory,
  resolveCategoryNames,
  type DayCategory,
} from "./categories";

const d = (id: string, category: DayCategory, pinned = false) => ({ id, category, pinned });

describe("filterDays", () => {
  // AC3: pinned A (work), B (birthday), C (work)
  const days = [d("A", "sky", true), d("B", "orange"), d("C", "sky")];

  it("keeps pinned days regardless of category", () => {
    expect(filterDays(days, "orange").map((x) => x.id)).toEqual(["A", "B"]);
  });

  it("returns everything for 全部 (null)", () => {
    expect(filterDays(days, null).map((x) => x.id)).toEqual(["A", "B", "C"]);
  });

  it("keeps only pinned days when no non-pinned day matches", () => {
    expect(filterDays(days, "violet").map((x) => x.id)).toEqual(["A"]);
  });

  it("preserves order and does not mutate input", () => {
    const input = [d("x", "sky"), d("p", "rose", true), d("y", "sky")];
    const out = filterDays(input, "sky");
    expect(out.map((x) => x.id)).toEqual(["x", "p", "y"]);
    expect(out).not.toBe(input);
  });
});

describe("parseCategory", () => {
  it("accepts valid keys", () => {
    for (const c of DAY_CATEGORIES) expect(parseCategory(c)).toBe(c);
  });

  it("rejects invalid or empty values", () => {
    expect(parseCategory("xxx")).toBeNull();
    expect(parseCategory("")).toBeNull();
    expect(parseCategory(undefined)).toBeNull();
    expect(parseCategory(null)).toBeNull();
    expect(parseCategory(1)).toBeNull();
    expect(parseCategory("Orange")).toBeNull();
  });

  it("takes the first value of a repeated search param", () => {
    expect(parseCategory(["orange", "sky"])).toBe("orange");
    expect(parseCategory([])).toBeNull();
  });
});

describe("resolveCategoryNames", () => {
  it("returns defaults with no overrides", () => {
    expect(resolveCategoryNames()).toEqual(DEFAULT_CATEGORY_NAMES);
    expect(resolveCategoryNames({})).toEqual({
      rose: "纪念日",
      orange: "生日",
      amber: "节日",
      emerald: "生活",
      sky: "工作",
      violet: "学习",
      slate: "其他",
    });
  });

  it("applies overrides and ignores blank ones", () => {
    const names = resolveCategoryNames({ sky: "上班", orange: "   " });
    expect(names.sky).toBe("上班");
    expect(names.orange).toBe("生日");
    expect(names.rose).toBe("纪念日");
  });

  it("does not mutate the defaults", () => {
    resolveCategoryNames({ rose: "改名" });
    expect(DEFAULT_CATEGORY_NAMES.rose).toBe("纪念日");
  });
});

describe("countByCategory", () => {
  it("counts pinned days too", () => {
    const counts = countByCategory([d("A", "sky", true), d("B", "orange"), d("C", "sky")]);
    expect(counts).toMatchObject({ sky: 2, orange: 1, rose: 0 });
  });
});
