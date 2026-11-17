import { toW12Rows } from "@/lib/days/widget";
import { errorResponse } from "@/lib/errors";
import { authenticateRequest } from "@/lib/services/api-keys";
import { listDays } from "@/lib/services/days";

/**
 * Days as an API Widget W12 row array. The iOS app cannot send headers, so a
 * **read-only** key may be passed as `?key=ld_...`.
 */
export async function GET(req: Request) {
  try {
    const p = await authenticateRequest(req, { allowQueryKey: true });
    const rows = toW12Rows(await listDays(p.userId));
    return Response.json(rows, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}
