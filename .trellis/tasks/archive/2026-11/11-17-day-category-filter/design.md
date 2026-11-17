# Design — 倒数日类别字段与首页过滤

## Data Model

### `day` 表：复用 `color` 列存类别，不改列名

```ts
// schema.ts
category: text("color", { enum: DAY_CATEGORIES }).notNull().default("rose"),
// DB 列名仍为 color（历史原因）：值即类别 key，颜色由类别派生。
```

- 存量数据零转换，`day` 表**无迁移**（只改 TS 属性名；drizzle 按列名比对，generate 不会产生 day 的 diff——实现时需确认）。
- 取舍：DB 列名与语义不一致，用注释说明。不选 rename 列，是因为 `drizzle-kit generate` 遇到 rename 会进交互式提示，且 spec 规定不能手改生成的 SQL。

### 新表 `category_label`（用户自定义名称）

```ts
export const categoryLabel = pgTable("category_label", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  category: text("category", { enum: DAY_CATEGORIES }).notNull(),
  name: text("name").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.category] })]);
```

- 只存改过的名字；没有记录 = 默认名。留空保存 = 删除该行。
- 不往 Better Auth 的 `user` 表加 JSON 列，避免碰 Better Auth 的模型约束。
- 用 `pnpm db:generate` 生成 `drizzle/0001_*.sql`。

## Domain / Schemas — `src/lib/days/`

- 新文件 `categories.ts`（纯函数，无 DB）：
  - `DAY_CATEGORIES = ["rose","orange","amber","emerald","sky","violet","slate"] as const`、`type DayCategory`
  - `DEFAULT_CATEGORY_NAMES: Record<DayCategory, string>`
  - `resolveCategoryNames(overrides: Partial<Record<DayCategory,string>>)` → 完整的名称表
  - `filterDays(days, category | null)` → 置顶全部保留，非置顶按类别过滤（首页使用，单元测试覆盖）
  - `parseCategory(value: unknown): DayCategory | null`
- `schemas.ts`：`DAY_COLORS` 保留为 `DAY_CATEGORIES` 的别名（颜色 key 与类别 key 相同）；`fields.category = z.enum(DAY_CATEGORIES)`；`fields.color` 保留，加说明「Deprecated, alias of category」。create/update shape 两个都是 optional。
  - 归一化：在 service 里处理 `category ?? color`（schema 只做校验），create 与 update 共用一个 helper。
  - 新增 `categoryNameSchema = z.string().trim().min(1).max(10)`。

## Service — `src/lib/services/`

- `days.ts`
  - `DayDto` 新增 `category: DayCategory`、`categoryName: string`；`color` 保留（= category）。
  - `listDays` / `getDay` / `createDay` / `updateDay` 每次请求读一次用户的名称表（一次查询），传给 `toDto`。
  - insert/update 写 `category: input.category ?? input.color ?? current/default`。
- 新文件 `categories.ts`：`getCategoryNames(userId)`、`setCategoryName(userId, category, name | null)`（null/空 → 删行；否则 upsert `onConflictDoUpdate`）。所有查询按 `userId` 过滤。

## Web

- `src/app/actions.ts`：新增 `setCategoryNameAction(category, name)`，`revalidatePath("/")` 与 `"/settings"`。
- `src/app/page.tsx`：读 `searchParams.category`，并行取 `listDays` 和 `getCategoryNames`；把 `days`、`names`、`category`（已解析的）传给 `DayBoard`。
- `src/components/category-filter.tsx`（新）：单选标签栏，基于 `days` 统计每类数量，只渲染 count>0 的类别；点击用 `router.replace` 更新 `?category=`（选「全部」时去掉参数），`scroll: false`。0 或 1 个类别有条目时不渲染。
- `day-board.tsx`：`visible = filterDays(days, active)`，active 只有在该类别仍有条目时才有效，否则视为 null；hero 逻辑在 `visible` 上算（置顶都保留，hero 不变）。
- `day-card.tsx`：显示 `day.categoryName`（色点后），颜色用 `colorStyle(day.category)`。
- `day-form.tsx`：「颜色」区块换成「类别」：7 个按钮（色点 + 名称），名称来自传入的 `names`。
- `colors.ts`：`COLOR_STYLES` 键改为类别类型（值相同）；`label` 字段（颜色中文名）可保留给设置页展示。
- `src/app/settings/page.tsx` + 新组件 `category-name-editor.tsx`：7 行，每行色点 + 输入框（placeholder = 默认名），失焦或点「保存」时调用 action；错误内联显示。

## API / MCP

- REST 路由与 MCP 工具都复用 schemas/service，自动获得 `category`；MCP 工具描述里提到 category。
- `openapi.ts`：`dayDto` 加 `category`（enum）、`categoryName`，`color` 标 `deprecated: true` 并写说明；CreateDay/UpdateDay 由 zod 生成，会带上 `category`，并通过 `.meta({ deprecated: true })` 标记 color（如果 zod 4 的 toJSONSchema 支持，否则写在 description 里）。

## Compatibility & Rollback

- 老客户端只传 / 只读 `color`：行为不变。
- 回滚：`category_label` 表是新增的，旧代码会忽略它；`day` 表结构没变，可以直接回滚代码。
