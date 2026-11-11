/**
 * Access rules, kept as pure functions so they are easy to test and reuse
 * in every API route.
 *
 * owner  – view, edit, rename, share, delete
 * editor – view, edit, rename
 * viewer – view only
 */
export type Role = "owner" | "editor" | "viewer";
export type ShareRole = Exclude<Role, "owner">;

export interface ShareRecord {
  userId: string;
  role: ShareRole;
}

export function resolveRole(
  ownerId: string,
  shares: ShareRecord[],
  userId: string | null | undefined,
): Role | null {
  if (!userId) return null;
  if (ownerId === userId) return "owner";
  const share = shares.find((s) => s.userId === userId);
  return share ? share.role : null;
}

export const canView = (role: Role | null) => role !== null;
export const canEdit = (role: Role | null) => role === "owner" || role === "editor";
export const canRename = canEdit;
export const canShare = (role: Role | null) => role === "owner";
export const canDelete = (role: Role | null) => role === "owner";

export type ShareCheck =
  | { ok: true }
  | { ok: false; status: number; error: string };

/** Validates a share request before it touches the database. */
export function validateShare(params: {
  actorRole: Role | null;
  ownerId: string;
  targetUserId: string | null;
}): ShareCheck {
  if (!canShare(params.actorRole)) {
    return { ok: false, status: 403, error: "Only the owner can share this document." };
  }
  if (!params.targetUserId) {
    return { ok: false, status: 404, error: "No user with that email. Try one of the demo users." };
  }
  if (params.targetUserId === params.ownerId) {
    return { ok: false, status: 400, error: "You already own this document." };
  }
  return { ok: true };
}
