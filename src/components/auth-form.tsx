"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { BUTTON_PRIMARY, ERROR_BANNER, FIELD, PANEL } from "./styles";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isLogin = mode === "login";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = isLogin
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({
          email,
          password,
          name: email.split("@")[0] ?? email,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
    setPending(false);
    if (error) {
      setError(error.message ?? (isLogin ? "登录失败" : "注册失败"));
      return;
    }
    router.push("/");
    router.refresh();
  }

  const input = `${FIELD} mt-1 w-full`;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form onSubmit={submit} className={`w-full max-w-sm ${PANEL} p-8`}>
        <h1 className="font-display text-2xl font-bold tracking-tight">LoveDays</h1>
        <p className="mt-1 text-sm text-muted">{isLogin ? "登录你的账号" : "用邮箱创建账号"}</p>
        <label className="mt-6 block text-sm text-muted">
          邮箱
          <input type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label className="mt-4 block text-sm text-muted">
          密码
          <input
            type="password"
            className={input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </label>
        {error && (
          <p role="alert" className={`mt-4 ${ERROR_BANNER}`}>
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} className={`mt-6 w-full py-2.5 ${BUTTON_PRIMARY}`}>
          {pending ? "请稍候…" : isLogin ? "登录" : "注册"}
        </button>
        <p className="mt-4 text-center text-sm text-muted">
          {isLogin ? "还没有账号？" : "已有账号？"}
          <Link href={isLogin ? "/register" : "/login"} className="rounded text-fg underline underline-offset-2">
            {isLogin ? "注册" : "登录"}
          </Link>
        </p>
      </form>
    </main>
  );
}
