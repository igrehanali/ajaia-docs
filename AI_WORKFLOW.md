# AI workflow note

## Tools

- **Claude Code** (Anthropic, Claude Opus model) was my main coding agent. It worked in the repo, ran commands and tests, drove a browser to click through the app, and deployed to Vercel. I directed the scope, reviewed the plan and the code, and made the product calls.

## Where AI sped things up

- **Scoping:** turned the brief into a prioritized plan in minutes (core flows first, a single stretch item, explicit cuts).
- **Boilerplate:** API routes, zod schemas, the TipTap toolbar and the sharing dialog were generated quickly, so time went into rules and edge cases.
- **Tests:** drafting the unit tests for access rules and file conversion.
- **Environment problems:** worked around a blocked native binary (see below) and the missing Docker, and kept going.

## What I changed or rejected

- **SQLite → Postgres.** The first idea was SQLite. I rejected it because a file database doesn't persist on serverless hosting, so a reviewer's data would disappear.
- **Stale-closure autosave bug.** The first version of the editor called a save function captured on the first render, before the editor existed, so saves would silently do nothing. It was caught in review before running and fixed with a ref to the latest save function.
- **Real-time co-editing (Yjs) rejected for the timebox.** Replaced with debounced autosave plus a 409 conflict check, which is honest about the limitation instead of overwriting work.
- **Extra dependency rejected.** I skipped the `turndown` library for export and used a small HTML→Markdown converter for the editor's limited tag set, covered by a test.
- **Tooling fixes:** Windows Application Control blocked Rollup's native binary, so vitest failed to start. I overrode it to `@rollup/wasm-node`. Docker wasn't running, so local development uses PGlite (Postgres in WebAssembly) behind a tiny script. The package's own CLI failed on Windows, so I wrote the script myself.

- **Security catch at deploy time:** the scaffold pinned Next.js 15.5.4, and Vercel refused to build it because of a known vulnerability (CVE-2025-66478). I upgraded to the patched 15.5.29, then re-ran the build and tests before redeploying.

## How correctness was verified

- **Unit tests (13, vitest):** role resolution for owner, editor, viewer and stranger; share validation; text, Markdown and HTML import; script/`onclick` stripping; unsupported, empty and oversized files; Markdown export.
- **Type-check, lint and production build** all pass (`tsc`, `next build`).
- **Browser run-through** of the real app: sign in, open a document, format text, autosave, reload, and check formatting persisted.
- **API scenario script** run against the running app, with these results:
  - Owner shares → 201.
  - Unknown email → 404. Sharing with yourself → 400.
  - Viewer edits → 403. Viewer shares → 403.
  - Editor edits → 200. Editor deletes → 403.
  - Stale save → 409. Empty title → 400. Bad id → 404.
  - Upload .md and .txt → 201. Upload .png → 415. Export → a .md file.
- **.docx import** checked against a real Word file.
- **UX:**
  - Every action shows a busy state and a readable error.
  - Save status is announced in an `aria-live` region.
  - The toolbar uses `aria-pressed`.
  - Button press feedback respects `prefers-reduced-motion`.
