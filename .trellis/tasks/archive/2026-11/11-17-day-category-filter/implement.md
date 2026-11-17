# Implement Plan — 倒数日类别字段与首页过滤

## Ordered Checklist

1. **Domain**：`src/lib/days/categories.ts`（常量、默认名、`resolveCategoryNames`、`filterDays`、`parseCategory`）+ `categories.test.ts`（过滤时置顶不受影响、非法参数）。
2. **Schemas**：`schemas.ts` 加 `category` 字段、`categoryNameSchema`；`color` 标为 deprecated 的别名；`DAY_COLORS` 改为 `DAY_CATEGORIES` 的别名。
3. **DB**：`schema.ts` 中 `day.category = text("color", …)`，新增 `categoryLabel` 表 → `pnpm db:generate`。**检查生成的 SQL 里只有 `CREATE TABLE category_label`，没有改动 `day` 表**。
4. **Service**：新增 `services/categories.ts`；`services/days.ts` 的 DTO 加 `category` / `categoryName`，并处理 `category ?? color` 归一化。
5. **Integration tests**（`integration.test.ts`）：REST 只传 color、color 和 category 都传、GET 返回字段；MCP create_day 传 category；改名、清空、超过 10 字报错、不同用户互不影响。
6. **OpenAPI**：`dayDto` 字段与 deprecated 标记。
7. **Web**：actions → page.tsx（searchParams）→ category-filter → day-board → day-card → day-form → settings 的类别编辑区块。
8. **README**：功能列表加「类别 + 过滤」，API 一节说明 `category`。

## Validation

```bash
pnpm typecheck
pnpm test
pnpm build
```

手动：`pnpm dev`，逐条走一遍 PRD 的 AC3–AC6（过滤 / URL / 改名）。

## Risky Points

- `pnpm db:generate` 如果把 `color` → `category` 当成 rename 进了交互提示，说明 TS 映射没写对，应改 schema，不要选 rename。
- 文件路径在当前环境里带反斜杠（`src\lib\...`），新建文件要和现有命名方式保持一致。
- `page.tsx` 的 `searchParams` 在 Next 16 里是 Promise，需要 `await`。
- 部署：迁移在第一次 `getDb()` 时自动执行；部署目标主机内存有限，构建流程沿用 `scripts/deploy.sh`，不要额外加步骤。
