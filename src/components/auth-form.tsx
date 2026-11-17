"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

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

  const input = "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none focus:border-stone-500";

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">LoveDays</h1>
        <p className="mt-1 text-sm text-stone-500">{isLogin ? "登录你的账号" : "用邮箱创建账号"}</p>
        <label className="mt-6 block text-sm text-stone-600">
          邮箱
          <input type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label className="mt-4 block text-sm text-stone-600">
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
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={pending} className="mt-6 w-full rounded-lg bg-stone-900 py-2.5 text-white disabled:opacity-50">
          {pending ? "请稍候…" : isLogin ? "登录" : "注册"}
        </button>
        <p className="mt-4 text-center text-sm text-stone-500">
          {isLogin ? "还没有账号？" : "已有账号？"}
          <Link href={isLogin ? "/register" : "/login"} className="text-stone-900 underline">
            {isLogin ? "注册" : "登录"}
          </Link>
        </p>
      </form>
    </main>
  );
}
