"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Toolbar from "./Toolbar";
import SharePanel from "./SharePanel";
import type { User } from "@/lib/auth";

type Role = "owner" | "editor" | "viewer";
type SaveState = "saved" | "dirty" | "saving" | "error" | "conflict";

const SAVE_DELAY_MS = 800;

export default function DocEditor(props: {
  id: string;
  initialTitle: string;
  initialHtml: string;
  initialUpdatedAt: string;
  role: Role;
  users: User[];
  currentUserId: string;
}) {
  const { id, role } = props;
  const router = useRouter();
  const editable = role !== "viewer";
  const [title, setTitle] = useState(props.initialTitle);
  const [savedTitle, setSavedTitle] = useState(props.initialTitle);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [message, setMessage] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const baseUpdatedAt = useRef(props.initialUpdatedAt);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  // The editor's onUpdate is captured once, so it calls the latest save function through a ref.
  const saveRef = useRef<() => Promise<void>>(async () => {});

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: props.initialHtml || "<p></p>",
    editorProps: { attributes: { class: "doc-content", "aria-label": "Document content" } },
    onUpdate: () => {
      setSaveState("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void saveRef.current(), SAVE_DELAY_MS);
    },
  });

  const saveContent = useCallback(async () => {
    if (!editor) return;
    if (inFlight.current) await inFlight.current; // keep saves ordered
    const run = (async () => {
      setSaveState("saving");
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentHtml: editor.getHTML(), baseUpdatedAt: baseUpdatedAt.current }),
      }).catch(() => null);
      const body = await res?.json().catch(() => null);
      if (!res) {
        setSaveState("error");
        setMessage("You're offline. Changes will save when the connection is back.");
      } else if (res.status === 409) {
        setSaveState("conflict");
        setMessage(body?.error);
      } else if (!res.ok) {
        setSaveState("error");
        setMessage(body?.error ?? "Couldn't save.");
      } else {
        baseUpdatedAt.current = body.updatedAt;
        setSaveState("saved");
        setMessage(null);
      }
    })();
    inFlight.current = run;
    await run;
    inFlight.current = null;
  }, [editor, id]);
  useEffect(() => {
    saveRef.current = saveContent;
  }, [saveContent]);

  // Save before leaving if there are unsaved edits.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (saveState === "dirty" || saveState === "saving") e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  async function saveTitle() {
    const next = title.trim();
    if (!next) {
      setTitle(savedTitle);
      setMessage("Title can't be empty.");
      return;
    }
    if (next === savedTitle) return;
    const res = await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: next }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(body?.error ?? "Couldn't rename.");
      setTitle(savedTitle);
      return;
    }
    baseUpdatedAt.current = body.updatedAt;
    setSavedTitle(body.title);
    setTitle(body.title);
    setMessage(null);
  }

  async function deleteDoc() {
    if (!confirm("Delete this document? This can't be undone.")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else setMessage((await res.json().catch(() => null))?.error ?? "Couldn't delete.");
  }

  const closeShare = useCallback(() => setShowShare(false), []);

  const statusText: Record<SaveState, string> = {
    saved: "All changes saved",
    dirty: "Unsaved changes",
    saving: "Saving…",
    error: "Not saved",
    conflict: "Conflict",
  };

  return (
    <main className="mx-auto max-w-4xl px-4 pb-24">
      <div className="sticky top-14 z-10 -mx-4 border-b border-gray-200 bg-[var(--bg)]/95 px-4 pt-4 pb-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" className="press rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100" aria-label="Back to documents">
            ←
          </Link>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            readOnly={!editable}
            maxLength={200}
            aria-label="Document title"
            className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1 text-xl font-semibold outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-200"
          />
          <span
            aria-live="polite"
            className={`flex items-center gap-1.5 text-xs ${saveState === "error" || saveState === "conflict" ? "text-red-600" : "text-gray-500"}`}
          >
            {editable && (
              <span
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                  saveState === "saved"
                    ? "bg-green-500"
                    : saveState === "saving"
                      ? "saving-dot bg-blue-500"
                      : saveState === "dirty"
                        ? "bg-gray-400"
                        : "bg-red-500"
                }`}
              />
            )}
            {editable ? statusText[saveState] : "View only"}
          </span>
          <a
            href={`/api/documents/${id}/export`}
            className="press rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Export .md
          </a>
          {role === "owner" && (
            <>
              <button onClick={() => setShowShare(true)} className="press rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                Share
              </button>
              <button onClick={deleteDoc} className="press rounded-lg px-2 py-1.5 text-sm text-red-600 hover:bg-red-50">
                Delete
              </button>
            </>
          )}
        </div>
        {editable && editor && (
          <div className="mt-3">
            <Toolbar editor={editor} />
          </div>
        )}
      </div>

      {!editable && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You have view-only access. Ask the owner for edit access.
        </p>
      )}
      {role === "editor" && (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">Shared with you: you can edit.</p>
      )}
      {message && (
        <div role="alert" className="mt-4 flex items-center gap-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <span className="flex-1">{message}</span>
          {saveState === "conflict" && (
            <button onClick={() => location.reload()} className="press rounded-md bg-white px-2 py-1 font-medium">
              Reload
            </button>
          )}
          {saveState === "error" && (
            <button onClick={() => saveContent()} className="press rounded-md bg-white px-2 py-1 font-medium">
              Retry
            </button>
          )}
        </div>
      )}

      <article className="rise mt-6 rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm sm:px-14">
        <EditorContent editor={editor} />
      </article>

      {showShare && <SharePanel docId={id} users={props.users} currentUserId={props.currentUserId} onClose={closeShare} />}
    </main>
  );
}
