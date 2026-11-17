"use client";

import { useState, useTransition } from "react";
import { createDayAction, deleteDayAction, togglePinAction, updateDayAction } from "@/app/actions";
import type { DayDto } from "@/lib/services/days";
import { DayCard } from "./day-card";
import { DayForm } from "./day-form";

type Editing = { mode: "create" } | { mode: "edit"; day: DayDto } | null;

export function DayBoard({ days, today }: { days: DayDto[]; today: string }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hero = days[0]?.pinned ? days[0] : undefined;
  const rest = hero ? days.slice(1) : days;

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
      onDelete: () => {
        if (confirm(`确定删除「${day.title}」？`)) act(() => deleteDayAction(day.id));
      },
    };
  }

  return (
    <>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {days.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 px-6 py-16 text-center text-stone-500">
          <p className="text-lg">还没有倒数日</p>
          <p className="mt-1 text-sm">记录生日、纪念日、考试、假期……</p>
        </div>
      ) : (
        <div className="space-y-4">
          {hero && <DayCard hero {...cardProps(hero)} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((d) => <DayCard key={d.id} {...cardProps(d)} />)}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setEditing({ mode: "create" })}
        className="fixed right-6 bottom-6 flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-3xl text-white shadow-lg hover:bg-stone-700"
        aria-label="新建倒数日"
      >
        +
      </button>

      {editing && (
        <DayForm
          key={editing.mode === "edit" ? editing.day.id : "new"}
          initial={editing.mode === "edit" ? editing.day : undefined}
          defaultDate={today}
          onClose={() => setEditing(null)}
          onSubmit={async (input) => {
            const r =
              editing.mode === "edit" ? await updateDayAction(editing.day.id, input) : await createDayAction(input);
            return r.ok ? null : r.error;
          }}
        />
      )}
    </>
  );
}
