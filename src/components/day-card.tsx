"use client";

import type { DayDto } from "@/lib/services/days";
import { colorStyle } from "./colors";

const KIND_LABEL = { once: "一次性", countup: "正数", repeat: "重复" } as const;
const UNIT_LABEL = { week: "周", month: "个月", year: "年" } as const;

export function kindText(d: Pick<DayDto, "kind" | "repeatUnit" | "repeatInterval">): string {
  if (d.kind === "repeat" && d.repeatUnit && d.repeatInterval) {
    return d.repeatInterval === 1
      ? `每${UNIT_LABEL[d.repeatUnit].replace("个", "")}`
      : `每 ${d.repeatInterval} ${UNIT_LABEL[d.repeatUnit]}`;
  }
  return KIND_LABEL[d.kind];
}

function headline(d: DayDto): string {
  if (d.status === "today") return `${d.title} 就是今天`;
  if (d.status === "elapsed") return `${d.title} 已经`;
  return `距离 ${d.title} 还有`;
}

interface Props {
  day: DayDto;
  hero?: boolean;
  onEdit: () => void;
  onTogglePin: () => void;
  busy?: boolean;
}

export function DayCard({ day, hero, onEdit, onTogglePin, busy }: Props) {
  const c = colorStyle(day.category);
  const isToday = day.status === "today";

  const actions = (
    <div className={`flex gap-1 text-xs ${hero ? "text-white/90" : "text-stone-500"}`}>
      <button type="button" disabled={busy} onClick={onTogglePin} className="rounded px-2 py-1 hover:bg-black/10">
        {day.pinned ? "取消置顶" : "置顶"}
      </button>
      <button type="button" disabled={busy} onClick={onEdit} className="rounded px-2 py-1 hover:bg-black/10">
        编辑
      </button>
    </div>
  );

  if (hero) {
    return (
      <article className={`rounded-3xl bg-gradient-to-br ${c.hero} p-6 text-white shadow-lg sm:p-8`}>
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs">
            📌 {day.categoryName} · {kindText(day)}
          </span>
          {actions}
        </div>
        <p className="mt-6 text-lg font-medium sm:text-xl">{headline(day)}</p>
        {!isToday && (
          <p className="mt-2 flex items-baseline gap-2">
            <span className="text-6xl font-bold tabular-nums sm:text-7xl">{day.days}</span>
            <span className="text-xl">天</span>
          </p>
        )}
        <p className="mt-4 text-sm text-white/80">
          {day.kind === "repeat" ? "下次 " : ""}
          {day.displayDate}
        </p>
        {day.note && <p className="mt-2 text-sm text-white/80">{day.note}</p>}
      </article>
    );
  }

  return (
    <article className={`flex flex-col rounded-2xl border p-4 shadow-sm ${c.card}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-stone-600">
          <span className={`h-2 w-2 rounded-full ${c.dot}`} />
          <span className="font-medium text-stone-700">{day.categoryName}</span>
          <span className="text-stone-400">·</span>
          {day.pinned && "📌 "}
          {kindText(day)}
        </span>
        <span className="text-xs text-stone-500">{day.displayDate}</span>
      </div>
      <p className="mt-3 line-clamp-2 font-medium">{headline(day)}</p>
      <p className="mt-1 flex items-baseline gap-1">
        {isToday ? (
          <span className="text-3xl font-bold">🎉</span>
        ) : (
          <>
            <span className="text-4xl font-bold tabular-nums">{day.days}</span>
            <span className="text-stone-600">天</span>
          </>
        )}
      </p>
      {day.note && <p className="mt-2 line-clamp-2 text-sm text-stone-600">{day.note}</p>}
      <div className="mt-auto flex justify-end pt-3">{actions}</div>
    </article>
  );
}
