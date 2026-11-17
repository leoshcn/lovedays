import { errorResponse } from "@/lib/errors";
import { authenticateRequest, requireWrite } from "@/lib/services/api-keys";
import { deleteDay, getDay, updateDay } from "@/lib/services/days";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const p = await authenticateRequest(req);
    const { id } = await ctx.params;
    return Response.json({ data: await getDay(p.userId, id) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const p = await authenticateRequest(req);
    requireWrite(p);
    const { id } = await ctx.params;
    const body: unknown = await req.json().catch(() => ({}));
    return Response.json({ data: await updateDay(p.userId, id, body as never) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const p = await authenticateRequest(req);
    requireWrite(p);
    const { id } = await ctx.params;
    await deleteDay(p.userId, id);
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
