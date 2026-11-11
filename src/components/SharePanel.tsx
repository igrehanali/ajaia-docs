"use client";

import { useEffect, useState } from "react";
import type { User } from "@/lib/auth";
import Avatar from "./Avatar";
import UserPicker from "./UserPicker";

interface Share {
  userId: string;
  name: string;
  email: string;
  role: "viewer" | "editor";
}

export default function SharePanel({
  docId,
  users,
  currentUserId,
  onClose,
}: {
  docId: string;
  users: User[];
  currentUserId: string;
  onClose: () => void;
}) {
  const [shares, setShares] = useState<Share[] | null>(null);
  const [person, setPerson] = useState<User | null>(null);
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

  // Escape closes the dialog, like a native sheet. (An open picker swallows its own Escape first.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
    if (!person) return;
    if (await call("POST", { email: person.email, role })) setPerson(null);
  }

  const byId = new Map(users.map((u) => [u.id, u]));
  const sharedIds = new Set(shares?.map((s) => s.userId));
  const candidates = users.filter((u) => u.id !== currentUserId && !sharedIds.has(u.id));
  const me = byId.get(currentUserId);

  return (
    <div
      className="backdrop fixed inset-0 z-30 flex items-start justify-center bg-black/25 p-4 pt-24 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="sheet w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5"
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
          <UserPicker options={candidates} value={person} onChange={setPerson} disabled={busy || shares === null} />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "viewer" | "editor")}
            className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm"
            aria-label="Access level"
          >
            <option value="editor">Can edit</option>
            <option value="viewer">View only</option>
          </select>
          <button
            disabled={busy || !person}
            className="press h-9 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Share
          </button>
        </form>
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <h3 className="mt-6 text-sm font-semibold text-gray-700">People with access</h3>
        <ul className="mt-3 space-y-3">
          <li className="flex items-center gap-2.5 text-sm">
            {me && <Avatar user={me} size={32} />}
            <span className="min-w-0 flex-1">
              <span className="block truncate">
                {me?.name ?? "You"} <span className="text-gray-400">(you)</span>
              </span>
              {me && <span className="block truncate text-xs text-gray-400">{me.email}</span>}
            </span>
            <span className="px-1 text-xs text-gray-500">Owner</span>
          </li>
          {shares === null && !error && <li className="text-sm text-gray-400">Loading…</li>}
          {shares?.map((s) => {
            const u = byId.get(s.userId);
            return (
              <li key={s.userId} className="rise flex items-center gap-2.5 text-sm">
                {u && <Avatar user={u} size={32} />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{s.name}</span>
                  <span className="block truncate text-xs text-gray-400">{s.email}</span>
                </span>
                <select
                  value={s.role}
                  disabled={busy}
                  onChange={(e) => call("POST", { email: s.email, role: e.target.value })}
                  className="rounded-md border border-gray-200 bg-white px-1 py-0.5 text-xs"
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
            );
          })}
        </ul>
      </div>
    </div>
  );
}
