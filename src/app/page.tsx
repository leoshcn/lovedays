import { Settings } from "lucide-react";
import Link from "next/link";
import { DayBoard } from "@/components/day-board";
import { SignOutButton } from "@/components/sign-out-button";
import { HEADER_BUTTON } from "@/components/styles";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireUser } from "@/lib/auth/session";
import { parseCategory } from "@/lib/days/categories";
import { getCategoryNames } from "@/lib/services/categories";
import { listDays, userToday } from "@/lib/services/days";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const { category } = await searchParams;
  const [days, today, names] = await Promise.all([
    listDays(user.id),
    userToday(user.id),
    getCategoryNames(user.id),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 pt-6 pb-28">
      <header className="mb-6 flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">LoveDays</h1>
        <nav className="-mr-2 flex items-center gap-0.5">
          <ThemeToggle />
          <Link href="/settings" className={HEADER_BUTTON}>
            <Settings className="h-4 w-4" aria-hidden />
            <span>设置</span>
          </Link>
          <SignOutButton />
        </nav>
      </header>
      <DayBoard days={days} today={today} names={names} category={parseCategory(category)} />
    </main>
  );
}
