"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { HEADER_BUTTON } from "./styles";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className={HEADER_BUTTON}
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      <LogOut className="h-4 w-4" aria-hidden />
      <span>退出</span>
    </button>
  );
}
