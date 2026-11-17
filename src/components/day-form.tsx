"use client";

import { useState } from "react";
import { DAY_CATEGORIES, DEFAULT_CATEGORY, type CategoryNames, type DayCategory } from "@/lib/days/categories";
import type { DayKind, RepeatUnit } from "@/lib/days/engine";
import type { CreateDayInput } from "@/lib/days/schemas";
import type { DayDto } from "@/lib/services/days";
import { COLOR_STYLES } from "./colors";

const KINDS: { value: DayKind; label: string; hint: string }[] = [
  { value: "once", label: "一次性", hint: "到期后自动删除" },
  { value: "countup", label: "到期正数", hint: "到期后显示「已经 N 天」" },
  { value: "repeat", label: "重复", hint: "每 n 周 / 月 / 年" },
];

interface Props {
  initial?: DayDto;
  defaultDate: string;
  /** The user's category names */
  names: CategoryNames;
  onSubmit: (input: CreateDayInput) => Promise<string | null>;
  onClose: () => void;
}

export function DayForm({ initial, defaultDate, names, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? defaultDate);
  const [kind, setKind] = useState<DayKind>(initial?.kind ?? "once");
  const [repeatUnit, setRepeatUnit] = useState<RepeatUnit>(initial?.repeatUnit ?? "year");
  const [repeatInterval, setRepeatInterval] = useState(initial?.repeatInterval ?? 1);
  const [note, setNote] = useState(initial?.note ?? "");
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [category, setCategory] = useState<DayCategory>(initial?.category ?? DEFAULT_CATEGORY);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const err = await onSubmit({
      title,
      targetDate,
      kind,
      repeatUnit: kind === "repeat" ? repeatUnit : null,
      repeatInterval: kind === "repeat" ? repeatInterval : null,
      note: note.trim() || null,
      pinned,
      category,
    });
    setPending(false);
    if (err) setError(err);
    else onClose();
  }

  const input = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none focus:border-stone-500";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl"
      >
        <h2 className="text-lg font-semibold">{initial ? "编辑倒数日" : "新建倒数日"}</h2>

        <label className="mt-4 block text-sm text-stone-600">
          标题
          <input className={`${input} mt-1`} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={50} required autoFocus />
        </label>

        <fieldset className="mt-4">
          <legend className="text-sm text-stone-600">类型</legend>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                onClick={() => setKind(k.value)}
                className={`rounded-lg border px-2 py-2 text-left text-sm ${kind === k.value ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300"}`}
              >
                <span className="block font-medium">{k.label}</span>
                <span className={`block text-xs ${kind === k.value ? "text-white/70" : "text-stone-500"}`}>{k.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mt-4 block text-sm text-stone-600">
          {kind === "repeat" ? "首次日期" : "目标日期"}
          <input type="date" className={`${input} mt-1`} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
        </label>

        {kind === "repeat" && (
          <div className="mt-4 flex items-center gap-2 text-sm text-stone-600">
            每
            <input
              type="number"
              min={1}
              max={99}
              className={`${input} w-20`}
              value={repeatInterval}
              onChange={(e) => setRepeatInterval(Number(e.target.value))}
              required
            />
            <select className={`${input} w-28`} value={repeatUnit} onChange={(e) => setRepeatUnit(e.target.value as RepeatUnit)}>
              <option value="week">周</option>
              <option value="month">月</option>
              <option value="year">年</option>
            </select>
            重复一次
          </div>
        )}

        <label className="mt-4 block text-sm text-stone-600">
          备注（可选）
          <textarea className={`${input} mt-1`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </label>

        <fieldset className="mt-4">
          <legend className="text-sm text-stone-600">类别</legend>
          <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label="类别">
            {DAY_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={category === c}
                onClick={() => setCategory(c)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
                  category === c ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 text-stone-700"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${COLOR_STYLES[c].dot}`} />
                {names[c]}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          置顶
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-stone-600 hover:bg-stone-100">
            取消
          </button>
          <button type="submit" disabled={pending} className="rounded-lg bg-stone-900 px-4 py-2 text-white disabled:opacity-50">
            {pending ? "保存中…" : "保存"}
          </button>
        </div>
      </form>
    </div>
  );
}
