"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DAY_CATEGORIES, DEFAULT_CATEGORY, type CategoryNames, type DayCategory } from "@/lib/days/categories";
import type { DayKind, RepeatUnit } from "@/lib/days/engine";
import type { CreateDayInput } from "@/lib/days/schemas";
import type { DayDto } from "@/lib/services/days";
import { COLOR_STYLES } from "./colors";
import { BUTTON_GHOST, BUTTON_PRIMARY, ERROR_BANNER, FIELD } from "./styles";

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

// FIELD (styles.ts) has no width so callers can size it without conflicting utilities.
const LABEL = "text-sm text-muted";
/** Fallback in case animationend never fires (e.g. animations disabled by the browser). */
const EXIT_FALLBACK_MS = 400;

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
  const [closing, setClosing] = useState(false);

  // Exit animation: `close()` plays it, then `finish()` calls onClose exactly once
  // (whichever comes first: animationend or the fallback timer; reduced motion = immediately).
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });
  const finished = useRef(false);
  const closingRef = useRef(false);
  const fallbackTimer = useRef<number | undefined>(undefined);
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    window.clearTimeout(fallbackTimer.current);
    onCloseRef.current();
  }, []);
  const close = useCallback(() => {
    if (closingRef.current || finished.current) return;
    closingRef.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    setClosing(true);
    fallbackTimer.current = window.setTimeout(finish, EXIT_FALLBACK_MS);
  }, [finish]);

  // Unmounted without finishing (e.g. parent swapped in another dialog during the exit animation):
  // the pending fallback timer must not fire onClose later and close the new dialog.
  useEffect(
    () => () => {
      finished.current = true;
      window.clearTimeout(fallbackTimer.current);
    },
    [],
  );

  // Esc closes; background page does not scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [close]);

  async function run(fn: () => Promise<string | null>) {
    setPending(true);
    setError(null);
    const err = await fn();
    // Dismissed while saving: the dialog is (being) unmounted, leave its state alone.
    if (closingRef.current) return;
    setPending(false);
    if (err) setError(err);
    else close();
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
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-overlay sm:items-center sm:p-4 ${
        closing ? "pointer-events-none animate-fade-out" : "animate-fade-in"
      }`}
      onClick={close}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) finish();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-form-title"
        className={`flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl ${
          closing
            ? "motion-safe:animate-sheet-down motion-reduce:animate-fade-out sm:motion-safe:animate-pop-out"
            : "motion-safe:animate-sheet-up motion-reduce:animate-fade-in sm:motion-safe:animate-pop-in"
        }`}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden />
        <div className="flex items-center justify-between gap-2 px-6 pt-4 sm:pt-6">
          <h2 id="day-form-title" className="font-display text-lg font-semibold">
            {initial ? "编辑倒数日" : "新建倒数日"}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="关闭"
            title="关闭"
            className={`-mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full ${BUTTON_GHOST}`}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

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
                  aria-pressed={kind === k.value}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    kind === k.value
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border text-fg hover:border-ring"
                  }`}
                >
                  <span className="block font-medium">{k.label}</span>
                  <span className={`block text-xs ${kind === k.value ? "opacity-70" : "text-subtle"}`}>{k.hint}</span>
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
              <div className="mt-1 flex items-center gap-2 text-sm whitespace-nowrap text-fg">
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
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                    category === c
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border text-muted hover:border-ring hover:text-fg"
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
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-accent"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />
            <span>
              置顶
              <span className="block text-xs text-subtle">只能置顶一个，会替换当前的置顶</span>
            </span>
          </label>

          {error && (
            <p role="alert" className={ERROR_BANNER}>
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-line px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {onDelete && (
            <button
              type="button"
              disabled={pending}
              onClick={remove}
              className="rounded-lg px-3 py-2 text-danger transition-colors hover:bg-danger-soft disabled:opacity-50"
            >
              删除
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={close} className={`px-4 py-2 ${BUTTON_GHOST}`}>
              取消
            </button>
            <button type="submit" disabled={pending} className={`px-4 py-2 ${BUTTON_PRIMARY}`}>
              {pending ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
