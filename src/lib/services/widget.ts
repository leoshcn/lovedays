import { toW12Rows, type W12Row } from "@/lib/days/widget";
import { authenticateRequest } from "./api-keys";
import { listDays } from "./days";

/** W12 rows for the key's owner. `urlKey` is a read key taken from the URL (see `AuthOptions`). */
export async function widgetW12(req: Request, urlKey: string | null): Promise<W12Row[]> {
  const p = await authenticateRequest(req, { urlKey });
  return toW12Rows(await listDays(p.userId));
}

export function w12Response(rows: W12Row[]): Response {
  return Response.json(rows, { headers: { "cache-control": "no-store" } });
}
