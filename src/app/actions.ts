"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import type { CreateDayInput, UpdateDayInput } from "@/lib/days/schemas";
import { toAppError } from "@/lib/errors";
import { createApiKey, revokeApiKey, type ApiScope } from "@/lib/services/api-keys";
import { createDay, deleteDay, setPinned, updateDay } from "@/lib/services/days";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

async function wrap<T>(fn: () => Promise<T>, path = "/"): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    revalidatePath(path);
    return { ok: true, data };
  } catch (err) {
    // redirect() from requireUser must propagate
    if (err instanceof Error && "digest" in err) throw err;
    return { ok: false, error: toAppError(err).message };
  }
}

export async function createDayAction(input: CreateDayInput): Promise<ActionResult> {
  const u = await requireUser();
  return wrap(async () => void (await createDay(u.id, input)));
}

export async function updateDayAction(id: string, input: UpdateDayInput): Promise<ActionResult> {
  const u = await requireUser();
  return wrap(async () => void (await updateDay(u.id, id, input)));
}

export async function togglePinAction(id: string, pinned: boolean): Promise<ActionResult> {
  const u = await requireUser();
  return wrap(async () => void (await setPinned(u.id, id, pinned)));
}

export async function deleteDayAction(id: string): Promise<ActionResult> {
  const u = await requireUser();
  return wrap(async () => void (await deleteDay(u.id, id)));
}

export async function createApiKeyAction(name: string, scope: ApiScope): Promise<ActionResult<string>> {
  const u = await requireUser();
  return wrap(async () => (await createApiKey(u.id, { name, scope })).key, "/settings");
}

export async function revokeApiKeyAction(id: string): Promise<ActionResult> {
  const u = await requireUser();
  return wrap(async () => void (await revokeApiKey(u.id, id)), "/settings");
}
