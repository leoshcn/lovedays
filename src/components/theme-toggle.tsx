"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useThemePref } from "@/hooks/use-theme-pref";
import { HEADER_BUTTON } from "./styles";
import { nextThemePref, THEME_LABEL, THEME_PREFS, type ThemePref } from "./theme";

const THEME_ICON: Record<ThemePref, LucideIcon> = { system: Monitor, light: Sun, dark: Moon };

/** Header icon button: cycles 跟随系统 → 浅色 → 深色. */
export function ThemeToggle() {
  const [pref, setPref] = useThemePref();
  const Icon = THEME_ICON[pref];
  const label = `主题：${THEME_LABEL[pref]}（点击切换为${THEME_LABEL[nextThemePref(pref)]}）`;
  return (
    <button
      type="button"
      onClick={() => setPref(nextThemePref(pref))}
      aria-label={label}
      title={label}
      className={`${HEADER_BUTTON} w-9 justify-center px-0`}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
    </button>
  );
}

/** Segmented control for the settings 「外观」 section. */
export function ThemeSelect() {
  const [pref, setPref] = useThemePref();
  return (
    <div role="radiogroup" aria-label="主题" className="mt-4 inline-flex rounded-xl bg-surface-2 p-1">
      {THEME_PREFS.map((p) => {
        const Icon = THEME_ICON[p];
        const selected = pref === p;
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setPref(p)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              selected ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {THEME_LABEL[p]}
          </button>
        );
      })}
    </div>
  );
}
