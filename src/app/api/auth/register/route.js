import { prisma } from "../../../../lib/prisma.mjs";
import { createSession } from "../../../../lib/auth.mjs";

export async function POST(request) {
  try {
    const { username, password, confirmPassword } = await request.json();
    const cleanUsername = typeof username === "string" ? username.trim() : "";
    if (!cleanUsername || cleanUsername.length > 32) return Response.json({ message: "请输入 1-32 位用户名" }, { status: 400 });
    if (typeof password !== "string" || password.length < 6 || password.length > 64) return Response.json({ message: "密码长度需为 6-64 位" }, { status: 400 });
    if (password !== confirmPassword) return Response.json({ message: "两次输入的密码不一致" }, { status: 400 });
    const exists = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (exists) return Response.json({ message: "用户名已存在" }, { status: 409 });
    const user = await prisma.user.create({ data: { username: cleanUsername, password } });
    await createSession(user.id);
    return Response.json({ user: { id: user.id, username: user.username } }, { status: 201 });
  } catch {
    return Response.json({ message: "注册失败，请稍后重试" }, { status: 500 });
  }
}
