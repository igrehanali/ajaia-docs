import { NextResponse } from "next/server";
import { z } from "zod";
import { canDelete, canEdit } from "@/lib/access";
import { sql } from "@/lib/db";
import { getDocumentForUser, MAX_CONTENT_CHARS, titleSchema } from "@/lib/documents";
import { jsonError, withUser } from "@/lib/http";
import { sanitizeDocHtml } from "@/lib/sanitize";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withUser(async (user, _req: Request, { params }: Ctx) => {
  const { id } = await params;
  const found = await getDocumentForUser(id, user.id);
  if (!found) return jsonError(404, "Document not found or you don't have access.");
  const { doc, role } = found;
  return NextResponse.json({
    id: doc.id,
    title: doc.title,
    contentHtml: doc.content_html,
    updatedAt: doc.updated_at,
    role,
  });
});

const patchSchema = z
  .object({
    title: titleSchema.optional(),
    contentHtml: z.string().max(MAX_CONTENT_CHARS, "Document is too large to save.").optional(),
    /** updated_at the client last saw; used to detect overwriting someone else's save. */
    baseUpdatedAt: z.string().optional(),
  })
  .refine((v) => v.title !== undefined || v.contentHtml !== undefined, {
    message: "Nothing to update.",
  });

export const PATCH = withUser(async (user, req: Request, { params }: Ctx) => {
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0].message);

  const found = await getDocumentForUser(id, user.id);
  if (!found) return jsonError(404, "Document not found or you don't have access.");
  if (!canEdit(found.role)) return jsonError(403, "You have view-only access to this document.");

  const { title, contentHtml, baseUpdatedAt } = parsed.data;
  if (
    contentHtml !== undefined &&
    baseUpdatedAt &&
    new Date(baseUpdatedAt).getTime() !== new Date(found.doc.updated_at).getTime()
  ) {
    return jsonError(409, "This document was changed by someone else. Reload to get the latest version.");
  }

  const nextTitle = title ?? found.doc.title;
  const nextHtml = contentHtml !== undefined ? sanitizeDocHtml(contentHtml) : found.doc.content_html;
  const rows = await sql()<{ updated_at: Date }[]>`
    UPDATE documents
    SET title = ${nextTitle}, content_html = ${nextHtml}, updated_at = now()
    WHERE id = ${id}
    RETURNING updated_at`;
  return NextResponse.json({ ok: true, title: nextTitle, updatedAt: rows[0].updated_at });
});

export const DELETE = withUser(async (user, _req: Request, { params }: Ctx) => {
  const { id } = await params;
  const found = await getDocumentForUser(id, user.id);
  if (!found) return jsonError(404, "Document not found or you don't have access.");
  if (!canDelete(found.role)) return jsonError(403, "Only the owner can delete this document.");
  await sql()`DELETE FROM documents WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
});
