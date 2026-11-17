import { describe as suite, expect, it } from "vitest";
import {
  addMonths,
  computeDay,
  describe,
  isValidDate,
  nextOccurrence,
  sortDays,
  todayIn,
} from "./engine";

suite("isValidDate", () => {
  it("accepts real dates and rejects impossible ones", () => {
    expect(isValidDate("2024-02-29")).toBe(true);
    expect(isValidDate("2025-02-29")).toBe(false);
    expect(isValidDate("2025-13-01")).toBe(false);
    expect(isValidDate("2025-1-01")).toBe(false);
  });
});

suite("todayIn", () => {
  it("uses the given time zone", () => {
    const now = new Date("2026-11-17T17:30:00Z");
    expect(todayIn("Asia/Shanghai", now)).toBe("2026-11-18");
    expect(todayIn("America/New_York", now)).toBe("2026-11-17");
  });
});

suite("computeDay: once", () => {
  const rule = { kind: "once" as const, targetDate: "2026-11-20" };
  it("counts down before target", () => {
    expect(computeDay(rule, "2026-11-17")).toEqual({
      status: "upcoming",
      days: 3,
      displayDate: "2026-11-20",
    });
  });
  it("is today on target", () => {
    expect(computeDay(rule, "2026-11-20").status).toBe("today");
  });
  it("expires the day after", () => {
    expect(computeDay(rule, "2026-11-21")).toMatchObject({ status: "expired", days: 1 });
  });
});

suite("computeDay: countup", () => {
  const rule = { kind: "countup" as const, targetDate: "2020-05-20" };
  it("counts elapsed days after target", () => {
    expect(computeDay(rule, "2020-05-21")).toMatchObject({ status: "elapsed", days: 1 });
    expect(computeDay(rule, "2021-05-20")).toMatchObject({ status: "elapsed", days: 365 });
  });
  it("counts down before target", () => {
    expect(computeDay(rule, "2020-05-10")).toMatchObject({ status: "upcoming", days: 10 });
  });
});

suite("addMonths", () => {
  it("clamps to month end without drifting", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-01-31", 2)).toBe("2026-03-31");
    expect(addMonths("2024-02-29", 12)).toBe("2025-02-28");
    expect(addMonths("2024-02-29", 48)).toBe("2028-02-29");
    expect(addMonths("2026-11-15", 3)).toBe("2027-02-15");
  });
});

suite("nextOccurrence", () => {
  it("returns anchor when anchor is today or in the future", () => {
    expect(nextOccurrence("2026-12-01", "month", 1, "2026-11-17")).toBe("2026-12-01");
    expect(nextOccurrence("2026-11-17", "week", 2, "2026-11-17")).toBe("2026-11-17");
  });
  it("handles every n weeks", () => {
    // 2026-11-02 is a Monday; every 2 weeks → 11-16, 11-30
    expect(nextOccurrence("2026-11-02", "week", 2, "2026-11-17")).toBe("2026-11-30");
    expect(nextOccurrence("2026-11-02", "week", 2, "2026-11-16")).toBe("2026-11-16");
    expect(nextOccurrence("2026-11-03", "week", 1, "2026-11-17")).toBe("2026-11-17");
  });
  it("handles every n months with month-end clamping", () => {
    expect(nextOccurrence("2026-01-31", "month", 1, "2026-02-01")).toBe("2026-02-28");
    expect(nextOccurrence("2026-01-31", "month", 1, "2026-03-01")).toBe("2026-03-31");
    expect(nextOccurrence("2026-01-15", "month", 3, "2026-11-17")).toBe("2027-01-15");
    expect(nextOccurrence("2026-01-15", "month", 3, "2026-10-15")).toBe("2026-10-15");
  });
  it("handles every n years including leap day", () => {
    expect(nextOccurrence("2020-05-20", "year", 1, "2026-11-17")).toBe("2027-05-20");
    expect(nextOccurrence("2020-05-20", "year", 1, "2026-05-20")).toBe("2026-05-20");
    expect(nextOccurrence("2024-02-29", "year", 1, "2025-01-01")).toBe("2025-02-28");
    expect(nextOccurrence("2024-02-29", "year", 1, "2027-03-01")).toBe("2028-02-29");
    expect(nextOccurrence("2020-01-01", "year", 5, "2026-11-17")).toBe("2030-01-01");
  });
  it("rejects invalid intervals", () => {
    expect(() => nextOccurrence("2026-01-01", "week", 0, "2026-11-17")).toThrow();
  });
});

suite("computeDay: repeat", () => {
  it("reports days to next occurrence", () => {
    const c = computeDay(
      { kind: "repeat", targetDate: "1995-11-20", repeatUnit: "year", repeatInterval: 1 },
      "2026-11-17",
    );
    expect(c).toEqual({ status: "upcoming", days: 3, displayDate: "2026-11-20" });
  });
  it("is today on an occurrence", () => {
    const c = computeDay(
      { kind: "repeat", targetDate: "2026-10-17", repeatUnit: "month", repeatInterval: 1 },
      "2026-11-17",
    );
    expect(c).toMatchObject({ status: "today", days: 0 });
  });
});

suite("sortDays", () => {
  const mk = (id: string, pinned: boolean, status: "today" | "upcoming" | "elapsed", days: number) => ({
    id,
    pinned,
    createdAt: "2026-01-01T00:00:00Z",
    status,
    days,
  });
  it("orders pinned, today, upcoming asc, elapsed asc", () => {
    const sorted = sortDays([
      mk("e100", false, "elapsed", 100),
      mk("u10", false, "upcoming", 10),
      mk("pin", true, "elapsed", 999),
      mk("u2", false, "upcoming", 2),
      mk("t", false, "today", 0),
      mk("e5", false, "elapsed", 5),
    ]);
    expect(sorted.map((d) => d.id)).toEqual(["pin", "t", "u2", "u10", "e5", "e100"]);
  });
});

suite("describe", () => {
  it("formats labels", () => {
    expect(describe("生日", { status: "upcoming", days: 3, displayDate: "" })).toBe("距离 生日 还有 3 天");
    expect(describe("恋爱", { status: "elapsed", days: 520, displayDate: "" })).toBe("恋爱 已经 520 天");
    expect(describe("考试", { status: "today", days: 0, displayDate: "" })).toBe("考试 就是今天");
  });
});
