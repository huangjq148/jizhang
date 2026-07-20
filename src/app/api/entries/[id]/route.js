import { amountToCent } from "../../../../lib/finance.mjs";
import { getSessionUser, unauthorized } from "../../../../lib/auth.mjs";
import { prisma } from "../../../../lib/prisma.mjs";
import { parseCalendarDate } from "../../../../lib/date.mjs";

export async function PUT(request, { params }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  try {
    const { date, amount } = await request.json();
    const { id } = await params;
    const result = await prisma.entry.updateMany({ where: { id, userId: user.id }, data: { entryDate: parseCalendarDate(date), amountCent: amountToCent(amount) } });
    if (result.count === 0) return Response.json({ message: "账目不存在" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ message: error.message || "编辑失败" }, { status: 400 });
  }
}
