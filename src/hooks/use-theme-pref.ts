"use client";

import { useSyncExternalStore } from "react";
import { getThemePref, setThemePref, subscribeThemePref, type ThemePref } from "@/components/theme";

/**
 * Current theme preference + setter. Reads `<html data-theme-pref>` (set by the inline head script);
 * the server snapshot is "system" so hydration always matches, then the real value is picked up.
 */
export function useThemePref(): [ThemePref, (pref: ThemePref) => void] {
  const pref = useSyncExternalStore(subscribeThemePref, getThemePref, () => "system" as const);
  return [pref, setThemePref];
}
