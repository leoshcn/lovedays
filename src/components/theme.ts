/**
 * Theme preference: system / light / dark, stored in localStorage (per device, not in the DB).
 *
 * `<html data-theme-pref>` holds the preference, `<html data-theme>` the resolved light/dark value
 * that the `dark:` variant and CSS tokens key off. Both are set before first paint by
 * THEME_INIT_SCRIPT (inlined in the root layout), which also follows OS changes while pref = system.
 */

export type ThemePref = "system" | "light" | "dark";

export const THEME_PREFS: readonly ThemePref[] = ["system", "light", "dark"];
export const THEME_STORAGE_KEY = "lovedays-theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

export const THEME_INIT_SCRIPT = `(function(){var k=${JSON.stringify(THEME_STORAGE_KEY)},q=${JSON.stringify(DARK_QUERY)},r=document.documentElement,p="system";try{var s=localStorage.getItem(k);if(s==="light"||s==="dark")p=s}catch(e){}var m=window.matchMedia&&window.matchMedia(q);function a(){var c=r.getAttribute("data-theme-pref")||"system";r.setAttribute("data-theme",c==="dark"||(c==="system"&&m&&m.matches)?"dark":"light")}r.setAttribute("data-theme-pref",p);a();if(m&&m.addEventListener)m.addEventListener("change",a)})();`;

function isPref(v: unknown): v is ThemePref {
  return v === "system" || v === "light" || v === "dark";
}

export function getThemePref(): ThemePref {
  const v = document.documentElement.getAttribute("data-theme-pref");
  return isPref(v) ? v : "system";
}

const listeners = new Set<() => void>();

export function setThemePref(pref: ThemePref) {
  try {
    if (pref === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // localStorage unavailable (private mode): the choice lasts for this page only.
  }
  const root = document.documentElement;
  const dark = pref === "dark" || (pref === "system" && window.matchMedia(DARK_QUERY).matches);
  root.setAttribute("data-theme-pref", pref);
  root.setAttribute("data-theme", dark ? "dark" : "light");
  listeners.forEach((l) => l());
}

export function subscribeThemePref(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function nextThemePref(pref: ThemePref): ThemePref {
  return THEME_PREFS[(THEME_PREFS.indexOf(pref) + 1) % THEME_PREFS.length] ?? "system";
}

export const THEME_LABEL: Record<ThemePref, string> = { system: "跟随系统", light: "浅色", dark: "深色" };
