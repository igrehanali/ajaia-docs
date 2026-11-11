# Submission – Full Stack Product Engineer (Ajaia)

Candidate: Muhammad Rehan Ali

## Links

- **Live app:** https://ajaia-docs-six-phi.vercel.app
- **Walkthrough video (Loom):** https://www.loom.com/share/9e5ae02357504fafb0680fb011c48a31
- **Source code (GitHub):** https://github.com/igrehanali/ajaia-docs
- **Google Drive folder:** https://drive.google.com/drive/folders/1WH8FeQAmWwVW82Es_sQvLa3aZ7d-iVA8

## Test accounts

No passwords: pick a user on the sign-in screen and switch from the top bar.

- sophia@ajaia.test – owns "Welcome to Ajaia Docs"
- liam@ajaia.test – can edit Sophia's welcome doc
- maya@ajaia.test – nothing shared yet; share something with her to test view-only

## Suggested 2-minute review path

1. Sign in as **Sophia** → open "Welcome to Ajaia Docs" → format some text, then reload (it persists).
2. **Share** → pick **Maya Patel** from the people dropdown → **View only**.
3. Switch to **Maya** → "Shared with me" → open it (read-only, banner shown).
4. Switch to **Liam** → edit the same doc (editor access).
5. Dashboard → **Upload file** → a .md, .txt or .docx becomes a new document. Try a .png to see the rejection message.
6. **Export .md** from any document.

## What's included

| File | What |
|---|---|
| `src/` | Source code (Next.js app, API routes, editor, access rules) |
| `src/lib/__tests__/` | Automated tests (vitest, 13 tests) |
| `README.md` | Setup, run, test and deploy instructions |
| `ARCHITECTURE.md` | Architecture note: priorities, trade-offs, next steps |
| `AI_WORKFLOW.md` | AI workflow note |
| `SUBMISSION.md` | This file |
| `VIDEO_URL.txt` | Walkthrough video link |
| `.env.example` | Environment variable template |
| `scripts/local-db.mjs` | Docker-free local Postgres for development |

## Status

**Working end to end:**
- Create, rename, edit, autosave, reopen and delete documents
- Rich text: bold, italic, underline, H1–H3, bulleted and numbered lists, quote, undo/redo
- .txt/.md/.docx import
- Owner/editor/viewer sharing, with "My documents" vs "Shared with me"
- Postgres persistence, validation and error handling
- Conflict detection
- Markdown export

**Incomplete or intentionally cut:**
- Real-time co-editing and presence
- Comments and version history
- Real auth
- Tables and images in the editor

**Next 2–4 hours:**
- Version history with restore
- Presence indicator
- Playwright end-to-end test of the sharing flow
- Versioned migrations
