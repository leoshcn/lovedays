# 视觉设计优化与暗色模式

## Goal

在保持简洁的前提下，提升 LoveDays 的设计感与交互体验，并新增可切换的暗色模式。只改表现层，业务行为不变。

## Background (repo evidence)

- 技术栈：Next.js 16 App Router + React 19 + Tailwind CSS 4（`src/app/globals.css` 用 `@import "tailwindcss"`，无 `tailwind.config`），无 UI 库 / 图标库。
- 主题现状：`globals.css` 仅 `color-scheme: light` + `bg-stone-50 text-stone-900`；全站硬编码 stone 色，无 `dark:` 变体、无设计 token。
- 类别配色集中在 `src/components/colors.ts`（7 类，`card`/`hero`/`dot` 静态类名）；spec（`component-guidelines.md`）要求颜色变体只来自此文件。
- 交互现状：`day-form.tsx` 弹窗无进出场动画、无 Esc 关闭；按钮无 focus-visible 样式；图标为 emoji（📌 🎉）与文字 `+`（`day-board.tsx` FAB）。
- 构建：Docker 构建支持自定义 `NPM_REGISTRY`（镜像源），构建期访问 Google Fonts 不可靠 → 字体须通过 npm 包自托管。

## Decisions

- **D1 暗色模式**：系统 / 浅色 / 深色 三态，默认跟随系统；偏好存 `localStorage`（不入库、不跨设备）；`<head>` 内联脚本在首帧前设置 `<html data-theme>`，无闪烁。
- **D2 视觉力度（方案 B）**：设计 token + 打磨 + 动效，并新增 `lucide-react` 图标、数字/标题展示字体、卡片悬停/按压微交互。不做整体风格重做（毛玻璃、布局重排等）。
- **D3 字体**：用 `@fontsource-variable/outfit` 自托管（走 npm 源，不依赖构建期访问 Google）；仅用于天数数字与标题，中文正文保持系统字体栈。
- **D4 主题切换入口**：首页与设置页头部各一个图标按钮（点击循环 系统→浅色→深色，`aria-label` 表明当前模式），设置页另有「外观」分段选择器。

## Requirements

- R1 设计 token：在 `globals.css` 用 CSS 变量定义语义色（背景、表面、边框、正文、次要文字、强调/主按钮、危险色），亮暗两套；通过 Tailwind v4 `@theme inline` 暴露为工具类（如 `bg-surface`、`text-muted`），组件改用语义类，减少零散 `dark:`。
- R2 暗色模式：`@custom-variant dark` 绑定 `[data-theme=dark]`；`color-scheme` 随主题切换（原生日期选择器、滚动条适配）；系统偏好变化时（系统模式下）实时跟随。
- R3 类别配色：`colors.ts` 为 7 个类别补充暗色变体（卡片低饱和底色 + 边框、hero 渐变在暗色下略降亮度），仍为静态类名。
- R4 全部页面/组件适配 token 与暗色：首页、设置、登录/注册、`day-board`、`day-card`、`day-form`、`category-filter`、`category-name-editor`、`api-key-manager`、`sign-out-button`。
- R5 图标：引入 `lucide-react`，替换 📌（Pin）、🎉（PartyPopper 或保留为「今天」标记的图标）、FAB `+`（Plus）、卡片「置顶/编辑」文字按钮改为图标按钮（带 `aria-label` 与 `title`），头部「设置/退出」可配图标。
- R6 字体：天数数字与页面标题使用 Outfit（`tabular-nums` 保持）。
- R7 交互与动效：
  - 弹窗：遮罩淡入、面板在移动端自底部滑入 / 桌面端缩放淡入；Esc 关闭；打开时锁定背景滚动。
  - 卡片：悬停轻微上浮 + 阴影加深，按下轻微缩小；FAB 同理。
  - 所有可交互元素有清晰的 `focus-visible` 环。
  - 遵守 `prefers-reduced-motion`：关闭位移/缩放动画。
- R8 细节打磨：统一圆角/阴影层级；空状态加图标与引导；错误提示条样式统一；`pending` 状态视觉一致。

## Acceptance Criteria

- [ ] AC1（R2/D1）首次访问跟随系统；切换为浅色/深色后刷新仍保持；切回「系统」后随系统变化实时切换；硬刷新时无浅→暗闪烁。
- [ ] AC2（R4）暗色下所有页面（首页含空状态/hero/卡片/过滤条/弹窗、设置、登录、注册）无白底残留、无不可读文字（正文对比度 ≥ 4.5:1）。
- [ ] AC3（R3）7 个类别卡片在亮/暗两种模式下均可区分、文字可读。
- [ ] AC4（R5）界面不再出现 📌 🎉 emoji 与文字 `+`；所有图标按钮有 `aria-label`。
- [ ] AC5（R7）弹窗有进出场动画、Esc 可关闭、背景不滚动；开启系统「减少动态效果」后无位移动画。
- [ ] AC6（R7）键盘 Tab 遍历时每个可交互元素有可见焦点环。
- [ ] AC7（D4）首页与设置页头部可切换主题；设置页「外观」三态选择器与头部按钮状态一致。
- [ ] AC8 业务行为不变：新建/编辑/删除/置顶/类别过滤/类别改名/API Key 照常工作；`pnpm typecheck`、`pnpm test`、`pnpm build` 通过。
- [ ] AC9 移动端（≤ 375px）布局无横向滚动，弹窗仍为底部抽屉。

## Out of Scope

- 业务逻辑、API、MCP、数据库 schema 变更；主题偏好入库 / 跨设备同步。
- 整体视觉重做（毛玻璃、渐变背景、首页布局重排）。
- 替换原生 `confirm()` 为自定义确认弹窗（spec 现行约定，保持不变）。
- 新增页面或功能。
