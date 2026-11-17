import { describe, expect, it } from "vitest";
import { clip, toW12Rows, type W12Day } from "./widget";

const d = (over: Partial<W12Day>): W12Day => ({
  title: "T",
  pinned: false,
  status: "upcoming",
  days: 30,
  displayDate: "2030-01-01",
  ...over,
});

describe("W12 widget rows", () => {
  it("formats status, days and colors", () => {
    expect(
      toW12Rows([
        d({ title: "置顶", pinned: true, days: 100 }),
        d({ title: "今天", status: "today", days: 0 }),
        d({ title: "快到了", days: 7 }),
        d({ title: "还早", days: 8 }),
        d({ title: "在一起", status: "elapsed", days: 520 }),
      ]),
    ).toEqual([
      { key: "置顶", value: "还有 100 天", color: "main" },
      { key: "今天", value: "就是今天", color: "success" },
      { key: "快到了", value: "还有 7 天", color: "warning" },
      { key: "还早", value: "还有 8 天" },
      { key: "在一起", value: "已经 520 天" },
    ]);
  });

  it("caps at 12 rows and 24 characters", () => {
    const rows = toW12Rows(Array.from({ length: 20 }, (_, i) => d({ title: "长".repeat(30) + i })));
    expect(rows).toHaveLength(12);
    expect(Array.from(rows[0]!.key)).toHaveLength(24);
    expect(rows[0]!.key.endsWith("…")).toBe(true);
    expect(clip("🎂".repeat(24))).toBe("🎂".repeat(24));
  });

  it("returns a placeholder row when empty", () => {
    expect(toW12Rows([])).toEqual([{ key: "暂无倒数日" }]);
  });
});
