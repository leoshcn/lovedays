import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { auth } from "./auth";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/** Current web session user, or null. Ensures migrations ran before Better Auth touches the DB. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const h = await headers(); // read request data first so the route is always dynamic
  await getDb();
  const session = await auth.api.getSession({ headers: h });
  if (!session) return null;
  return { id: session.user.id, email: session.user.email, name: session.user.name };
}

/** For pages and server actions: redirect to /login when not signed in. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
