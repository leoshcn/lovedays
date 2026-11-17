# LoveDays MVP: 倒数日 Web App + Agent 协同 + 开放 API

## Goal

做一个类「倒数日」的网页版 App，人可以在网页上管理纪念日/倒计时，AI Agent 可以通过标准接口协同操作，第三方可以通过开放 API 集成。

## Requirements

### 1. 事件（Day）管理
- 事件 CRUD：标题、目标日期、备注、分类、颜色/图标、置顶
- 自动计算：未来日期显示「还有 N 天」，过去日期显示「已经 N 天」
- 重复规则：不重复 / 每年 / 每月 / 每周（重复事件显示下一次发生）
- 农历日期支持（可后置）
- 时区：以用户时区计算「天」

### 2. Web App
- 响应式布局，移动端优先
- 首页列表 + 置顶大卡片；事件详情；新建/编辑表单
- 用户账号（邮箱登录或 OAuth，待定）

### 3. 开放 API
- REST API，版本前缀 `/api/v1`
- 鉴权：用户生成的 API Key（可吊销、可设权限范围 read/write）
- OpenAPI 文档自动生成
- 速率限制

### 4. AI Agent 协同
- 提供 MCP Server（工具：list_days / get_day / create_day / update_day / delete_day / upcoming）
- Agent 与 Web UI 共享同一套服务层与权限模型
- 操作审计：记录由哪个 Agent / API Key 发起的变更

## Acceptance Criteria

- [ ] 用户可在网页上创建、编辑、删除事件，天数计算正确（含重复规则、跨时区边界）
- [ ] 使用 API Key 可通过 `/api/v1` 完成事件 CRUD，并有 OpenAPI 文档
- [ ] MCP 客户端（如 Claude Code）可连接并通过工具操作事件
- [ ] 核心日期计算逻辑有单元测试覆盖

## Open Questions

- 技术栈（前端框架、后端运行时、数据库、部署平台）
- 登录方式
- 是否需要分享/情侣共享空间等社交功能
