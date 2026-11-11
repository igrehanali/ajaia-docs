"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { User } from "@/lib/auth";
import Avatar from "./Avatar";

/**
 * Dropdown of people you can share with. Keyboard: ↑/↓ to move, Enter to pick, Esc to close.
 * The menu grows out of the trigger (transform-origin: top) instead of appearing from nowhere.
 */
export default function UserPicker(props: {
  options: User[];
  value: User | null;
  onChange: (u: User) => void;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}) {
  const { options, value, onChange, onOpenChange, disabled } = props;
  const [open, setOpenState] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  function setOpen(next: boolean) {
    setOpenState(next);
    onOpenChange?.(next);
    if (next) setActive(Math.max(0, options.findIndex((o) => o.id === value?.id)));
  }

  // Close when pressing anywhere outside the picker.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        setOpenState(false);
        onOpenChange?.(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, onOpenChange]);

  function pick(u: User) {
    onChange(u);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (options[active]) pick(options[active]);
    } else if (e.key === "Escape") {
      // Keep this Escape from reaching the dialog, so only the menu closes.
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  const empty = options.length === 0;

  return (
    <div ref={root} className="relative min-w-0 flex-1">
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && options[active] ? `${listId}-${options[active].id}` : undefined}
        aria-label="Person to share with"
        disabled={disabled || empty}
        onClick={() => setOpen(!open)}
        onKeyDown={onKeyDown}
        className={`press flex h-9 w-full items-center gap-2 rounded-lg border bg-white px-2.5 text-left text-sm disabled:opacity-60 ${
          open ? "border-blue-400 shadow-[0_0_0_3px_rgb(37_99_235/0.15)]" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        {value ? (
          <>
            <Avatar user={value} size={22} />
            <span className="min-w-0 flex-1 truncate font-medium">{value.name}</span>
          </>
        ) : (
          <span className="flex-1 truncate text-gray-400">{empty ? "Everyone already has access" : "Choose a person…"}</span>
        )}
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className={`chevron h-4 w-4 shrink-0 text-gray-400 ${open ? "rotate-180" : ""}`}
        >
          <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="People"
          className="menu absolute left-0 right-0 top-full z-10 mt-1.5 max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white/95 p-1 shadow-xl ring-1 ring-black/5 backdrop-blur"
        >
          {options.map((u, i) => {
            const selected = u.id === value?.id;
            return (
              <li
                key={u.id}
                id={`${listId}-${u.id}`}
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActive(i)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => pick(u)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-100 ${
                  i === active ? "bg-gray-100" : ""
                }`}
              >
                <Avatar user={u} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{u.name}</span>
                  <span className="block truncate text-xs text-gray-500">{u.email}</span>
                </span>
                {selected && (
                  <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 text-blue-600">
                    <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
