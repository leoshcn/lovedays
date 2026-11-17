"use client";

import { CalendarHeart, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createDayAction, deleteDayAction, togglePinAction, updateDayAction } from "@/app/actions";
import { countByCategory, filterDays, type CategoryNames, type DayCategory } from "@/lib/days/categories";
import type { DayDto } from "@/lib/services/days";
import { CategoryFilter } from "./category-filter";
import { DayCard } from "./day-card";
import { DayForm } from "./day-form";
import { BUTTON_PRIMARY, ERROR_BANNER } from "./styles";

type Editing = { mode: "create" } | { mode: "edit"; day: DayDto } | null;

interface Props {
  days: DayDto[];
  today: string;
  names: CategoryNames;
  /** Category requested via `?category=` (already parsed; null = 全部) */
  category: DayCategory | null;
}

export function DayBoard({ days, today, names, category }: Props) {
  const [editing, setEditing] = useState<Editing>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const counts = countByCategory(days);
  // A category with no days left (e.g. its last day was deleted) falls back to 全部.
  const active = category && counts[category] > 0 ? category : null;
  const stale = category !== null && active === null;

  useEffect(() => {
    if (stale) router.replace(pathname, { scroll: false });
  }, [stale, pathname, router]);

  // Pinned days (including the hero) are never filtered out.
  const visible = filterDays(days, active);
  const hero = visible[0]?.pinned ? visible[0] : undefined;
  const rest = hero ? visible.slice(1) : visible;

  function act(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "操作失败");
    });
  }

  function cardProps(day: DayDto) {
    return {
      day,
      busy: pending,
      onEdit: () => setEditing({ mode: "edit", day }),
      onTogglePin: () => act(() => togglePinAction(day.id, !day.pinned)),
    };
  }

  return (
    <>
      {error && (
        <p role="alert" className={`mb-4 ${ERROR_BANNER}`}>
          {error}
        </p>
      )}

      {days.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-muted">
            <CalendarHeart className="h-7 w-7" aria-hidden />
          </span>
          <p className="mt-4 font-display text-lg font-medium">还没有倒数日</p>
          <p className="mt-1 text-sm text-muted">记录生日、纪念日、考试、假期……</p>
          <button
            type="button"
            onClick={() => setEditing({ mode: "create" })}
            className={`mt-6 inline-flex items-center gap-1.5 px-4 py-2 text-sm ${BUTTON_PRIMARY}`}
          >
            <Plus className="h-4 w-4" aria-hidden />
            新建第一个
          </button>
        </div>
      ) : (
        <div className={`space-y-4 transition-opacity ${pending ? "opacity-70" : ""}`}>
          <CategoryFilter counts={counts} total={days.length} names={names} active={active} />
          {hero && <DayCard hero {...cardProps(hero)} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((d) => <DayCard key={d.id} {...cardProps(d)} />)}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setEditing({ mode: "create" })}
        className="fixed right-6 bottom-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg transition-[translate,scale,box-shadow,background-color] duration-200 hover:bg-accent-hover hover:shadow-xl motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95"
        aria-label="新建倒数日"
        title="新建倒数日"
      >
        <Plus className="h-7 w-7" aria-hidden />
      </button>

      {editing && (
        <DayForm
          key={editing.mode === "edit" ? editing.day.id : "new"}
          initial={editing.mode === "edit" ? editing.day : undefined}
          defaultDate={today}
          names={names}
          onClose={() => setEditing(null)}
          onSubmit={async (input) => {
            const r =
              editing.mode === "edit" ? await updateDayAction(editing.day.id, input) : await createDayAction(input);
            return r.ok ? null : r.error;
          }}
          onDelete={
            editing.mode === "edit"
              ? async () => {
                  const r = await deleteDayAction(editing.day.id);
                  return r.ok ? null : r.error;
                }
              : undefined
          }
        />
      )}
    </>
  );
}
