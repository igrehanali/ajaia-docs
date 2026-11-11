import { describe, expect, it } from "vitest";
import { canDelete, canEdit, canShare, canView, resolveRole, validateShare } from "../access";

const shares = [
  { userId: "u_bob", role: "editor" as const },
  { userId: "u_carol", role: "viewer" as const },
];

describe("resolveRole", () => {
  it("gives the owner full control", () => {
    const role = resolveRole("u_alice", shares, "u_alice");
    expect(role).toBe("owner");
    expect([canView(role), canEdit(role), canShare(role), canDelete(role)]).toEqual([true, true, true, true]);
  });

  it("lets an editor edit but not share or delete", () => {
    const role = resolveRole("u_alice", shares, "u_bob");
    expect(role).toBe("editor");
    expect([canView(role), canEdit(role), canShare(role), canDelete(role)]).toEqual([true, true, false, false]);
  });

  it("keeps a viewer read-only", () => {
    const role = resolveRole("u_alice", shares, "u_carol");
    expect(role).toBe("viewer");
    expect([canView(role), canEdit(role), canShare(role)]).toEqual([true, false, false]);
  });

  it("denies everything to users without a share or session", () => {
    expect(resolveRole("u_alice", shares, "u_dave")).toBeNull();
    expect(resolveRole("u_alice", shares, null)).toBeNull();
    expect(canView(null)).toBe(false);
  });
});

describe("validateShare", () => {
  it("only lets the owner share", () => {
    const r = validateShare({ actorRole: "editor", ownerId: "u_alice", targetUserId: "u_carol" });
    expect(r).toMatchObject({ ok: false, status: 403 });
  });

  it("rejects unknown emails and sharing with yourself", () => {
    expect(validateShare({ actorRole: "owner", ownerId: "u_alice", targetUserId: null })).toMatchObject({ status: 404 });
    expect(validateShare({ actorRole: "owner", ownerId: "u_alice", targetUserId: "u_alice" })).toMatchObject({ status: 400 });
  });

  it("accepts a valid share", () => {
    expect(validateShare({ actorRole: "owner", ownerId: "u_alice", targetUserId: "u_bob" })).toEqual({ ok: true });
  });
});
