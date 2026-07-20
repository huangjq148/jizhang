import { amountToCent, centToAmount } from "../../../lib/finance.mjs";
import { getSessionUser, unauthorized } from "../../../lib/auth.mjs";
import { prisma } from "../../../lib/prisma.mjs";
import { normalizeDateRange, parseCalendarDate, formatCalendarDate } from "../../../lib/date.mjs";

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const range = normalizeDateRange(searchParams.get("startDate"), searchParams.get("endDate"));
    const entries = await prisma.entry.findMany({
      where: { userId: user.id, entryDate: { gte: parseCalendarDate(range.startDate), lte: parseCalendarDate(range.endDate) } },
      orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
    });
    const totalCent = entries.reduce((sum, entry) => sum + entry.amountCent, 0);
    return Response.json({ startDate: range.startDate, endDate: range.endDate, total: centToAmount(totalCent), entries: entries.map((entry) => ({ id: entry.id, date: formatCalendarDate(entry.entryDate), amount: centToAmount(entry.amountCent) })) });
  } catch (error) {
    return Response.json({ message: error.message || "查询失败" }, { status: 400 });
  }
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  try {
    const { date, amount } = await request.json();
    const entry = await prisma.entry.create({ data: { userId: user.id, entryDate: parseCalendarDate(date), amountCent: amountToCent(amount) } });
    return Response.json({ id: entry.id }, { status: 201 });
  } catch (error) {
    return Response.json({ message: error.message || "新增失败" }, { status: 400 });
  }
}
