import type { DayCategory } from "@/lib/days/categories";

/**
 * Card styles per category (each category has a fixed color).
 * Static class names so Tailwind can detect them. `label` is the color's Chinese name.
 */
export const COLOR_STYLES: Record<DayCategory, { card: string; hero: string; dot: string; label: string }> = {
  rose: { card: "bg-rose-50 border-rose-200", hero: "from-rose-500 to-pink-500", dot: "bg-rose-500", label: "玫瑰" },
  orange: { card: "bg-orange-50 border-orange-200", hero: "from-orange-500 to-amber-500", dot: "bg-orange-500", label: "橙" },
  amber: { card: "bg-amber-50 border-amber-200", hero: "from-amber-500 to-yellow-500", dot: "bg-amber-500", label: "琥珀" },
  emerald: { card: "bg-emerald-50 border-emerald-200", hero: "from-emerald-500 to-teal-500", dot: "bg-emerald-500", label: "翠绿" },
  sky: { card: "bg-sky-50 border-sky-200", hero: "from-sky-500 to-blue-500", dot: "bg-sky-500", label: "天蓝" },
  violet: { card: "bg-violet-50 border-violet-200", hero: "from-violet-500 to-purple-500", dot: "bg-violet-500", label: "紫" },
  slate: { card: "bg-slate-50 border-slate-200", hero: "from-slate-600 to-slate-800", dot: "bg-slate-600", label: "石板" },
};

export function colorStyle(category: DayCategory) {
  return COLOR_STYLES[category] ?? COLOR_STYLES.rose;
}
