import { z } from "zod";
import { ensureSchema, sql } from "./db";
import { resolveRole, type Role, type ShareRecord, type ShareRole } from "./access";

export interface DocumentRow {
  id: string;
  owner_id: string;
  title: string;
  content_html: string;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentSummary {
  id: string;
  title: string;
  updatedAt: string;
  ownerName: string;
  role: Role;
}

export interface ShareInfo {
  userId: string;
  name: string;
  email: string;
  role: ShareRole;
}

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Title can't be empty.")
  .max(200, "Title must be 200 characters or fewer.");

export const MAX_CONTENT_CHARS = 500_000;

export async function listDocumentsFor(userId: string) {
  await ensureSchema();
  const db = sql();
  const owned = await db<DocumentSummary[]>`
    SELECT d.id, d.title, d.updated_at AS "updatedAt", u.name AS "ownerName", 'owner' AS role
    FROM documents d JOIN users u ON u.id = d.owner_id
    WHERE d.owner_id = ${userId}
    ORDER BY d.updated_at DESC`;
  const shared = await db<DocumentSummary[]>`
    SELECT d.id, d.title, d.updated_at AS "updatedAt", u.name AS "ownerName", s.role
    FROM document_shares s
    JOIN documents d ON d.id = s.document_id
    JOIN users u ON u.id = d.owner_id
    WHERE s.user_id = ${userId}
    ORDER BY d.updated_at DESC`;
  return { owned, shared };
}

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Loads a document plus the caller's role. Returns null when missing or not visible to the user. */
export async function getDocumentForUser(id: string, userId: string) {
  if (!uuidRe.test(id)) return null;
  await ensureSchema();
  const db = sql();
  const docs = await db<DocumentRow[]>`SELECT * FROM documents WHERE id = ${id}`;
  const doc = docs[0];
  if (!doc) return null;
  const shares = await db<ShareRecord[]>`
    SELECT user_id AS "userId", role FROM document_shares WHERE document_id = ${id}`;
  const role = resolveRole(doc.owner_id, shares, userId);
  if (!role) return null;
  return { doc, role };
}

export async function listShares(documentId: string) {
  return sql()<ShareInfo[]>`
    SELECT s.user_id AS "userId", u.name, u.email, s.role
    FROM document_shares s JOIN users u ON u.id = s.user_id
    WHERE s.document_id = ${documentId}
    ORDER BY u.name`;
}

export async function createDocument(ownerId: string, title: string, contentHtml = "") {
  await ensureSchema();
  const rows = await sql()<DocumentRow[]>`
    INSERT INTO documents (owner_id, title, content_html)
    VALUES (${ownerId}, ${title}, ${contentHtml})
    RETURNING *`;
  return rows[0];
}
