import { errorResponse } from "@/lib/errors";
import { w12Response, widgetW12 } from "@/lib/services/widget";

/**
 * Days as an API Widget W12 row array. Auth: Bearer header, or a **read-only** key as `?key=ld_...`.
 * The iOS API Widget app drops query strings — it must use `/api/v1/widget/w12/<key>` instead.
 */
export async function GET(req: Request) {
  try {
    return w12Response(await widgetW12(req, new URL(req.url).searchParams.get("key")));
  } catch (err) {
    return errorResponse(err);
  }
}
