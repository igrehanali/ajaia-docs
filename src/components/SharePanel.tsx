"use client";

import { useEffect, useState } from "react";

interface Share {
  userId: string;
  name: string;
  email: string;
  role: "viewer" | "editor";
}

export default function SharePanel({ docId, onClose }: { docId: string; onClose: () => void }) {
  const [shares, setShares] = useState<Share[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("editor");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/documents/${docId}/shares`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error);
        setShares(body.shares);
      })
      .catch((e) => setError(e.message ?? "Couldn't load sharing."));
  }, [docId]);

  async function call(method: "POST" | "DELETE", payload: object) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/documents/${docId}/shares`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setError(body?.error ?? "Something went wrong.");
      return false;
    }
    setShares(body.shares);
    return true;
  }

  async function share(e: React.FormEvent) {
    e.preventDefault();
    if (await call("POST", { email, role })) setEmail("");
  }

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center bg-black/20 p-4 pt-24" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center">
          <h2 id="share-title" className="text-lg font-semibold">
            Share document
          </h2>
          <button onClick={onClose} className="press ml-auto rounded-md px-2 text-gray-500 hover:bg-gray-100" aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={share} className="mt-4 flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="bob@ajaia.test"
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            aria-label="Email of the person to share with"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "viewer" | "editor")}
            className="rounded-lg border border-gray-300 px-2 text-sm"
            aria-label="Access level"
          >
            <option value="editor">Can edit</option>
            <option value="viewer">View only</option>
          </select>
          <button
            disabled={busy}
            className="press rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Share
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-500">
          Demo users: alice@ajaia.test, bob@ajaia.test, carol@ajaia.test
        </p>
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <h3 className="mt-5 text-sm font-semibold text-gray-700">People with access</h3>
        <ul className="mt-2 space-y-2">
          <li className="text-sm text-gray-500">You (owner)</li>
          {shares === null && !error && <li className="text-sm text-gray-400">Loading…</li>}
          {shares?.map((s) => (
            <li key={s.userId} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate">
                {s.name} <span className="text-gray-400">{s.email}</span>
              </span>
              <select
                value={s.role}
                disabled={busy}
                onChange={(e) => call("POST", { email: s.email, role: e.target.value })}
                className="rounded-md border border-gray-200 px-1 py-0.5 text-xs"
                aria-label={`Access for ${s.name}`}
              >
                <option value="editor">Can edit</option>
                <option value="viewer">View only</option>
              </select>
              <button
                disabled={busy}
                onClick={() => call("DELETE", { userId: s.userId })}
                className="press rounded-md px-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
