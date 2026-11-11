import postgres from "postgres";

/**
 * Single shared Postgres client.
 * Works with any Postgres (Neon in production, local Postgres/Docker in dev).
 * `prepare: false` keeps it compatible with pooled/serverless connection strings.
 */
declare global {
  var __sql: ReturnType<typeof postgres> | undefined;
  var __schemaReady: Promise<void> | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and point it at a Postgres database.",
    );
  }
  const isLocal = /localhost|127\.0\.0\.1/.test(url);
  return postgres(url, {
    ssl: isLocal ? false : "require",
    max: 5,
    idle_timeout: 20,
    prepare: false,
  });
}

export function sql() {
  if (!globalThis.__sql) globalThis.__sql = createClient();
  return globalThis.__sql;
}

export const SEED_USERS = [
  { id: "u_alice", name: "Alice Khan", email: "alice@ajaia.test", color: "#2563eb" },
  { id: "u_bob", name: "Bob Smith", email: "bob@ajaia.test", color: "#16a34a" },
  { id: "u_carol", name: "Carol Diaz", email: "carol@ajaia.test", color: "#db2777" },
] as const;

const WELCOME_DOC_ID = "00000000-0000-4000-8000-000000000001";

const WELCOME_HTML = `<h1>Welcome to Ajaia Docs</h1>
<p>This document is owned by <strong>Alice</strong> and shared with <strong>Bob</strong> as an <em>editor</em>.</p>
<h2>Try this</h2>
<ul><li>Format text with <strong>bold</strong>, <em>italic</em> and <u>underline</u></li><li>Add headings and lists from the toolbar</li><li>Share the document with Carol from the Share button</li></ul>
<ol><li>Switch user (top right)</li><li>Open “Shared with me”</li><li>See the edit or view-only experience</li></ol>`;

/** Creates tables and seed data once per server process. Idempotent. */
export function ensureSchema(): Promise<void> {
  if (!globalThis.__schemaReady) {
    globalThis.__schemaReady = (async () => {
      const db = sql();
      await db`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          color TEXT NOT NULL
        )`;
      await db`
        CREATE TABLE IF NOT EXISTS documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_id TEXT NOT NULL REFERENCES users(id),
          title TEXT NOT NULL,
          content_html TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
      await db`
        CREATE TABLE IF NOT EXISTS document_shares (
          document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id),
          role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (document_id, user_id)
        )`;
      await db`CREATE INDEX IF NOT EXISTS documents_owner_idx ON documents(owner_id)`;
      await db`CREATE INDEX IF NOT EXISTS shares_user_idx ON document_shares(user_id)`;

      for (const u of SEED_USERS) {
        await db`
          INSERT INTO users (id, name, email, color)
          VALUES (${u.id}, ${u.name}, ${u.email}, ${u.color})
          ON CONFLICT (id) DO NOTHING`;
      }
      await db`
        INSERT INTO documents (id, owner_id, title, content_html)
        VALUES (${WELCOME_DOC_ID}, 'u_alice', 'Welcome to Ajaia Docs', ${WELCOME_HTML})
        ON CONFLICT (id) DO NOTHING`;
      await db`
        INSERT INTO document_shares (document_id, user_id, role)
        VALUES (${WELCOME_DOC_ID}, 'u_bob', 'editor')
        ON CONFLICT DO NOTHING`;
    })().catch((err) => {
      globalThis.__schemaReady = undefined; // allow retry on next request
      throw err;
    });
  }
  return globalThis.__schemaReady;
}
