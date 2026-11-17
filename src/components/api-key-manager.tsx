"use client";

import { useState, useTransition } from "react";
import { createApiKeyAction, revokeApiKeyAction } from "@/app/actions";
import type { ApiKeyDto, ApiScope } from "@/lib/services/api-keys";

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

  const input = "rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-500";

  return (
    <div className="mt-4">
      {newKey && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-900">请立即复制，此 Key 只显示一次：</p>
          <code className="mt-2 block break-all rounded bg-white p-2 text-xs">{newKey}</code>
          <button
            type="button"
            className="mt-2 text-xs underline"
            onClick={() => navigator.clipboard.writeText(newKey)}
          >
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
        <button type="submit" disabled={pending} className="rounded-lg bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50">
          创建
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-4 divide-y divide-stone-100">
        {keys.length === 0 && <li className="py-3 text-sm text-stone-500">暂无 API Key</li>}
        {keys.map((k) => (
          <li key={k.id} className="flex items-center justify-between gap-2 py-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium">
                {k.name} <span className="ml-1 rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">{k.scope}</span>
              </p>
              <p className="text-xs text-stone-500">
                {k.prefix}… · 最近使用 {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "从未"}
              </p>
            </div>
            <button type="button" disabled={pending} onClick={() => revoke(k)} className="text-xs text-red-600 hover:underline">
              吊销
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
