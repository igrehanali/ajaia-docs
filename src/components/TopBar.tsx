"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/auth";

export default function TopBar({ user, users }: { user: User; users: User[] }) {
  const router = useRouter();

  async function switchTo(userId: string) {
    if (userId === user.id) return;
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    router.push("/");
    router.refresh();
  }

  async function signOut() {
    await fetch("/api/session", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link href="/" className="font-semibold tracking-tight">
          Ajaia Docs
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ background: user.color }}
            aria-hidden
          >
            {user.name[0]}
          </span>
          <label className="sr-only" htmlFor="user-switch">
            Signed in as
          </label>
          <select
            id="user-switch"
            value={user.id}
            onChange={(e) => switchTo(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
            title="Switch demo user"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <button onClick={signOut} className="press rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
