import { NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import { jsonError } from "@/lib/http";

const bodySchema = z.object({ userId: z.string().min(1) });

/** Sign in as a seeded demo user (mocked auth). */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Pick a user to continue.");
  await ensureSchema();
  const rows = await sql()`SELECT id FROM users WHERE id = ${parsed.data.userId}`;
  if (!rows.length) return jsonError(404, "Unknown user.");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, parsed.data.userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
