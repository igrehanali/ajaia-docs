import { NextResponse } from "next/server";
import { fileToHtml, ImportError, titleFromFileName } from "@/lib/convert";
import { createDocument } from "@/lib/documents";
import { jsonError, withUser } from "@/lib/http";

/** Upload a .txt / .md / .docx file and turn it into a new editable document. */
export const POST = withUser(async (user, req: Request) => {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError(400, "Choose a file to upload.");
  try {
    const html = await fileToHtml(file.name, await file.arrayBuffer());
    const doc = await createDocument(user.id, titleFromFileName(file.name), html);
    return NextResponse.json({ id: doc.id }, { status: 201 });
  } catch (err) {
    if (err instanceof ImportError) return jsonError(err.status, err.message);
    console.error(err);
    return jsonError(422, "We couldn't read that file. Is it a valid .txt, .md or .docx?");
  }
});
