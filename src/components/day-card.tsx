"use client";

import { PartyPopper, Pencil, Pin, PinOff } from "lucide-react";
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

const LIFT =
  "transition-[translate,scale,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98]";

export function DayCard({ day, hero, onEdit, onTogglePin, busy }: Props) {
  const c = colorStyle(day.category);
  const isToday = day.status === "today";
  const pinLabel = day.pinned ? "取消置顶" : "置顶";
  const PinIcon = day.pinned ? PinOff : Pin;

  const iconButton = `inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
    hero ? "text-white/90 hover:bg-white/20 focus-visible:outline-white" : "text-subtle hover:bg-black/5 hover:text-fg dark:hover:bg-white/10"
  }`;

  const actions = (
    <div className="flex shrink-0 gap-0.5">
      <button type="button" disabled={busy} onClick={onTogglePin} className={iconButton} aria-label={pinLabel} title={pinLabel}>
        <PinIcon className="h-4 w-4" aria-hidden />
      </button>
      <button type="button" disabled={busy} onClick={onEdit} className={iconButton} aria-label="编辑" title="编辑">
        <Pencil className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );

  if (hero) {
    return (
      <article className={`rounded-3xl bg-gradient-to-br ${c.hero} p-6 text-white shadow-lg hover:shadow-xl sm:p-8 ${LIFT}`}>
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs">
            <Pin className="h-3.5 w-3.5" role="img" aria-label="已置顶" />
            {day.categoryName} · {kindText(day)}
          </span>
          {actions}
        </div>
        <p className="mt-6 text-lg font-medium sm:text-xl">{headline(day)}</p>
        {isToday ? (
          <p className="mt-3">
            <PartyPopper className="h-12 w-12 sm:h-14 sm:w-14" role="img" aria-label="今天" />
          </p>
        ) : (
          <p className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-6xl font-semibold tracking-tight tabular-nums sm:text-7xl">{day.days}</span>
            <span className="text-xl">天</span>
          </p>
        )}
        <p className="mt-4 text-sm text-white/85">
          {day.kind === "repeat" ? "下次 " : ""}
          {day.displayDate}
        </p>
        {day.note && <p className="mt-2 text-sm text-white/85">{day.note}</p>}
      </article>
    );
  }

  return (
    <article className={`flex flex-col rounded-2xl border p-4 shadow-sm hover:shadow-md ${c.card} ${LIFT}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
          <span className={`h-2 w-2 shrink-0 rounded-full ${c.dot}`} />
          <span className="font-medium text-fg">{day.categoryName}</span>
          <span className="text-subtle">·</span>
          {day.pinned && <Pin className="h-3 w-3 shrink-0" role="img" aria-label="已置顶" />}
          {kindText(day)}
        </span>
        <span className="shrink-0 text-xs text-subtle">{day.displayDate}</span>
      </div>
      <p className="mt-3 line-clamp-2 font-medium">{headline(day)}</p>
      <p className="mt-1 flex items-baseline gap-1">
        {isToday ? (
          <PartyPopper className="my-1 h-9 w-9 text-fg" role="img" aria-label="今天" />
        ) : (
          <>
            <span className="font-display text-4xl font-semibold tracking-tight tabular-nums">{day.days}</span>
            <span className="text-muted">天</span>
          </>
        )}
      </p>
      {day.note && <p className="mt-2 line-clamp-2 text-sm text-muted">{day.note}</p>}
      <div className="mt-auto flex justify-end pt-3">{actions}</div>
    </article>
  );
}
