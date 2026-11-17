import { z } from "zod";
import { DAY_KINDS, REPEAT_UNITS } from "@/lib/days/engine";
import { DAY_CATEGORIES, DEFAULT_CATEGORY_NAMES } from "@/lib/days/categories";
import { createDaySchema, updateDaySchema } from "@/lib/days/schemas";

const defaultNames = DAY_CATEGORIES.map((c) => `${c}=${DEFAULT_CATEGORY_NAMES[c]}`).join(", ");

const dayDto = {
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    note: { type: ["string", "null"] },
    targetDate: { type: "string", format: "date" },
    kind: { type: "string", enum: [...DAY_KINDS] },
    repeatUnit: { type: ["string", "null"], enum: [...REPEAT_UNITS, null] },
    repeatInterval: { type: ["integer", "null"] },
    pinned: { type: "boolean", description: "At most one day is pinned; pinning a day unpins the previously pinned one" },
    category: {
      type: "string",
      enum: [...DAY_CATEGORIES],
      description: `Category key; determines the card color. Default names: ${defaultNames}`,
    },
    categoryName: { type: "string", description: "The user's display name for the category (users may rename categories)" },
    color: {
      type: "string",
      enum: [...DAY_CATEGORIES],
      deprecated: true,
      description: "Deprecated: always equals category. Use category instead.",
    },
    status: {
      type: "string",
      enum: ["upcoming", "today", "elapsed"],
      description: "upcoming: counting down; today: the day itself; elapsed: countup days after target",
    },
    days: { type: "integer", description: "Days until displayDate (upcoming) or since targetDate (elapsed)" },
    displayDate: { type: "string", format: "date", description: "Target date or next repeat occurrence" },
    label: { type: "string", description: "Human-readable label in Chinese" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const error = {
  type: "object",
  properties: {
    error: {
      type: "object",
      properties: {
        code: { type: "string", enum: ["unauthorized", "forbidden", "not_found", "validation_error", "internal"] },
        message: { type: "string" },
      },
    },
  },
};

const errRef = { content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } };
const dayRes = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Day" } } },
    },
  },
});
const idParam = [{ name: "id", in: "path", required: true, schema: { type: "string" } }];

export function buildOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "LoveDays API",
      version: "1.0.0",
      description:
        "Countdown / anniversary days. Authenticate with `Authorization: Bearer ld_...` (create keys in Settings). " +
        "One-time (`once`) days are deleted automatically after their date passes.",
    },
    servers: [{ url: "/api/v1" }],
    security: [{ apiKey: [] }],
    components: {
      securitySchemes: {
        apiKey: { type: "http", scheme: "bearer", description: "LoveDays API key (ld_...)" },
        queryKey: { type: "apiKey", in: "query", name: "key", description: "Read-only key in the URL (widget endpoint only)" },
      },
      schemas: {
        Day: dayDto,
        CreateDay: z.toJSONSchema(createDaySchema, { io: "input" }),
        UpdateDay: z.toJSONSchema(updateDaySchema, { io: "input" }),
        Error: error,
      },
    },
    paths: {
      "/days": {
        get: {
          summary: "List days (pinned first, then soonest)",
          responses: {
            "200": {
              description: "Days",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { data: { type: "array", items: { $ref: "#/components/schemas/Day" } } },
                  },
                },
              },
            },
            "401": { description: "Unauthorized", ...errRef },
          },
        },
        post: {
          summary: "Create a day (write scope)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CreateDay" } } },
          },
          responses: {
            "201": dayRes("Created"),
            "400": { description: "Validation error", ...errRef },
            "401": { description: "Unauthorized", ...errRef },
            "403": { description: "Read-only key", ...errRef },
          },
        },
      },
      "/widget/w12": {
        get: {
          summary: "Days as an iOS API Widget W12 row array (max 12 rows)",
          description:
            "Returns a top-level array of `{ key, value?, color? }` rows (https://apiwidget.com/docs/w12). " +
            "Besides the Bearer header, a **read-only** key may be passed as `?key=ld_...` for clients that cannot set headers; " +
            "a write key in the URL is rejected with 403.",
          security: [{ apiKey: [] }, { queryKey: [] }],
          responses: {
            "200": {
              description: "W12 rows",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    maxItems: 12,
                    items: {
                      type: "object",
                      required: ["key"],
                      properties: {
                        key: { type: "string", maxLength: 24 },
                        value: { type: "string", maxLength: 24 },
                        color: { type: "string", enum: ["main", "muted", "info", "success", "warning", "danger"] },
                      },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthorized", ...errRef },
            "403": { description: "Write key passed in the URL", ...errRef },
          },
        },
      },
      "/days/{id}": {
        parameters: idParam,
        get: {
          summary: "Get a day",
          responses: { "200": dayRes("Day"), "404": { description: "Not found", ...errRef } },
        },
        patch: {
          summary: "Update a day (write scope)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateDay" } } },
          },
          responses: {
            "200": dayRes("Updated"),
            "400": { description: "Validation error", ...errRef },
            "403": { description: "Read-only key", ...errRef },
            "404": { description: "Not found", ...errRef },
          },
        },
        delete: {
          summary: "Delete a day (write scope)",
          responses: {
            "204": { description: "Deleted" },
            "403": { description: "Read-only key", ...errRef },
            "404": { description: "Not found", ...errRef },
          },
        },
      },
    },
  };
}
