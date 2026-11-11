import { notFound, redirect } from "next/navigation";
import { getCurrentUser, listUsers } from "@/lib/auth";
import { getDocumentForUser } from "@/lib/documents";
import TopBar from "@/components/TopBar";
import DocEditor from "@/components/DocEditor";

export const dynamic = "force-dynamic";

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const { id } = await params;
  const found = await getDocumentForUser(id, user.id);
  if (!found) notFound();

  const users = await listUsers();
  return (
    <>
      <TopBar user={user} users={users} />
      <DocEditor
        id={found.doc.id}
        initialTitle={found.doc.title}
        initialHtml={found.doc.content_html}
        initialUpdatedAt={new Date(found.doc.updated_at).toISOString()}
        role={found.role}
        users={users}
        currentUserId={user.id}
      />
    </>
  );
}
