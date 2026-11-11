import { getCurrentUser, listUsers } from "@/lib/auth";
import { listDocumentsFor } from "@/lib/documents";
import SignIn from "@/components/SignIn";
import Dashboard from "@/components/Dashboard";
import TopBar from "@/components/TopBar";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const users = await listUsers();
  if (!user) return <SignIn users={users} />;

  const { owned, shared } = await listDocumentsFor(user.id);
  const iso = <T extends { updatedAt: string | Date }>(d: T) => ({
    ...d,
    updatedAt: new Date(d.updatedAt).toISOString(),
  });
  return (
    <>
      <TopBar user={user} users={users} />
      <Dashboard owned={owned.map(iso)} shared={shared.map(iso)} />
    </>
  );
}
