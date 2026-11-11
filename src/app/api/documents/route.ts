import { NextResponse } from "next/server";
import { z } from "zod";
import { createDocument, listDocumentsFor, titleSchema } from "@/lib/documents";
import { jsonError, withUser } from "@/lib/http";

export const GET = withUser(async (user) => {
  return NextResponse.json(await listDocumentsFor(user.id));
});

const createSchema = z.object({ title: titleSchema.optional() });

export const POST = withUser(async (user, req: Request) => {
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0].message);
  const doc = await createDocument(user.id, parsed.data.title ?? "Untitled document");
  return NextResponse.json({ id: doc.id }, { status: 201 });
});
