import { cookies } from "next/headers";
import { ensureSchema, sql } from "./db";

/**
 * Mocked authentication (allowed by the brief): reviewers pick one of the
 * seeded demo users and we keep their id in an httpOnly cookie. There are no
 * passwords. In a real product this would be replaced by SSO/OAuth, while the
 * access rules in access.ts stay the same.
 */
export const SESSION_COOKIE = "ajaia_uid";

export interface User {
  id: string;
  name: string;
  email: string;
  color: string;
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const uid = jar.get(SESSION_COOKIE)?.value;
  if (!uid) return null;
  await ensureSchema();
  const rows = await sql()<User[]>`SELECT id, name, email, color FROM users WHERE id = ${uid}`;
  return rows[0] ?? null;
}

export async function listUsers(): Promise<User[]> {
  await ensureSchema();
  return sql()<User[]>`SELECT id, name, email, color FROM users ORDER BY name`;
}
