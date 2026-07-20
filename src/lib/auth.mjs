import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { prisma } from "./prisma.mjs";

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "jizhang_session";
const SESSION_DAYS = 7;

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  return session.user;
}

export async function createSession(userId) {
  const token = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) await prisma.session.deleteMany({ where: { token } });
  cookieStore.set(SESSION_COOKIE_NAME, "", { httpOnly: true, expires: new Date(0), path: "/" });
}

export function unauthorized() {
  return Response.json({ message: "请先登录" }, { status: 401 });
}
