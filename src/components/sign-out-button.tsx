"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="hover:text-stone-900"
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      退出
    </button>
  );
}
