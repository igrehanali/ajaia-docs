"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/auth";

export default function SignIn({ users }: { users: User[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(userId: string) {
    setPending(userId);
    setError(null);
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Sign-in failed.");
      setPending(null);
      return;
    }
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-3xl font-bold tracking-tight">Ajaia Docs</h1>
      <p className="mt-2 text-[15px] text-gray-500">
        Demo sign-in. Pick a seeded user. Switch users any time to test sharing.
      </p>
      <ul className="mt-8 space-y-3">
        {users.map((u) => (
          <li key={u.id}>
            <button
              onClick={() => signIn(u.id)}
              disabled={pending !== null}
              className="press flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm hover:border-gray-300 hover:shadow disabled:opacity-60"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ background: u.color }}
              >
                {u.name[0]}
              </span>
              <span className="flex-1">
                <span className="block font-medium">{u.name}</span>
                <span className="block text-sm text-gray-500">{u.email}</span>
              </span>
              {pending === u.id && <span className="text-sm text-gray-400">Signing in…</span>}
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <p className="mt-8 text-xs text-gray-400">
        Auth is mocked for this exercise: no passwords, the chosen user is stored in a cookie.
      </p>
    </main>
  );
}
