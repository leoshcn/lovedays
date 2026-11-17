import type { DayCategory } from "@/lib/days/categories";

/**
 * Card styles per category (each category has a fixed color), light + `dark:` variants.
 * Static class names so Tailwind can detect them. `label` is the color's Chinese name.
 * - card: low-saturation tint + border (dark: translucent tint over the dark surface)
 * - hero: gradient stops (dark: one step deeper so white text stays calm)
 */
export const COLOR_STYLES: Record<DayCategory, { card: string; hero: string; dot: string; label: string }> = {
  rose: {
    card: "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-400/25",
    hero: "from-rose-500 to-pink-500 dark:from-rose-600 dark:to-pink-700",
    dot: "bg-rose-500 dark:bg-rose-400",
    label: "玫瑰",
  },
  orange: {
    card: "bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-400/25",
    hero: "from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-700",
    dot: "bg-orange-500 dark:bg-orange-400",
    label: "橙",
  },
  amber: {
    card: "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-400/25",
    hero: "from-amber-500 to-yellow-500 dark:from-amber-600 dark:to-yellow-700",
    dot: "bg-amber-500 dark:bg-amber-400",
    label: "琥珀",
  },
  emerald: {
    card: "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-400/25",
    hero: "from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-700",
    dot: "bg-emerald-500 dark:bg-emerald-400",
    label: "翠绿",
  },
  sky: {
    card: "bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:border-sky-400/25",
    hero: "from-sky-500 to-blue-500 dark:from-sky-600 dark:to-blue-700",
    dot: "bg-sky-500 dark:bg-sky-400",
    label: "天蓝",
  },
  violet: {
    card: "bg-violet-50 border-violet-200 dark:bg-violet-500/10 dark:border-violet-400/25",
    hero: "from-violet-500 to-purple-500 dark:from-violet-600 dark:to-purple-700",
    dot: "bg-violet-500 dark:bg-violet-400",
    label: "紫",
  },
  slate: {
    card: "bg-slate-50 border-slate-200 dark:bg-slate-400/10 dark:border-slate-400/25",
    // Already deep; going darker would blend into the dark page background.
    hero: "from-slate-600 to-slate-800",
    dot: "bg-slate-600 dark:bg-slate-400",
    label: "石板",
  },
};

export function colorStyle(category: DayCategory) {
  return COLOR_STYLES[category] ?? COLOR_STYLES.rose;
}
