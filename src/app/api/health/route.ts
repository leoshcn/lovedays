import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Liveness + DB readiness (migrations applied). Used by the Docker healthcheck. */
export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok" });
  } catch (err) {
    console.error("[lovedays] health check failed", err);
    return Response.json({ status: "error" }, { status: 503 });
  }
}
