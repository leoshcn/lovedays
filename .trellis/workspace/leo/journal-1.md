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
