import { headers } from "next/headers";
import Link from "next/link";
import { ApiKeyManager } from "@/components/api-key-manager";
import { requireUser } from "@/lib/auth/session";
import { listApiKeys } from "@/lib/services/api-keys";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const keys = await listApiKeys(user.id);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">设置</h1>
        <Link href="/" className="text-sm text-stone-600 hover:text-stone-900">
          ← 返回
        </Link>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold">账号</h2>
        <p className="mt-1 text-sm text-stone-600">{user.email}</p>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold">API Key</h2>
        <p className="mt-1 text-sm text-stone-600">
          用于开放 API 和 AI Agent（MCP）。<code>read</code> 只读，<code>write</code> 可读写。
        </p>
        <ApiKeyManager keys={keys} />
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm text-sm">
        <h2 className="font-semibold">接入方式</h2>
        <h3 className="mt-4 font-medium">REST API</h3>
        <p className="mt-1 text-stone-600">
          文档：
          <a className="underline" href="/api/v1/openapi.json">
            /api/v1/openapi.json
          </a>
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-stone-900 p-3 text-xs text-stone-100">
          {`curl ${origin}/api/v1/days -H "Authorization: Bearer ld_..."`}
        </pre>
        <h3 className="mt-4 font-medium">AI Agent（MCP，Streamable HTTP）</h3>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-stone-900 p-3 text-xs text-stone-100">
          {`claude mcp add --transport http lovedays ${origin}/api/mcp \\
  --header "Authorization: Bearer ld_..."`}
        </pre>
      </section>
    </main>
  );
}
