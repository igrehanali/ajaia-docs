# Architecture note

## Stack

| Layer | Choice | Why |
|---|---|---|
| App | Next.js 15 (App Router), TypeScript | One deployable unit for UI and API, server-rendered pages, easy Vercel deploy |
| Editor | TipTap 2 (ProseMirror) + StarterKit + Underline | Mature, schema-based rich text; gives bold/italic/underline/headings/lists out of the box |
| Storage | Postgres via `postgres` (postgres.js) | Relational data (users, documents, shares) with real constraints; works on Neon serverless |
| Validation | zod on every API input | One place for limits and clear error messages |
| Tests | vitest | Fast unit tests for the logic that matters most |

## Data model

```
users(id, name, email UNIQUE, color)
documents(id UUID, owner_id → users, title, content_html, created_at, updated_at)
document_shares(document_id → documents ON DELETE CASCADE, user_id → users,
                role ∈ {viewer, editor}, PRIMARY KEY(document_id, user_id))
```

Schema and seed data are created idempotently on first request (`ensureSchema`). For a project this size that avoids a migration tool; in production I would switch to versioned migrations.

## Key decisions

1. **Content stored as sanitized HTML, not ProseMirror JSON.** HTML is the common format for all three surfaces: the editor (`getHTML`), file import (Markdown and .docx both convert to HTML) and export. Every write goes through an allow-list sanitizer (`sanitize-html`), so stored content can't carry scripts. Trade-off: JSON would make future features like comments anchored to nodes easier.
2. **Access rules as pure functions** (`src/lib/access.ts`): `resolveRole` → owner / editor / viewer / none, plus `canEdit`, `canShare` and so on. Every API route uses them, and they are unit-tested. Documents a user can't see return **404, not 403**, so the API doesn't leak which IDs exist.
3. **Mocked auth** (allowed by the brief): pick a seeded user and their id goes in an httpOnly cookie. This keeps the review flow to one click, and the access layer doesn't care where the user id comes from. Swapping in real auth (NextAuth/Clerk) would only change `getCurrentUser()`.
4. **Autosave with optimistic concurrency instead of real-time sync.** Saves are debounced (800 ms) and serialized. Each save sends the `updated_at` the client last saw. If someone else saved in between, the server returns **409** and the UI offers "Reload" rather than silently overwriting their work. Real-time co-editing (Yjs/CRDT plus a websocket server) was the biggest scope cut: it's a project of its own and doesn't fit serverless hosting without extra infrastructure.
5. **File upload = import to a new document** (.txt, .md, .docx up to 2 MB): `marked` for Markdown, `mammoth` for Word, escaped paragraphs for text. This is the most product-relevant upload behaviour for a docs tool, and conversion is fully server-side and tested.
6. **Sharing by email with two roles.** Owners can add, change or remove access. Only owners share or delete; editors can edit and rename; viewers get a read-only editor and a banner.

## Deliberately deprioritized

- Real-time collaboration, presence and cursors (see decision 4)
- Comments, suggestion mode and version history
- Attachments stored alongside documents (I chose import instead)
- Tables, images and links toolbar (the sanitizer keeps links from imports; tables from .docx are flattened)
- Real authentication, invitations for non-existent users, and email notifications
- Pagination and search on the dashboard

## Next 2–4 hours

1. Version history: a `document_versions` table written on save (throttled), plus a restore button.
2. Presence: show who else has the document open (polling or a light websocket service).
3. Playwright end-to-end test for the share → switch user → view-only flow.
4. Versioned migrations and rate limiting on import.
