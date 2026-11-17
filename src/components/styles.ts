/**
 * Shared static class strings built on the semantic tokens in globals.css.
 * Width-less on purpose: add `w-full` / `w-20` etc. per use (see component-guidelines.md).
 */

/** Text input / select / textarea. */
export const FIELD =
  "rounded-lg border border-border bg-surface px-3 py-2 text-fg outline-none transition-colors placeholder:text-subtle focus:border-ring focus:ring-2 focus:ring-ring/25";

/** Primary (filled) button. */
export const BUTTON_PRIMARY =
  "rounded-lg bg-accent text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50";

/** Quiet (text) button. */
export const BUTTON_GHOST = "rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg";

/** Header link / icon button (settings, sign out, theme toggle, back). */
export const HEADER_BUTTON =
  "inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg";

/** Inline error banner. */
export const ERROR_BANNER = "rounded-xl border border-danger-line bg-danger-soft px-4 py-2 text-sm text-danger";

/** Settings / auth surface card. Padding-less: add p-6 / p-8 per use. */
export const PANEL = "rounded-3xl border border-line bg-surface shadow-sm";
