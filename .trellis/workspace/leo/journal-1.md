# Journal - leo (Part 1)

> AI development session journal
> Started: 2026-11-17

---



## Session 1: LoveDays MVP: 初始化、开发、Docker 部署与开源

**Date**: 2026-11-17
**Task**: LoveDays MVP: 初始化、开发、Docker 部署与开源
**Branch**: `main`

### Summary

从零初始化 git + Trellis，完成倒数日 MVP（三种计算类型、置顶、卡片管理、邮箱登录、REST API、MCP），Docker 部署到共享部署机并推送到公开 GitHub 仓库

### Main Changes

- Next.js 16 + Drizzle/PostgreSQL（本地 PGlite）+ Better Auth；纯函数日期引擎支持 once/countup/repeat（每 n 周/月/年，月末与闰日夹取）
- Web、REST /api/v1/days（API Key read/write + OpenAPI）、MCP /api/mcp 共用同一服务层；一次性倒数日在读取时惰性删除
- Docker：在限制内存/CPU 的临时容器中构建，Dockerfile.runtime 仅复制产物；app/db 各限 512MB；/api/health 健康检查
- TRUSTED_ORIGINS 支持反向代理访问；.gitattributes 强制 LF；部署目标改由本地 .env.deploy 提供
- 按实际代码填写 .trellis/spec 前后端规范；归档 bootstrap 与 MVP 任务

### Git Commits

| Hash | Message |
|------|---------|
| `719752e` | (see git log) |
| `59faaa9` | (see git log) |
| `c7f0f59` | (see git log) |
| `b62fd72` | (see git log) |
| `105af1c` | (see git log) |
| `b90117c` | (see git log) |
| `9343aeb` | (see git log) |
| `4c7ee33` | (see git log) |
| `586f18a` | (see git log) |
| `a1382df` | (see git log) |

### Testing

- [OK] 31 个 Vitest 测试（日期引擎单测 + 内存 PGlite 集成测试，覆盖 REST 与 MCP），typecheck、build 通过
- [OK] 线上冒烟：注册/登录、页面、REST CRUD、MCP tools/list 与 tools/call、错误 Key 401、未知 Origin 403

### Status

[OK] **Completed**

### Next Steps

- 教训：首次在共享部署机上无限制构建导致整机卡死，需人工重启；之后只用 scripts/deploy.sh（3g 内存上限，2g 会 OOM）
- 待做：找回密码/邮箱验证（需邮件服务）、农历、提醒推送


## Session 2: 倒数日类别字段与首页过滤

**Date**: 2026-11-17
**Task**: 倒数日类别字段与首页过滤
**Branch**: `main`

### Summary

新增 7 个固定类别（与颜色 1:1，用户可改名，category_label 表）；首页单选过滤 ?category=，置顶不受影响；REST/MCP 新增 category/categoryName，color 保留为 deprecated 别名；已部署到部署机并验收；spec 记录列名映射、API 兼容、URL 过滤状态约定

### Git Commits

| Hash | Message |
|------|---------|
| `a72f68d` | (see git log) |
| `41d911b` | (see git log) |

### Status

[OK] **Completed**


## Session 3: Single pin, delete in edit dialog, form relayout + deploy

**Date**: 2026-11-17
**Task**: Single pin, delete in edit dialog, form relayout + deploy
**Branch**: `main`

### Summary

Only one pinned day per user (service-level, transactional unpin of others; REST/MCP docs updated, test added). Delete button moved from home cards into edit dialog footer. Edit dialog relayout; fixed repeat row wrapping caused by w-full vs w-20 conflict. Deployed d1845fd to deploy host via scripts/deploy.sh; health ok; user accepted.

### Git Commits

| Hash | Message |
|------|---------|
| `d1845fd` | (see git log) |
| `9e672e2` | (see git log) |

### Status

[OK] **Completed**


## Session 4: 视觉设计优化与暗色模式

**Date**: 2026-11-17
**Task**: 视觉设计优化与暗色模式
**Branch**: `main`

### Summary

规划并实现视觉优化：语义色 token（亮/暗）、系统/浅色/深色三态主题（localStorage + 防闪烁脚本）、lucide 图标、Outfit 数字字体、弹窗进出场动画/Esc/滚动锁定、卡片微交互、focus-visible 与 reduced-motion；check 修复弹窗计时器误关新弹窗的 bug 与暗色代码块对比度；已通过 deploy.sh 限内存构建部署到部署机（160b3cd，健康检查 200）。浏览器人工验收由用户进行。

### Git Commits

| Hash | Message |
|------|---------|
| `160b3cd` | (see git log) |

### Status

[OK] **Completed**
