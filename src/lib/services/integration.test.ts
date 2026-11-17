import { beforeAll, describe, expect, it } from "vitest";

// Must be set before any module touches the DB.
process.env.PGLITE_DIR = "memory://";
delete process.env.DATABASE_URL;

const { getDb, schema } = await import("@/lib/db");
const { todayIn, addMonths } = await import("@/lib/days/engine");
const days = await import("./days");
const keys = await import("./api-keys");
const categories = await import("./categories");
const { buildOpenApiDocument } = await import("@/lib/openapi");
const daysRoute = await import("@/app/api/v1/days/route");
const dayRoute = await import("@/app/api/v1/days/[id]/route");
const mcpRoute = await import("@/app/api/mcp/route");
const widgetRoute = await import("@/app/api/v1/widget/w12/route");
const widgetKeyRoute = await import("@/app/api/v1/widget/w12/[key]/route");

const TZ = "Asia/Shanghai";
const USER = "user-1";
const OTHER = "user-2";
let writeKey: string;
let readKey: string;

function shift(date: string, d: number): string {
  const t = new Date(`${date}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + d);
  return t.toISOString().slice(0, 10);
}

beforeAll(async () => {
  const db = await getDb();
  await db.insert(schema.user).values([
    { id: USER, name: "u1", email: "u1@example.com", timezone: TZ },
    { id: OTHER, name: "u2", email: "u2@example.com", timezone: TZ },
  ]);
  writeKey = (await keys.createApiKey(USER, { name: "w", scope: "write" })).key;
  readKey = (await keys.createApiKey(USER, { name: "r", scope: "read" })).key;
});

describe("day service", () => {
  it("purges expired one-time days on read", async () => {
    const today = todayIn(TZ);
    const db = await getDb();
    await db.insert(schema.day).values({
      id: "expired-once",
      userId: USER,
      title: "过期",
      targetDate: shift(today, -1),
      kind: "once",
    });
    const list = await days.listDays(USER);
    expect(list.find((d) => d.id === "expired-once")).toBeUndefined();
    const rows = await db.select().from(schema.day);
    expect(rows.find((r) => r.id === "expired-once")).toBeUndefined();
  });

  it("keeps one-time days on the day itself", async () => {
    const today = todayIn(TZ);
    const d = await days.createDay(USER, { title: "今天", targetDate: today, kind: "once" });
    expect(d.status).toBe("today");
    expect((await days.listDays(USER)).some((x) => x.id === d.id)).toBe(true);
    await days.deleteDay(USER, d.id);
  });

  it("rejects one-time days in the past", async () => {
    await expect(
      days.createDay(USER, { title: "x", targetDate: shift(todayIn(TZ), -1), kind: "once" }),
    ).rejects.toMatchObject({ code: "validation_error" });
  });

  it("counts up after target", async () => {
    const d = await days.createDay(USER, { title: "在一起", targetDate: shift(todayIn(TZ), -100), kind: "countup" });
    expect(d).toMatchObject({ status: "elapsed", days: 100, label: "在一起 已经 100 天" });
  });

  it("computes repeat next occurrence and validates repeat fields", async () => {
    await expect(
      days.createDay(USER, { title: "x", targetDate: "2020-01-01", kind: "repeat" }),
    ).rejects.toMatchObject({ name: "ZodError" });
    const anchor = addMonths(todayIn(TZ), -12);
    const d = await days.createDay(USER, {
      title: "周年",
      targetDate: anchor,
      kind: "repeat",
      repeatUnit: "year",
      repeatInterval: 1,
    });
    expect(d).toMatchObject({ status: "today", days: 0 });
  });

  it("clears repeat fields when kind changes", async () => {
    const d = await days.createDay(USER, {
      title: "r",
      targetDate: "2026-01-01",
      kind: "repeat",
      repeatUnit: "week",
      repeatInterval: 2,
    });
    const u = await days.updateDay(USER, d.id, { kind: "countup" });
    expect(u).toMatchObject({ kind: "countup", repeatUnit: null, repeatInterval: null });
  });

  it("sorts pinned first and isolates users", async () => {
    const d = await days.createDay(USER, { title: "置顶", targetDate: shift(todayIn(TZ), 300), kind: "countup" });
    await days.setPinned(USER, d.id, true);
    expect((await days.listDays(USER))[0]?.id).toBe(d.id);
    await expect(days.getDay(OTHER, d.id)).rejects.toMatchObject({ code: "not_found" });
    expect(await days.listDays(OTHER)).toEqual([]);
  });

  it("keeps at most one pinned day per user", async () => {
    const future = shift(todayIn(TZ), 10);
    const a = await days.createDay(USER, { title: "A", targetDate: future, kind: "countup", pinned: true });
    const other = await days.createDay(OTHER, { title: "O", targetDate: future, kind: "countup", pinned: true });
    const b = await days.createDay(USER, { title: "B", targetDate: future, kind: "countup", pinned: true });
    let pinned = (await days.listDays(USER)).filter((d) => d.pinned).map((d) => d.id);
    expect(pinned).toEqual([b.id]);
    await days.setPinned(USER, a.id, true);
    pinned = (await days.listDays(USER)).filter((d) => d.pinned).map((d) => d.id);
    expect(pinned).toEqual([a.id]);
    // Other users' pins are untouched.
    expect((await days.getDay(OTHER, other.id)).pinned).toBe(true);
    await days.deleteDay(OTHER, other.id);
  });
});

describe("REST API", () => {
  const req = (url: string, key: string | null, init: RequestInit = {}) =>
    new Request(`http://localhost${url}`, {
      ...init,
      headers: { ...(key ? { authorization: `Bearer ${key}` } : {}), "content-type": "application/json" },
    });

  it("requires an API key", async () => {
    const res = await daysRoute.GET(req("/api/v1/days", null));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: { code: "unauthorized" } });
  });

  it("supports CRUD with a write key", async () => {
    const created = await daysRoute.POST(
      req("/api/v1/days", writeKey, {
        method: "POST",
        body: JSON.stringify({ title: "API", targetDate: shift(todayIn(TZ), 5), kind: "once" }),
      }),
    );
    expect(created.status).toBe(201);
    const { data } = (await created.json()) as { data: { id: string; days: number } };
    expect(data.days).toBe(5);

    const ctx = { params: Promise.resolve({ id: data.id }) };
    const patched = await dayRoute.PATCH(
      req(`/api/v1/days/${data.id}`, writeKey, { method: "PATCH", body: JSON.stringify({ title: "API2" }) }),
      ctx,
    );
    expect(((await patched.json()) as { data: { title: string } }).data.title).toBe("API2");

    const del = await dayRoute.DELETE(req(`/api/v1/days/${data.id}`, writeKey, { method: "DELETE" }), ctx);
    expect(del.status).toBe(204);
    const gone = await dayRoute.GET(req(`/api/v1/days/${data.id}`, writeKey), ctx);
    expect(gone.status).toBe(404);
  });

  it("forbids writes with a read key and validates input", async () => {
    const forbidden = await daysRoute.POST(
      req("/api/v1/days", readKey, { method: "POST", body: JSON.stringify({}) }),
    );
    expect(forbidden.status).toBe(403);
    const invalid = await daysRoute.POST(
      req("/api/v1/days", writeKey, { method: "POST", body: JSON.stringify({ title: "", kind: "x" }) }),
    );
    expect(invalid.status).toBe(400);
    expect(((await invalid.json()) as { error: { code: string } }).error.code).toBe("validation_error");
  });
});

describe("W12 widget endpoint", () => {
  const url = (q: string) => new Request(`http://localhost/api/v1/widget/w12${q}`);

  it("accepts a read key in the URL and returns a W12 array", async () => {
    const created = await days.createDay(USER, { title: "Widget", kind: "countup", targetDate: "2020-01-01" });
    const res = await widgetRoute.GET(url(`?key=${readKey}`));
    expect(res.status).toBe(200);
    const rows = (await res.json()) as { key: string; value?: string }[];
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeLessThanOrEqual(12);
    expect(rows).toContainEqual(expect.objectContaining({ key: "Widget", value: expect.stringMatching(/^已经 \d+ 天$/) }));
    await days.deleteDay(USER, created.id);
  });

  it("rejects a write key in the URL but still accepts headers", async () => {
    const res = await widgetRoute.GET(url(`?key=${writeKey}`));
    expect(res.status).toBe(403);
    const ok = await widgetRoute.GET(
      new Request("http://localhost/api/v1/widget/w12", { headers: { authorization: `Bearer ${writeKey}` } }),
    );
    expect(ok.status).toBe(200);
  });

  it("accepts a read key as a path segment (API Widget drops query strings)", async () => {
    const at = (key: string) =>
      widgetKeyRoute.GET(new Request(`http://localhost/api/v1/widget/w12/${key}`), {
        params: Promise.resolve({ key }),
      });
    const ok = await at(readKey);
    expect(ok.status).toBe(200);
    expect(Array.isArray(await ok.json())).toBe(true);
    expect((await at(writeKey)).status).toBe(403);
    expect((await at("ld_nope")).status).toBe(401);
    expect((await at("nope")).status).toBe(401);
  });

  it("requires a valid key", async () => {
    expect((await widgetRoute.GET(url(""))).status).toBe(401);
    expect((await widgetRoute.GET(url("?key=ld_nope"))).status).toBe(401);
  });

  it("does not accept URL keys on the regular REST API", async () => {
    const res = await daysRoute.GET(new Request(`http://localhost/api/v1/days?key=${readKey}`));
    expect(res.status).toBe(401);
  });
});

describe("REST API categories", () => {
  const post = (body: unknown) =>
    daysRoute.POST(
      new Request("http://localhost/api/v1/days", {
        method: "POST",
        headers: { authorization: `Bearer ${writeKey}`, "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  type Dto = { id: string; category: string; categoryName: string; color: string };

  it("accepts the deprecated color field as category", async () => {
    const res = await post({ title: "旧客户端", targetDate: shift(todayIn(TZ), 3), kind: "once", color: "sky" });
    expect(res.status).toBe(201);
    const { data } = (await res.json()) as { data: Dto };
    expect(data).toMatchObject({ category: "sky", color: "sky", categoryName: "工作" });
  });

  it("prefers category when both category and color are sent", async () => {
    const res = await post({
      title: "两者",
      targetDate: shift(todayIn(TZ), 3),
      kind: "once",
      color: "sky",
      category: "violet",
    });
    expect(res.status).toBe(201);
    const { data } = (await res.json()) as { data: Dto };
    expect(data).toMatchObject({ category: "violet", color: "violet", categoryName: "学习" });

    const ctx = { params: Promise.resolve({ id: data.id }) };
    const patched = await dayRoute.PATCH(
      new Request(`http://localhost/api/v1/days/${data.id}`, {
        method: "PATCH",
        headers: { authorization: `Bearer ${writeKey}`, "content-type": "application/json" },
        body: JSON.stringify({ color: "amber" }),
      }),
      ctx,
    );
    expect(((await patched.json()) as { data: Dto }).data).toMatchObject({ category: "amber", color: "amber" });
  });

  it("defaults to rose and returns category fields on GET", async () => {
    const res = await post({ title: "默认", targetDate: shift(todayIn(TZ), 3), kind: "once" });
    const { data } = (await res.json()) as { data: Dto };
    expect(data).toMatchObject({ category: "rose", color: "rose", categoryName: "纪念日" });

    const got = await dayRoute.GET(
      new Request(`http://localhost/api/v1/days/${data.id}`, { headers: { authorization: `Bearer ${readKey}` } }),
      { params: Promise.resolve({ id: data.id }) },
    );
    expect(((await got.json()) as { data: Dto }).data).toMatchObject({
      category: "rose",
      categoryName: "纪念日",
      color: "rose",
    });

    const list = await daysRoute.GET(
      new Request("http://localhost/api/v1/days", { headers: { authorization: `Bearer ${readKey}` } }),
    );
    const items = ((await list.json()) as { data: Dto[] }).data;
    expect(items.length).toBeGreaterThan(0);
    for (const d of items) {
      expect(d.category).toBeTruthy();
      expect(d.categoryName).toBeTruthy();
      expect(d.color).toBe(d.category);
    }
  });

  it("documents category and marks color deprecated in OpenAPI", () => {
    const doc = buildOpenApiDocument();
    const s = doc.components.schemas as Record<string, any>;
    expect(s.Day.properties.category.enum).toContain("violet");
    expect(s.Day.properties.categoryName.type).toBe("string");
    expect(s.Day.properties.color.deprecated).toBe(true);
    expect(s.CreateDay.properties.category).toBeDefined();
    expect(s.CreateDay.properties.color.deprecated).toBe(true);
    expect(s.UpdateDay.properties.color.deprecated).toBe(true);
  });

  it("rejects an unknown category", async () => {
    const res = await post({ title: "x", targetDate: shift(todayIn(TZ), 3), kind: "once", category: "pink" });
    expect(res.status).toBe(400);
  });
});

describe("category names", () => {
  it("renames, resets and isolates per user", async () => {
    const d = await days.createDay(USER, { title: "项目", targetDate: shift(todayIn(TZ), 20), kind: "countup", category: "sky" });
    expect(d.categoryName).toBe("工作");

    const names = await categories.setCategoryName(USER, "sky", "  上班  ");
    expect(names.sky).toBe("上班");
    expect((await days.getDay(USER, d.id)).categoryName).toBe("上班");
    expect((await days.listDays(USER)).find((x) => x.id === d.id)?.categoryName).toBe("上班");

    // Other users keep the default name
    expect((await categories.getCategoryNames(OTHER)).sky).toBe("工作");
    const o = await days.createDay(OTHER, { title: "别人", targetDate: shift(todayIn(TZ), 20), kind: "countup", category: "sky" });
    expect(o.categoryName).toBe("工作");

    // Rename again (upsert)
    expect((await categories.setCategoryName(USER, "sky", "打工")).sky).toBe("打工");

    // Blank resets to default
    expect((await categories.setCategoryName(USER, "sky", "   ")).sky).toBe("工作");
    await categories.setCategoryName(USER, "sky", "上班");
    expect((await categories.setCategoryName(USER, "sky", null)).sky).toBe("工作");
    expect((await days.getDay(USER, d.id)).categoryName).toBe("工作");

    // Saving the default name stores no override
    expect((await categories.setCategoryName(USER, "sky", " 工作 ")).sky).toBe("工作");

    const db = await getDb();
    expect(await db.select().from(schema.categoryLabel)).toEqual([]);
  });

  it("rejects names longer than 10 characters and unknown categories", async () => {
    await expect(categories.setCategoryName(USER, "sky", "一二三四五六七八九十一")).rejects.toMatchObject({
      name: "ZodError",
    });
    expect((await categories.setCategoryName(USER, "sky", "一二三四五六七八九十")).sky).toBe("一二三四五六七八九十");
    await expect(categories.setCategoryName(USER, "pink" as never, "x")).rejects.toMatchObject({ name: "ZodError" });
    await categories.setCategoryName(USER, "sky", null);
  });
});

describe("MCP endpoint", () => {
  async function rpc(key: string, method: string, params: unknown = {}) {
    const res = await mcpRoute.POST(
      new Request("http://localhost/api/mcp", {
        method: "POST",
        headers: {
          authorization: `Bearer ${key}`,
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          "mcp-protocol-version": "2025-06-18",
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      }),
    );
    return { status: res.status, body: (await res.json()) as { result?: any; error?: unknown } };
  }

  it("lists tools", async () => {
    const { status, body } = await rpc(writeKey, "tools/list");
    expect(status).toBe(200);
    const names = body.result.tools.map((t: { name: string }) => t.name);
    expect(names).toEqual(["list_days", "get_day", "create_day", "update_day", "delete_day"]);
  });

  it("creates and lists days via tools", async () => {
    const created = await rpc(writeKey, "tools/call", {
      name: "create_day",
      arguments: { title: "MCP", targetDate: shift(todayIn(TZ), 10), kind: "countup" },
    });
    expect(created.body.result.isError).toBeFalsy();
    const listed = await rpc(writeKey, "tools/call", { name: "list_days", arguments: {} });
    expect(listed.body.result.content[0].text).toContain("距离 MCP 还有 10 天");
  });

  it("accepts category in create_day and update_day", async () => {
    const created = await rpc(writeKey, "tools/call", {
      name: "create_day",
      arguments: { title: "MCP 生日", targetDate: shift(todayIn(TZ), 7), kind: "countup", category: "orange" },
    });
    expect(created.body.result.isError).toBeFalsy();
    const day = JSON.parse(created.body.result.content[0].text);
    expect(day).toMatchObject({ category: "orange", categoryName: "生日", color: "orange" });

    const updated = await rpc(writeKey, "tools/call", {
      name: "update_day",
      arguments: { id: day.id, category: "emerald" },
    });
    expect(updated.body.result.isError).toBeFalsy();
    expect(JSON.parse(updated.body.result.content[0].text)).toMatchObject({ category: "emerald", categoryName: "生活" });
  });

  it("returns a tool error for writes with a read key", async () => {
    const r = await rpc(readKey, "tools/call", {
      name: "create_day",
      arguments: { title: "x", targetDate: todayIn(TZ), kind: "once" },
    });
    expect(r.body.result.isError).toBe(true);
    expect(r.body.result.content[0].text).toContain("forbidden");
  });

  it("rejects missing API key", async () => {
    const res = await mcpRoute.POST(new Request("http://localhost/api/mcp", { method: "POST", body: "{}" }));
    expect(res.status).toBe(401);
  });
});
