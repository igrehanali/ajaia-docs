"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Doc {
  id: string;
  title: string;
  updatedAt: string;
  ownerName: string;
  role: "owner" | "editor" | "viewer";
}

function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(iso).toLocaleDateString();
}

const roleStyle = {
  owner: "bg-gray-100 text-gray-700",
  editor: "bg-green-50 text-green-700",
  viewer: "bg-amber-50 text-amber-700",
};

function DocList({ docs, empty, showOwner }: { docs: Doc[]; empty: string; showOwner?: boolean }) {
  if (!docs.length) {
    return <p className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
      {docs.map((d) => (
        <li key={d.id}>
          <Link href={`/docs/${d.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
            <span aria-hidden className="text-lg">📄</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{d.title}</span>
              <span className="block text-xs text-gray-500">
                {showOwner ? `Owned by ${d.ownerName} · ` : ""}Edited {timeAgo(d.updatedAt)}
              </span>
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${roleStyle[d.role]}`}>
              {d.role === "owner" ? "Owner" : d.role === "editor" ? "Can edit" : "View only"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard({ owned, shared }: { owned: Doc[]; shared: Doc[] }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"create" | "upload" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createDoc() {
    setBusy("create");
    setError(null);
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error ?? "Couldn't create a document.");
      setBusy(null);
      return;
    }
    router.push(`/docs/${body.id}`);
  }

  async function upload(file: File) {
    setBusy("upload");
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/import", { method: "POST", body: form });
    const body = await res.json().catch(() => null);
    if (fileInput.current) fileInput.current.value = "";
    if (!res.ok) {
      setError(body?.error ?? "Upload failed.");
      setBusy(null);
      return;
    }
    router.push(`/docs/${body.id}`);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold tracking-tight">Documents</h1>
        <button
          onClick={() => fileInput.current?.click()}
          disabled={busy !== null}
          className="press rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
        >
          {busy === "upload" ? "Importing…" : "Upload file"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".txt,.md,.docx"
          className="hidden"
          aria-label="Upload a .txt, .md or .docx file"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
        <button
          onClick={createDoc}
          disabled={busy !== null}
          className="press rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {busy === "create" ? "Creating…" : "+ New document"}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Upload turns a <strong>.txt</strong>, <strong>.md</strong> or <strong>.docx</strong> file (max 2 MB) into a
        new editable document.
      </p>
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          My documents ({owned.length})
        </h2>
        <DocList docs={owned} empty="No documents yet. Create one or upload a file." />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Shared with me ({shared.length})
        </h2>
        <DocList docs={shared} showOwner empty="Nothing shared with you yet. Switch user to share a document." />
      </section>
    </main>
  );
}
