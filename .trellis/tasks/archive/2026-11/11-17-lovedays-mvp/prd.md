# LoveDays MVP: 倒数日 Web App + Agent 协同 + 开放 API

## Goal

类「倒数日」的网页版 App。用户用邮箱登录，以卡片形式管理倒数日；AI Agent 可通过 MCP 协同操作；第三方可通过开放 REST API 集成。

## Decisions

- 技术栈：用户无偏好，由 AI 选定（见 design.md）
- 登录：邮箱 + 密码
- 不做社交 / 共享功能

## Requirements

### R1 创建倒数日（3 种计算类型）
| 类型 | key | 行为 |
|------|-----|------|
| 一次性 | `once` | 目标日前显示「还有 N 天」，当天显示「就是今天」；**目标日过后自动删除，从列表消失** |
| 到期正数 | `countup` | 目标日前倒数；当天「就是今天」；过后显示「{标题} 已经 N 天」 |
| 重复 | `repeat` | 每 n 周 / 每 n 月 / 每 n 年重复；始终显示距下一次发生的天数 |

- 一次性倒数日的日期不能早于今天（否则创建后会立即被删除）
- 字段：标题（必填，≤50 字）、目标/起始日期、类型、重复单位 + 间隔 n（仅 repeat，n 为 1–99）、备注（可选）、颜色、置顶
- 月/年重复遇到不存在的日期（如 31 号、2 月 29 日）时取当月最后一天，且不漂移（下一期仍按原始日计算）
- 「天」按用户时区计算（默认 `Asia/Shanghai`）

### R2 置顶
- 卡片可切换置顶；置顶卡片排在最前，第一个置顶卡片以大卡片（hero）展示

### R3 卡片式管理
- 首页为卡片网格：标题、大号天数、状态文案、目标/下次日期、类型标签
- 卡片操作：置顶 / 取消置顶、编辑、删除（带确认）
- 排序：置顶优先 → 倒数中（剩余天数升序）→ 正数中（已过天数升序）
- 响应式，移动端优先

### R4 账号
- 邮箱 + 密码注册、登录、登出；所有数据按用户隔离

### R5 开放 API
- REST `/api/v1/days`（list / get / create / update / delete），JSON
- 鉴权：`Authorization: Bearer <API Key>`；用户在设置页创建、吊销 Key，Key 只显示一次，库中只存哈希；scope 为 `read` 或 `write`
- OpenAPI 文档：`/api/v1/openapi.json`
- 统一错误格式 `{ "error": { "code", "message" } }`

### R6 AI Agent 协同（MCP）
- Streamable HTTP MCP 端点 `/api/mcp`，与 REST 共用 API Key 鉴权
- 工具：`list_days`、`get_day`、`create_day`、`update_day`、`delete_day`
- Web、REST、MCP 共用同一服务层，行为一致

## Acceptance Criteria

- [x] 网页可注册/登录，创建三种类型的倒数日，卡片显示的天数与文案正确
- [x] 一次性倒数日在目标日次日不再出现在 Web / API / MCP 结果中，并被物理删除
- [x] 重复类型每 n 周/月/年的下次日期正确（含月末、闰日）
- [x] 置顶卡片排在最前，第一个以 hero 卡展示
- [x] 持 API Key 可经 `/api/v1/days` 完成 CRUD；read scope 的 Key 写操作返回 403
- [x] MCP 客户端可连接 `/api/mcp` 并调用全部工具
- [x] 日期计算核心逻辑有单元测试；`pnpm build`、`pnpm test`、`pnpm typecheck` 通过

## Out of Scope (MVP)

- 农历、提醒推送、共享/社交、分类、导入导出、邮件验证/找回密码
