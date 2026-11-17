"use client";

import { useState, useTransition } from "react";
import { setCategoryNameAction } from "@/app/actions";
import {
  DAY_CATEGORIES,
  DEFAULT_CATEGORY_NAMES,
  type CategoryNames,
  type DayCategory,
} from "@/lib/days/categories";
import { COLOR_STYLES } from "./colors";

/** Input value for a category: blank when it uses the default name. */
const customName = (names: CategoryNames, c: DayCategory) =>
  names[c] === DEFAULT_CATEGORY_NAMES[c] ? "" : names[c];

/** Rename the 7 fixed categories. Blank = restore the default name. Saves on blur / Enter / 保存. */
export function CategoryNameEditor({ names }: { names: CategoryNames }) {
  return (
    <ul className="mt-4 divide-y divide-stone-100">
      {DAY_CATEGORIES.map((c) => (
        <CategoryRow key={c} category={c} saved={customName(names, c)} />
      ))}
    </ul>
  );
}

function CategoryRow({ category, saved }: { category: DayCategory; saved: string }) {
  const [value, setValue] = useState(saved);
  const [lastSaved, setLastSaved] = useState(saved);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty = value.trim() !== lastSaved;

  function save() {
    if (!dirty || pending) return;
    setError(null);
    setDone(false);
    const next = value.trim();
    startTransition(async () => {
      const r = await setCategoryNameAction(category, next);
      if (r.ok) {
        setValue(next);
        setLastSaved(next);
        setDone(true);
      } else setError(r.error);
    });
  }

  return (
    <li className="py-3">
      <form
        className="flex items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <span className={`h-3 w-3 shrink-0 rounded-full ${COLOR_STYLES[category].dot}`} aria-hidden />
        <input
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-500"
          aria-label={`${COLOR_STYLES[category].label}色类别名称`}
          placeholder={DEFAULT_CATEGORY_NAMES[category]}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setDone(false);
          }}
          onBlur={save}
        />
        <button
          type="submit"
          disabled={!dirty || pending}
          className="rounded-lg bg-stone-900 px-3 py-2 text-sm text-white disabled:opacity-40"
        >
          {pending ? "保存中…" : "保存"}
        </button>
      </form>
      {error && <p className="mt-1 pl-6 text-sm text-red-600">{error}</p>}
      {done && !error && <p className="mt-1 pl-6 text-xs text-stone-500">{lastSaved ? "已保存" : "已恢复默认名称"}</p>}
    </li>
  );
}
