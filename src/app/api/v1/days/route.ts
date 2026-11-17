import { errorResponse } from "@/lib/errors";
import { authenticateRequest, requireWrite } from "@/lib/services/api-keys";
import { createDay, listDays } from "@/lib/services/days";

export async function GET(req: Request) {
  try {
    const p = await authenticateRequest(req);
    return Response.json({ data: await listDays(p.userId) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const p = await authenticateRequest(req);
    requireWrite(p);
    const body: unknown = await req.json().catch(() => ({}));
    return Response.json({ data: await createDay(p.userId, body as never) }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
