import { htmlToMarkdown } from "@/lib/markdown";
import { getDocumentForUser } from "@/lib/documents";
import { jsonError, withUser } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

/** Stretch: export a document as Markdown. */
export const GET = withUser(async (user, _req: Request, { params }: Ctx) => {
  const { id } = await params;
  const found = await getDocumentForUser(id, user.id);
  if (!found) return jsonError(404, "Document not found or you don't have access.");
  const md = `# ${found.doc.title}\n\n${htmlToMarkdown(found.doc.content_html)}`;
  const safeName = found.doc.title.replace(/[^\w\- ]+/g, "").trim() || "document";
  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}.md"`,
    },
  });
});
