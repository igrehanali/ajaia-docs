import { NextResponse } from "next/server";
import { z } from "zod";
import { canShare, validateShare } from "@/lib/access";
import { sql } from "@/lib/db";
import { getDocumentForUser, listShares } from "@/lib/documents";
import { jsonError, withUser } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withUser(async (user, _req: Request, { params }: Ctx) => {
  const { id } = await params;
  const found = await getDocumentForUser(id, user.id);
  if (!found) return jsonError(404, "Document not found or you don't have access.");
  if (!canShare(found.role)) return jsonError(403, "Only the owner can manage sharing.");
  return NextResponse.json({ shares: await listShares(id) });
});

const shareSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.enum(["viewer", "editor"]),
});

/** Grant (or change) access for a user, identified by email. */
export const POST = withUser(async (user, req: Request, { params }: Ctx) => {
  const { id } = await params;
  const parsed = shareSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0].message);

  const found = await getDocumentForUser(id, user.id);
  if (!found) return jsonError(404, "Document not found or you don't have access.");

  const db = sql();
  const targets = await db<{ id: string }[]>`SELECT id FROM users WHERE lower(email) = ${parsed.data.email}`;
  const check = validateShare({
    actorRole: found.role,
    ownerId: found.doc.owner_id,
    targetUserId: targets[0]?.id ?? null,
  });
  if (!check.ok) return jsonError(check.status, check.error);

  await db`
    INSERT INTO document_shares (document_id, user_id, role)
    VALUES (${id}, ${targets[0].id}, ${parsed.data.role})
    ON CONFLICT (document_id, user_id) DO UPDATE SET role = EXCLUDED.role`;
  return NextResponse.json({ shares: await listShares(id) }, { status: 201 });
});

const revokeSchema = z.object({ userId: z.string().min(1) });

export const DELETE = withUser(async (user, req: Request, { params }: Ctx) => {
  const { id } = await params;
  const parsed = revokeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Missing user to remove.");
  const found = await getDocumentForUser(id, user.id);
  if (!found) return jsonError(404, "Document not found or you don't have access.");
  if (!canShare(found.role)) return jsonError(403, "Only the owner can manage sharing.");
  await sql()`DELETE FROM document_shares WHERE document_id = ${id} AND user_id = ${parsed.data.userId}`;
  return NextResponse.json({ shares: await listShares(id) });
});
