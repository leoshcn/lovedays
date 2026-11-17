import { errorResponse } from "@/lib/errors";
import { w12Response, widgetW12 } from "@/lib/services/widget";

/**
 * Same as `/api/v1/widget/w12`, with the **read-only** key as a path segment. Needed because the
 * iOS API Widget app strips query strings from the endpoint URL.
 */
export async function GET(req: Request, ctx: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await ctx.params;
    return w12Response(await widgetW12(req, key));
  } catch (err) {
    return errorResponse(err);
  }
}
