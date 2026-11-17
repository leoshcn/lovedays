import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createDayShape, updateDayShape } from "@/lib/days/schemas";
import { toAppError } from "@/lib/errors";
import { requireWrite, type ApiPrincipal } from "@/lib/services/api-keys";
import { createDay, deleteDay, getDay, listDays, updateDay } from "@/lib/services/days";

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

async function run(fn: () => Promise<unknown>): Promise<ToolResult> {
  try {
    const result = await fn();
    return { content: [{ type: "text", text: JSON.stringify(result ?? { ok: true }, null, 2) }] };
  } catch (err) {
    const e = toAppError(err);
    return { content: [{ type: "text", text: `${e.code}: ${e.message}` }], isError: true };
  }
}

const idShape = { id: z.string().describe("Day id") };

/** Build an MCP server bound to one authenticated principal (stateless, one per request). */
export function createMcpServer(p: ApiPrincipal): McpServer {
  const server = new McpServer(
    { name: "lovedays", version: "1.0.0" },
    {
      instructions:
        "LoveDays manages countdown/anniversary days. kind=once: deleted automatically after the date; " +
        "kind=countup: after the date shows days elapsed; kind=repeat: recurs every repeatInterval repeatUnit(s). " +
        "Dates are YYYY-MM-DD in the user's time zone. Each day has a category (rose/orange/amber/emerald/sky/violet/slate) " +
        "that determines its color; categoryName is the user's name for it. color is a deprecated alias of category.",
    },
  );

  server.registerTool(
    "list_days",
    {
      title: "List days",
      description: "List all of the user's days, pinned first then soonest. Each item includes status, days and label.",
      annotations: { readOnlyHint: true },
    },
    () => run(() => listDays(p.userId)),
  );

  server.registerTool(
    "get_day",
    { title: "Get day", description: "Get one day by id.", inputSchema: idShape, annotations: { readOnlyHint: true } },
    ({ id }) => run(() => getDay(p.userId, id)),
  );

  server.registerTool(
    "create_day",
    { title: "Create day", description: "Create a countdown/anniversary day. Set category to classify it (default rose).", inputSchema: createDayShape },
    (input) =>
      run(async () => {
        requireWrite(p);
        return createDay(p.userId, input);
      }),
  );

  server.registerTool(
    "update_day",
    {
      title: "Update day",
      description:
        "Update fields of a day. Only provided fields change. Use pinned=true/false to pin or unpin (only one day can be pinned; pinning unpins the previous one); category to reclassify.",
      inputSchema: { ...idShape, ...updateDayShape },
    },
    ({ id, ...patch }) =>
      run(async () => {
        requireWrite(p);
        return updateDay(p.userId, id, patch);
      }),
  );

  server.registerTool(
    "delete_day",
    {
      title: "Delete day",
      description: "Permanently delete a day.",
      inputSchema: idShape,
      annotations: { destructiveHint: true },
    },
    ({ id }) =>
      run(async () => {
        requireWrite(p);
        await deleteDay(p.userId, id);
        return { ok: true, deleted: id };
      }),
  );

  return server;
}
