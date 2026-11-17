# Design — 视觉设计优化与暗色模式

## 1. Theme architecture

```
<head> inline script (layout.tsx)
  read localStorage["lovedays-theme"] ∈ {system, light, dark} (default system, try/catch)
  resolved = pref==="system" ? matchMedia("(prefers-color-scheme: dark)") : pref
  <html data-theme={resolved} data-theme-pref={pref}>
```

- `layout.tsx`：`<html lang="zh-CN" suppressHydrationWarning>`，在 `<head>` 用 `<script dangerouslySetInnerHTML>` 注入上述脚本（同步执行，首帧前生效）。
- `src/components/theme.ts`（client util）：`getThemePref()`、`setThemePref(pref)`（写 localStorage + 更新 `<html>` 属性）、`subscribeSystem()`（`matchMedia` change 监听，仅 pref=system 时生效）。
- `useThemePref()` hook：基于 `useSyncExternalStore` 读取 `<html data-theme-pref>`（server snapshot 返回 `"system"`，避免 hydration 不一致）。
- 组件：`ThemeToggle`（头部图标按钮，循环三态，图标 Monitor / Sun / Moon）、`ThemeSelect`（设置页分段选择器）。二者共用 hook，状态天然同步。

## 2. Tokens (globals.css)

```css
@import "tailwindcss";
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

:root { --bg; --surface; --surface-2; --border; --fg; --muted; --subtle; --accent; --accent-fg; --danger; --ring; color-scheme: light; }
[data-theme=dark] { ...dark values...; color-scheme: dark; }

@theme inline {
  --color-bg: var(--bg); --color-surface: var(--surface); ...
  --font-display: "Outfit Variable", ui-sans-serif, system-ui, sans-serif;
}
```

- 亮色基于 stone（保持现有气质）；暗色基于 stone-950/900/800 层级，强调色亮暗反转（亮：stone-900 底白字；暗：stone-100 底深字）。
- 组件中 `bg-white`→`bg-surface`，`text-stone-500/600`→`text-muted`，`border-stone-300`→`border-border`，`bg-stone-900 text-white`→`bg-accent text-accent-fg` 等。
- `colors.ts`：类别色是品牌色而非语义色，继续用静态类名，追加 `dark:` 变体（例：`bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-400/25`）。

## 3. Motion

- 在 `globals.css` 定义 keyframes（fade-in、sheet-up、pop-in）并在 `@theme` 中注册为 `--animate-*`。
- 弹窗退出动画：`DayForm` 内部 `closing` 状态 → 播放退出动画，`onAnimationEnd` 后调用 `onClose`；reduced-motion 下直接关闭。
- `@media (prefers-reduced-motion: reduce)` 全局禁用 transform 类动画与 transition 位移。
- 卡片：`transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]`。

## 4. Dependencies

- `lucide-react`（按需 import，tree-shake）。
- `@fontsource-variable/outfit`（在 `layout.tsx` import CSS；不依赖构建期外网，兼容 `NPM_REGISTRY` 镜像）。

## 5. Compatibility / rollback

- 纯表现层改动，无 schema/API 变化；回滚 = 还原文件 + 移除两个依赖。
- localStorage 不可用（隐私模式）时退化为跟随系统。
- 部署主机内存有限（8GB 共享），新增依赖体积小，不影响构建资源限制。
