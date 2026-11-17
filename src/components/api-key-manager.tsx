"use client";

import { Copy } from "lucide-react";
import { useState, useTransition } from "react";
import { createApiKeyAction, revokeApiKeyAction } from "@/app/actions";
import type { ApiKeyDto, ApiScope } from "@/lib/services/api-keys";
import { BUTTON_PRIMARY, ERROR_BANNER, FIELD } from "./styles";

export function ApiKeyManager({ keys }: { keys: ApiKeyDto[] }) {
  const [name, setName] = useState("");
  const [scope, setScope] = useState<ApiScope>("write");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await createApiKeyAction(name, scope);
      if (r.ok) {
        setNewKey(r.data ?? null);
        setName("");
      } else setError(r.error);
    });
  }

  function revoke(k: ApiKeyDto) {
    if (!confirm(`吊销「${k.name}」？使用它的 Agent / 集成将立即失效。`)) return;
    startTransition(async () => {
      const r = await revokeApiKeyAction(k.id);
      if (!r.ok) setError(r.error);
    });
  }

  const input = `${FIELD} text-sm`;

  return (
    <div className="mt-4">
      {newKey && (
        <div className="mb-4 rounded-xl border border-warn-line bg-warn-soft p-3 text-sm text-warn-fg">
          <p className="font-medium">请立即复制，此 Key 只显示一次：</p>
          <code className="mt-2 block rounded-lg border border-line bg-surface p-2 text-xs break-all text-fg">{newKey}</code>
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1 rounded text-xs underline underline-offset-2"
            onClick={() => navigator.clipboard.writeText(newKey)}
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
            复制
          </button>
        </div>
      )}

      <form onSubmit={create} className="flex flex-wrap gap-2">
        <input className={`${input} min-w-0 flex-1`} placeholder="名称，如 Claude Agent" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
        <select className={input} value={scope} onChange={(e) => setScope(e.target.value as ApiScope)}>
          <option value="write">write</option>
          <option value="read">read</option>
        </select>
        <button type="submit" disabled={pending} className={`px-4 py-2 text-sm ${BUTTON_PRIMARY}`}>
          创建
        </button>
      </form>
      {error && (
        <p role="alert" className={`mt-3 ${ERROR_BANNER}`}>
          {error}
        </p>
      )}

      <ul className="mt-4 divide-y divide-line">
        {keys.length === 0 && <li className="py-3 text-sm text-subtle">暂无 API Key</li>}
        {keys.map((k) => (
          <li key={k.id} className="flex items-center justify-between gap-2 py-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium">
                {k.name} <span className="ml-1 rounded bg-surface-2 px-1.5 py-0.5 text-xs text-muted">{k.scope}</span>
              </p>
              <p className="text-xs text-subtle">
                {k.prefix}… · 最近使用 {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "从未"}
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => revoke(k)}
              className="shrink-0 rounded-lg px-2 py-1 text-xs text-danger transition-colors hover:bg-danger-soft disabled:opacity-50"
            >
              吊销
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
