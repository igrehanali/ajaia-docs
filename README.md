# Ajaia Docs

A lightweight collaborative document editor: create, edit (rich text), import files, and share documents between users.

**Live app:** https://ajaia-docs-six-phi.vercel.app  
**Source:** https://github.com/igrehanali/ajaia-docs  
**Demo users** (no password, pick one on the sign-in screen, switch any time from the top bar):

| User | Email | Seed data |
|---|---|---|
| Alice Khan | alice@ajaia.test | Owns "Welcome to Ajaia Docs" |
| Bob Smith | bob@ajaia.test | Has **edit** access to the welcome doc |
| Carol Diaz | carol@ajaia.test | Nothing shared yet – use her to test sharing |

## What works

- **Documents:** create, rename (click the title), edit in the browser, autosave (~0.8 s after you stop typing), reopen, delete (owner).
- **Formatting:** bold, italic, underline, H1/H2/H3, bulleted and numbered lists, quotes, undo/redo, keyboard shortcuts.
- **File upload:** upload a **.txt, .md or .docx** file (max 2 MB) from the dashboard → it becomes a new editable document. Other file types are rejected with a clear message.
- **Sharing:** the owner shares by email as **Can edit** or **View only**, can change or remove access. The dashboard separates **My documents** and **Shared with me**; viewers get a read-only editor.
- **Persistence:** Postgres. Content is stored as sanitized HTML, so formatting survives refresh.
- **Safety nets:** server-side validation (zod), HTML sanitizing on every save and import, access checks on every API route, and a conflict check (HTTP 409 + "Reload") if someone else saved the document since you opened it.
- **Stretch:** export any document as Markdown.

## Run locally

Requirements: Node 20+ and a Postgres database.

```bash
npm install
cp .env.example .env.local   # then set DATABASE_URL
npm run dev                  # http://localhost:3000
```

**No Postgres handy?** Run a throwaway in-memory Postgres (PGlite, no Docker) in a second terminal:

```bash
npm run db:local             # listens on localhost:5433
```

and use this `.env.local`:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5433/postgres
PG_MAX=1
```

Tables and demo users are created automatically on the first request (idempotent).

## Tests and checks

```bash
npm test          # vitest: access rules, file import/sanitizing, Markdown export (13 tests)
npm run typecheck
npm run lint
npm run build
```

## Deploy

Deployed on Vercel with a Neon Postgres database (free tiers). The only required environment variable is `DATABASE_URL`.

## Docs

- [ARCHITECTURE.md](ARCHITECTURE.md) – what I prioritized and why
- [AI_WORKFLOW.md](AI_WORKFLOW.md) – how AI tools were used and checked
- [SUBMISSION.md](SUBMISSION.md) – what's included
