/**
 * Auth guard helpers for API route handlers.
 * Call these at the top of every handler — they throw ApiError on failure.
 */

import { getServerSession, Session } from "next-auth";
import { authOptions } from "./auth";
import { ApiError } from "./errors";

// Narrowed session type for admin handlers
export type AdminSession = Session & {
  user: Session["user"] & { role: "ADMIN" };
};

// Narrowed session type for client handlers
export type ClientSession = Session & {
  user: Session["user"] & { role: "CLIENT"; clientId: string };
};

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getServerSession(authOptions);
  if (!session) throw new ApiError(401, "Unauthorized");
  if (session.user.role !== "ADMIN") throw new ApiError(403, "Forbidden");
  return session as AdminSession;
}

export async function requireClient(): Promise<ClientSession> {
  const session = await getServerSession(authOptions);
  if (!session) throw new ApiError(401, "Unauthorized");
  if (session.user.role !== "CLIENT") throw new ApiError(403, "Forbidden");
  if (!session.user.clientId) throw new ApiError(403, "Client profile not found");
  return session as ClientSession;
}

export async function requireAuth(): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session) throw new ApiError(401, "Unauthorized");
  return session;
}
