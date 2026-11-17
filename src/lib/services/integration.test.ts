import { beforeAll, describe, expect, it } from "vitest";

// Must be set before any module touches the DB.
process.env.PGLITE_DIR = "memory://";
delete process.env.DATABASE_URL;

const { getDb, schema } = await import("@/lib/db");
const { todayIn, addMonths } = await import("@/lib/days/engine");
const days = await import("./days");
const keys = await import("./api-keys");
const daysRoute = await import("@/app/api/v1/days/route");
const dayRoute = await import("@/app/api/v1/days/[id]/route");
const mcpRoute = await import("@/app/api/mcp/route");

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
