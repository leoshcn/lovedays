# 倒数日类别字段与首页过滤

## Goal

给每个倒数日加上「类别」，类别决定卡片颜色。用户可以在首页按类别过滤，快速只看某一类（如只看生日），置顶条目不受过滤影响、始终显示。

> 原始需求：每个倒数日设计一个类别字段，类别和颜色挂钩，并且可以在首页进行过滤显示，过滤对置顶的条目不起作用。

## Background (current state)

- `day.color`（text，默认 `rose`）是唯一的分组/样式字段，没有类别概念 — `src\lib\db\schema.ts`（`day` 表）
- 颜色枚举 `DAY_COLORS = rose/orange/amber/emerald/sky/violet/slate` — `src\lib\days\schemas.ts:4`；样式映射 — `src\components\colors.ts`
- 表单手动选颜色 — `src\components\day-form.tsx`（「颜色」区块）
- `color` 对外暴露：REST（`src\lib\openapi.ts:16` DayDto）、MCP（复用 `createDayShape` / `updateDayShape`，`src\lib\mcp\server.ts:3`）、Server Actions（`src\app\actions.ts`）
- 首页：`src\app\page.tsx` 服务端 `listDays`；`src\components\day-board.tsx` 渲染，第一个置顶条目为 hero 大卡片，其余为网格
- 排序：置顶优先 — `src\lib\days\engine.ts:156` `sortDays`
- 设置页 — `src\app\settings\page.tsx`（账号 / API Key / 接入方式三块）

## Key Decisions

- D1 类别**固定 7 个**，与现有 7 种颜色 1:1 绑定，颜色不可改；**用户可给类别改名**（按用户生效）；不能新增/删除类别。类别 key 复用颜色 key，存量 `color` 值即类别，无需数据转换。
- D2 REST / MCP **新增 `category`，保留 `color` 兼容**：输出含 `category`、`categoryName`、`color`（派生、只读）；输入首选 `category`，仍接受 `color` 并映射为同 key 类别，两者都传以 `category` 为准；OpenAPI 中 `color` 标 deprecated。
- D3 首页过滤为**单选标签栏**：「全部」+ 当前有条目的类别，每个标签带数量。
- D4 改名入口在**设置页新增「类别」区块**：7 行（色点 + 名称输入框），留空恢复默认名。
- D5 过滤状态**记在 URL**：`/?category=<key>`；刷新 / 后退 / 收藏保持，从其它页面点回首页回到「全部」。

默认类别名称：

| key（颜色） | 默认名 |
|---|---|
| rose 玫瑰 | 纪念日 |
| orange 橙 | 生日 |
| amber 琥珀 | 节日 |
| emerald 翠绿 | 生活 |
| sky 天蓝 | 工作 |
| violet 紫 | 学习 |
| slate 石板 | 其他 |

## Requirements

- R1 每个倒数日有且仅有一个类别（7 个 key 之一），新建默认 `rose`（纪念日）。存量数据的类别 = 原 `color` 值。
- R2 卡片颜色完全由类别决定；表单中「颜色」选择器替换为「类别」选择器（显示色点 + 用户当前类别名）。
- R3 卡片上显示类别名（替代 / 补充现有色点旁的信息）。
- R4 首页在卡片列表上方显示单选过滤栏：「全部」+ 有条目的类别（按 key 固定顺序），标签显示「类别名 数量」；数量 = 该类别下全部条目数（含置顶）。只有 0 或 1 个类别有条目时可不显示过滤栏。
- R5 选中某类别时：置顶条目（含 hero）**全部照常显示**，非置顶条目只显示该类别的。
- R6 过滤状态写入 URL 查询参数 `category`；参数非法或该类别已无条目时按「全部」处理。
- R7 设置页「类别」区块：7 行名称输入，名称 trim 后 1–10 字；留空 = 恢复默认名；保存后首页、表单、API 输出立即使用新名。
- R8 API / MCP 兼容按 D2 实现；OpenAPI 文档同步更新（`category` enum、`categoryName`、`color` deprecated）。

## Acceptance Criteria

- [ ] AC1 (R1) 升级后已有倒数日的类别与原颜色一一对应，卡片颜色不变；迁移在空库与已有数据库上都能自动执行。
- [ ] AC2 (R2/R3) 新建/编辑表单只有类别选择、没有独立颜色选择；选「生日」后卡片为橙色并显示「生日」。
- [ ] AC3 (R4/R5) 有置顶 A（工作）、非置顶 B（生日）、C（工作）时，选「生日」→ 显示 A（hero）+ B，不显示 C；选「全部」→ A、B、C 都显示。
- [ ] AC4 (R4) 过滤栏只列出有条目的类别，数量正确；删除某类别最后一个条目后该标签消失，若正选中则回到「全部」。
- [ ] AC5 (R6) 选「生日」后网址为 `/?category=orange`，刷新后仍是该过滤；访问 `/?category=xxx` 显示全部、不报错。
- [ ] AC6 (R7) 设置里把「工作」改成「上班」→ 首页标签、卡片、表单、API `categoryName` 都显示「上班」；清空后恢复「工作」；超过 10 字被拒绝并提示。改名只影响当前用户。
- [ ] AC7 (R8) `POST /api/v1/days` 传 `{"color":"sky"}`（不传 category）→ 创建成功、`category=sky`；同时传 `color:"sky", category:"violet"` → `category=violet`、`color=violet`；GET 返回含 `category`、`categoryName`、`color`。MCP `create_day` / `update_day` 同样接受 `category`。
- [ ] AC8 `pnpm test`、`pnpm typecheck`、`pnpm build` 通过；新增集成测试覆盖 AC7 与类别改名的服务层行为，单元测试覆盖过滤逻辑（置顶不受影响）。

## Out of Scope

- 用户新增 / 删除类别、自定义类别颜色
- 多选过滤、在浏览器本地记住过滤
- REST / MCP 列表接口按类别过滤（`GET /days?category=`）
- 通过 REST / MCP 读取或修改类别名称（只在设置页改；API 只在 Day 上输出 `categoryName`）
- 统计、按类别分组展示
