"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { DAY_CATEGORIES, type CategoryNames, type DayCategory } from "@/lib/days/categories";
import { COLOR_STYLES } from "./colors";

interface Props {
  counts: Record<DayCategory, number>;
  total: number;
  names: CategoryNames;
  /** Currently active category (already validated); null = 全部 */
  active: DayCategory | null;
}

/** Single-select category chips. State lives in the URL (`?category=<key>`). */
export function CategoryFilter({ counts, total, names, active }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const present = DAY_CATEGORIES.filter((c) => counts[c] > 0);
  if (present.length <= 1) return null;

  function select(c: DayCategory | null) {
    if (c === active) return;
    startTransition(() => {
      router.replace(c ? `${pathname}?category=${c}` : pathname, { scroll: false });
    });
  }

  const chip = (selected: boolean) =>
    `flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
      selected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-stone-500"
    }`;

  return (
    <div
      role="radiogroup"
      aria-label="按类别过滤"
      className={`flex gap-2 overflow-x-auto pb-1 ${pending ? "opacity-60" : ""}`}
    >
      <button type="button" role="radio" aria-checked={active === null} onClick={() => select(null)} className={chip(active === null)}>
        全部 <span className="tabular-nums opacity-70">{total}</span>
      </button>
      {present.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={active === c}
          onClick={() => select(c)}
          className={chip(active === c)}
        >
          <span className={`h-2 w-2 rounded-full ${COLOR_STYLES[c].dot}`} />
          {names[c]} <span className="tabular-nums opacity-70">{counts[c]}</span>
        </button>
      ))}
    </div>
  );
}
