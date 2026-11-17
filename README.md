# LoveDays

类「倒数日」的网页版 App：卡片式管理倒数日 / 纪念日，支持 AI Agent（MCP）协同和开放 REST API。

## 功能

- **三种倒数日**
  - 一次性：到期前倒数，过了目标日自动删除
  - 到期正数：到期后显示「xxx 已经 N 天」
  - 重复：每 n 周 / 每 n 月 / 每 n 年，显示距下一次的天数（月末、闰日自动取当月最后一天）
- **置顶**：置顶卡片排最前，第一个以大卡片展示
- **卡片式管理**：新建、编辑、置顶、删除
- **邮箱 + 密码登录**，数据按用户隔离，天数按用户时区计算
- **开放 API**：`/api/v1/days`，API Key 鉴权（read / write），OpenAPI 文档 `/api/v1/openapi.json`
- **AI Agent**：MCP 端点 `/api/mcp`（Streamable HTTP），工具 `list_days / get_day / create_day / update_day / delete_day`

## 技术栈

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Drizzle ORM · PostgreSQL（本地默认 PGlite，无需安装数据库）· Better Auth · Zod 4 · MCP SDK · Vitest

## 本地开发

```bash
pnpm install
cp .env.example .env.local   # 设置 BETTER_AUTH_SECRET
pnpm dev                     # http://localhost:3000
```

不设置 `DATABASE_URL` 时使用嵌入式 PGlite，数据存于 `.data/`；设置后连接 PostgreSQL。迁移在首次访问数据库时自动执行。

| 命令 | 说明 |
|------|------|
| `pnpm test` | 单元 + 集成测试（内存数据库，含 REST 与 MCP） |
| `pnpm typecheck` | 类型检查 |
| `pnpm build` | 生产构建 |
| `pnpm db:generate` | 修改 schema 后生成迁移 |

## 接入

在「设置」页创建 API Key（只显示一次）。

```bash
curl http://localhost:3000/api/v1/days -H "Authorization: Bearer ld_..."

# Claude Code 接入 MCP
claude mcp add --transport http lovedays http://localhost:3000/api/mcp \
  --header "Authorization: Bearer ld_..."
```

## 开发流程

使用 [Trellis](https://github.com/mindfold-ai/Trellis) 管理 AI 协作开发：规范在 `.trellis/spec/`，任务与 PRD 在 `.trellis/tasks/`。
