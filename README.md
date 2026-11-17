# LoveDays

类「倒数日」的网页版 App：卡片式管理倒数日 / 纪念日，支持 AI Agent（MCP）协同和开放 REST API。

## 功能

- **三种倒数日**
  - 一次性：到期前倒数，过了目标日自动删除
  - 到期正数：到期后显示「xxx 已经 N 天」
  - 重复：每 n 周 / 每 n 月 / 每 n 年，显示距下一次的天数（月末、闰日自动取当月最后一天）
- **置顶**：置顶卡片排最前，第一个以大卡片展示
- **类别**：7 个固定类别（纪念日 / 生日 / 节日 / 生活 / 工作 / 学习 / 其他），类别决定卡片颜色；可在「设置」里给类别改名（1–10 字，留空恢复默认，仅对自己生效）
- **按类别过滤**：首页单选标签栏（「全部」+ 有条目的类别，带数量），过滤状态记在网址 `/?category=<key>`；置顶条目不受过滤影响，始终显示
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

## 部署（Docker）

```bash
echo "DEPLOY_TARGET=root@your-server" > .env.deploy   # 本地文件，不提交
bash scripts/deploy.sh
```

脚本把当前提交传到目标机，在限制了内存/CPU 的临时容器里构建，再用 `docker compose` 启动 app + PostgreSQL（默认端口 3060）。首次部署会自动生成 `.env`（随机密钥），需在目标机上把 `BETTER_AUTH_URL` 改为实际访问地址；经反向代理访问时把代理地址加入 `TRUSTED_ORIGINS`。

## 接入

在「设置」页创建 API Key（只显示一次）。

Day 的类别字段：

- 输出：`category`（类别 key：`rose` 纪念日 · `orange` 生日 · `amber` 节日 · `emerald` 生活 · `sky` 工作 · `violet` 学习 · `slate` 其他）、`categoryName`（用户当前的类别名）、`color`（已弃用，恒等于 `category`）
- 输入：首选 `category`；仍接受旧字段 `color` 并按同名 key 映射为类别，两者都传以 `category` 为准。REST 与 MCP（`create_day` / `update_day`）一致
- 类别名称只能在设置页修改，API 不提供读写类别名称的接口

```bash
curl http://localhost:3000/api/v1/days -H "Authorization: Bearer ld_..."

# Claude Code 接入 MCP
claude mcp add --transport http lovedays http://localhost:3000/api/mcp \
  --header "Authorization: Bearer ld_..."
```

## 开发流程

使用 [Trellis](https://github.com/mindfold-ai/Trellis) 管理 AI 协作开发：规范在 `.trellis/spec/`，任务与 PRD 在 `.trellis/tasks/`。
