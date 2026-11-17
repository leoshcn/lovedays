import type { ComputedDay } from "./engine";

/**
 * API Widget (iOS) "W12" template: a top-level JSON array of up to 12 rows.
 * https://apiwidget.com/docs/w12 — key required, value/color optional, ≤ 24 chars each.
 */
export type W12Color = "main" | "muted" | "info" | "success" | "warning" | "danger";

export interface W12Row {
  key: string;
  value?: string;
  color?: W12Color;
}

export const W12_MAX_ROWS = 12;
export const W12_MAX_CHARS = 24;
/** Upcoming days within this many days are highlighted. */
export const W12_SOON_DAYS = 7;

export interface W12Day extends ComputedDay {
  title: string;
  pinned: boolean;
}

/** Truncate by code points (CJK / emoji safe), marking cut text with an ellipsis. */
export function clip(text: string, max = W12_MAX_CHARS): string {
  const chars = Array.from(text);
  return chars.length <= max ? text : chars.slice(0, max - 1).join("") + "…";
}

function value(d: ComputedDay): string {
  switch (d.status) {
    case "today":
      return "就是今天";
    case "upcoming":
      return `还有 ${d.days} 天`;
    case "elapsed":
      return `已经 ${d.days} 天`;
    case "expired":
      return "已过期";
  }
}

function color(d: W12Day): W12Color | undefined {
  if (d.status === "today") return "success";
  if (d.status === "upcoming" && d.days <= W12_SOON_DAYS) return "warning";
  if (d.pinned) return "main";
  return undefined;
}

/** Days must already be sorted (pinned first, then soonest) — see `sortDays`. */
export function toW12Rows(days: readonly W12Day[]): W12Row[] {
  if (days.length === 0) return [{ key: "暂无倒数日" }];
  return days.slice(0, W12_MAX_ROWS).map((d) => {
    const c = color(d);
    return { key: clip(d.title), value: clip(value(d)), ...(c ? { color: c } : {}) };
  });
}
