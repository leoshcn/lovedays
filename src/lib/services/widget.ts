import { toW12Rows, type W12Row } from "@/lib/days/widget";
import { authenticateRequest } from "./api-keys";
import { listDays } from "./days";

/** W12 rows for the key's owner. `urlKey` is a read key taken from the URL (see `AuthOptions`). */
export async function widgetW12(req: Request, urlKey: string | null): Promise<W12Row[]> {
  const p = await authenticateRequest(req, { urlKey });
  return toW12Rows(await listDays(p.userId));
}

/**
 * JSON with every non-ASCII character escaped as `\uXXXX`. The iOS API Widget app ignored the
 * missing charset and decoded UTF-8 as another encoding (garbled Chinese); an ASCII-only body
 * decodes correctly whatever charset the client assumes.
 */
export function asciiJson(value: unknown): string {
  return JSON.stringify(value).replace(
    /[\u007f-￿]/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}

export function w12Response(rows: W12Row[]): Response {
  return new Response(asciiJson(rows), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
