import Link from "next/link";
import { DayBoard } from "@/components/day-board";
import { SignOutButton } from "@/components/sign-out-button";
import { requireUser } from "@/lib/auth/session";
import { listDays, userToday } from "@/lib/services/days";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requireUser();
  const [days, today] = await Promise.all([listDays(user.id), userToday(user.id)]);

  return (
    <main className="mx-auto max-w-5xl px-4 pt-6 pb-28">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">LoveDays</h1>
        <nav className="flex items-center gap-3 text-sm text-stone-600">
          <Link href="/settings" className="hover:text-stone-900">
            设置
          </Link>
          <SignOutButton />
        </nav>
      </header>
      <DayBoard days={days} today={today} />
    </main>
  );
}
