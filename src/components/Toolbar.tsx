"use client";

import type { Editor } from "@tiptap/react";

interface Btn {
  label: string;
  title: string;
  run: (e: Editor) => void;
  active?: (e: Editor) => boolean;
  className?: string;
}

const groups: Btn[][] = [
  [
    { label: "B", title: "Bold (Ctrl+B)", run: (e) => e.chain().focus().toggleBold().run(), active: (e) => e.isActive("bold"), className: "font-bold" },
    { label: "I", title: "Italic (Ctrl+I)", run: (e) => e.chain().focus().toggleItalic().run(), active: (e) => e.isActive("italic"), className: "italic" },
    { label: "U", title: "Underline (Ctrl+U)", run: (e) => e.chain().focus().toggleUnderline().run(), active: (e) => e.isActive("underline"), className: "underline" },
  ],
  [
    { label: "H1", title: "Heading 1", run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(), active: (e) => e.isActive("heading", { level: 1 }) },
    { label: "H2", title: "Heading 2", run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), active: (e) => e.isActive("heading", { level: 2 }) },
    { label: "H3", title: "Heading 3", run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), active: (e) => e.isActive("heading", { level: 3 }) },
    { label: "¶", title: "Normal text", run: (e) => e.chain().focus().setParagraph().run(), active: (e) => e.isActive("paragraph") },
  ],
  [
    { label: "• List", title: "Bulleted list", run: (e) => e.chain().focus().toggleBulletList().run(), active: (e) => e.isActive("bulletList") },
    { label: "1. List", title: "Numbered list", run: (e) => e.chain().focus().toggleOrderedList().run(), active: (e) => e.isActive("orderedList") },
    { label: "❝", title: "Quote", run: (e) => e.chain().focus().toggleBlockquote().run(), active: (e) => e.isActive("blockquote") },
  ],
  [
    { label: "↶", title: "Undo (Ctrl+Z)", run: (e) => e.chain().focus().undo().run() },
    { label: "↷", title: "Redo (Ctrl+Shift+Z)", run: (e) => e.chain().focus().redo().run() },
  ],
];

export default function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-1">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5 border-r border-gray-200 pr-1 last:border-r-0">
          {group.map((b) => {
            const on = b.active?.(editor) ?? false;
            return (
              <button
                key={b.title}
                type="button"
                title={b.title}
                aria-label={b.title}
                aria-pressed={b.active ? on : undefined}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => b.run(editor)}
                className={`press min-w-8 rounded-md px-2 py-1 text-sm ${b.className ?? ""} ${
                  on ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
