# Implement — 视觉设计优化与暗色模式

## Checklist (ordered)

1. `pnpm add lucide-react @fontsource-variable/outfit`
2. `globals.css`：token（亮/暗）、`@custom-variant dark`、`@theme inline` 颜色与 `--font-display`、keyframes / `--animate-*`、focus-visible 基础样式、reduced-motion 规则。
3. `layout.tsx`：防闪烁内联脚本、`suppressHydrationWarning`、引入字体 CSS。
4. `components/theme.ts` + `theme-toggle.tsx`（ThemeToggle、ThemeSelect）。
5. `colors.ts`：7 类别补暗色变体。
6. 逐个组件迁移到语义 token + 图标：`day-card` → `day-board`（FAB、空状态、错误条）→ `category-filter` → `day-form`（动画、Esc、滚动锁定）→ `auth-form` → `category-name-editor` → `api-key-manager` → `sign-out-button`。
7. 页面：`page.tsx` / `settings/page.tsx` 头部加 ThemeToggle；设置页新增「外观」section。
8. 更新 spec：`component-guidelines.md`（语义 token、暗色变体写法、图标用 lucide）、`quality-guidelines.md`（暗色检查、reduced-motion、focus-visible）。

## Validation

```bash
pnpm typecheck
pnpm test
pnpm build
```

手动：`pnpm dev`，亮/暗/系统三态 × 首页（空/有数据/hero/过滤）、弹窗、设置、登录/注册；375px 宽度；键盘 Tab；系统开启减少动态效果。

## Risky files

- `layout.tsx` 内联脚本（hydration warning、首帧闪烁）。
- `day-form.tsx` 退出动画与 `onClose` 时序（保存成功后关闭、遮罩点击、Esc）。
- Tailwind v4 `@theme inline` / `@custom-variant` 语法——以 `pnpm build` 产物验证。
