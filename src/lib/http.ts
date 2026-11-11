import { NextResponse } from "next/server";
import { getCurrentUser, type User } from "./auth";

export function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/** Wraps a route handler with auth + consistent error handling. */
export function withUser<A extends unknown[]>(
  handler: (user: User, ...args: A) => Promise<Response>,
) {
  return async (...args: A): Promise<Response> => {
    try {
      const user = await getCurrentUser();
      if (!user) return jsonError(401, "Please choose a demo user to sign in.");
      return await handler(user, ...args);
    } catch (err) {
      console.error(err);
      return jsonError(500, "Something went wrong on our side. Please try again.");
    }
  };
}
