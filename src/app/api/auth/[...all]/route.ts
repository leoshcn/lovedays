import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/auth";
import { getDb } from "@/lib/db";

const handler = toNextJsHandler(auth);

// Ensure migrations ran before Better Auth touches the database.
export async function GET(req: Request) {
  await getDb();
  return handler.GET(req);
}

export async function POST(req: Request) {
  await getDb();
  return handler.POST(req);
}
