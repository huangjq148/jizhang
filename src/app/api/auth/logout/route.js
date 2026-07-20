import { destroySession } from "../../../../lib/auth.mjs";

export async function POST() {
  await destroySession();
  return Response.json({ ok: true });
}
