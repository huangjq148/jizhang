import { prisma } from "../../../../lib/prisma.mjs";
import { createSession } from "../../../../lib/auth.mjs";

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const cleanUsername = typeof username === "string" ? username.trim() : "";
    const user = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (!user || user.password !== password) return Response.json({ message: "用户名或密码错误" }, { status: 401 });
    await createSession(user.id);
    return Response.json({ user: { id: user.id, username: user.username } });
  } catch {
    return Response.json({ message: "登录失败，请稍后重试" }, { status: 500 });
  }
}
