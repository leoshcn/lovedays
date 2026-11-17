import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { ApiKeyManager } from "@/components/api-key-manager";
import { CategoryNameEditor } from "@/components/category-name-editor";
import { HEADER_BUTTON, PANEL } from "@/components/styles";
import { ThemeSelect, ThemeToggle } from "@/components/theme-toggle";
import { requireUser } from "@/lib/auth/session";
import { listApiKeys } from "@/lib/services/api-keys";
import { getCategoryNames } from "@/lib/services/categories";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const [keys, names] = await Promise.all([listApiKeys(user.id), getCategoryNames(user.id)]);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">设置</h1>
        <nav className="-mr-2 flex items-center gap-0.5">
          <ThemeToggle />
          <Link href="/" className={HEADER_BUTTON}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span>返回</span>
          </Link>
        </nav>
      </header>

      <section className={`${PANEL} p-6`}>
        <h2 className="font-semibold">账号</h2>
        <p className="mt-1 text-sm text-muted">{user.email}</p>
      </section>

      <section className={`mt-6 ${PANEL} p-6`}>
        <h2 className="font-semibold">外观</h2>
        <p className="mt-1 text-sm text-muted">主题偏好只保存在当前设备的浏览器中。</p>
        <ThemeSelect />
      </section>

      <section className={`mt-6 ${PANEL} p-6`}>
        <h2 className="font-semibold">类别</h2>
        <p className="mt-1 text-sm text-muted">
          每个类别对应固定的卡片颜色。可以改名（1–10 个字），留空恢复默认名称。
        </p>
        <CategoryNameEditor names={names} />
      </section>

      <section className={`mt-6 ${PANEL} p-6`}>
        <h2 className="font-semibold">API Key</h2>
        <p className="mt-1 text-sm text-muted">
          用于开放 API 和 AI Agent（MCP）。<code>read</code> 只读，<code>write</code> 可读写。
        </p>
        <ApiKeyManager keys={keys} />
      </section>

      <section className={`mt-6 ${PANEL} p-6 text-sm`}>
        <h2 className="font-semibold">接入方式</h2>
        <h3 className="mt-4 font-medium">REST API</h3>
        <p className="mt-1 text-muted">
          文档：
          <a className="rounded underline underline-offset-2" href="/api/v1/openapi.json">
            /api/v1/openapi.json
          </a>
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-code p-3 text-xs text-code-fg">
          {`curl ${origin}/api/v1/days -H "Authorization: Bearer ld_..."`}
        </pre>
        <h3 className="mt-4 font-medium">AI Agent（MCP，Streamable HTTP）</h3>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-code p-3 text-xs text-code-fg">
          {`claude mcp add --transport http lovedays ${origin}/api/mcp \\
  --header "Authorization: Bearer ld_..."`}
        </pre>
      </section>
    </main>
  );
}
