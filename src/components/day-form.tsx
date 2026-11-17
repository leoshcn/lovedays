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
  /** Present only when editing an existing day. Returns an error message or null. */
  onDelete?: () => Promise<string | null>;
  onClose: () => void;
}

// Base field style has no width so callers can size it without conflicting utilities.
const FIELD = "rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none focus:border-stone-500";
const LABEL = "text-sm text-stone-600";

export function DayForm({ initial, defaultDate, names, onSubmit, onDelete, onClose }: Props) {
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

  async function run(fn: () => Promise<string | null>) {
    setPending(true);
    setError(null);
    const err = await fn();
    setPending(false);
    if (err) setError(err);
    else onClose();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    void run(() =>
      onSubmit({
        title,
        targetDate,
        kind,
        repeatUnit: kind === "repeat" ? repeatUnit : null,
        repeatInterval: kind === "repeat" ? repeatInterval : null,
        note: note.trim() || null,
        pinned,
        category,
      }),
    );
  }

  function remove() {
    if (!onDelete || !initial) return;
    if (confirm(`确定删除「${initial.title}」？`)) void run(onDelete);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
      >
        <h2 className="px-6 pt-6 text-lg font-semibold">{initial ? "编辑倒数日" : "新建倒数日"}</h2>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          <label className={`block ${LABEL}`}>
            标题
            <input
              className={`${FIELD} mt-1 w-full`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
              required
              autoFocus
            />
          </label>

          <fieldset>
            <legend className={LABEL}>类型</legend>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => setKind(k.value)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm ${kind === k.value ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300"}`}
                >
                  <span className="block font-medium">{k.label}</span>
                  <span className={`block text-xs ${kind === k.value ? "text-white/70" : "text-stone-500"}`}>{k.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className={`block ${LABEL}`}>
            {kind === "repeat" ? "首次日期" : "目标日期"}
            <input
              type="date"
              className={`${FIELD} mt-1 w-full`}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
          </label>

          {kind === "repeat" && (
            <fieldset>
              <legend className={LABEL}>重复周期</legend>
              <div className="mt-1 flex items-center gap-2 text-sm whitespace-nowrap text-stone-700">
                <span className="shrink-0">每</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  aria-label="间隔"
                  className={`${FIELD} w-20 shrink-0 text-center`}
                  value={repeatInterval}
                  onChange={(e) => setRepeatInterval(Number(e.target.value))}
                  required
                />
                <select
                  aria-label="单位"
                  className={`${FIELD} w-24 shrink-0`}
                  value={repeatUnit}
                  onChange={(e) => setRepeatUnit(e.target.value as RepeatUnit)}
                >
                  <option value="week">周</option>
                  <option value="month">月</option>
                  <option value="year">年</option>
                </select>
                <span className="shrink-0">重复一次</span>
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className={LABEL}>类别</legend>
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

          <label className={`block ${LABEL}`}>
            备注（可选）
            <textarea
              className={`${FIELD} mt-1 w-full`}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
            />
          </label>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            <span>
              置顶
              <span className="block text-xs text-stone-500">只能置顶一个，会替换当前的置顶</span>
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center gap-2 border-t border-stone-100 px-6 py-4">
          {onDelete && (
            <button
              type="button"
              disabled={pending}
              onClick={remove}
              className="rounded-lg px-3 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              删除
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-stone-600 hover:bg-stone-100">
              取消
            </button>
            <button type="submit" disabled={pending} className="rounded-lg bg-stone-900 px-4 py-2 text-white disabled:opacity-50">
              {pending ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
