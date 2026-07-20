import { amountToCent, centToAmount, centToBalance } from "../../../lib/finance.mjs";
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
    const totalIncomeCent = entries.reduce((sum, entry) => sum + entry.incomeCent, 0);
    const totalExpenseCent = entries.reduce((sum, entry) => sum + entry.expenseCent, 0);
    return Response.json({
      startDate: range.startDate,
      endDate: range.endDate,
      balance: centToBalance(totalIncomeCent - totalExpenseCent),
      totalIncome: centToAmount(totalIncomeCent),
      totalExpense: centToAmount(totalExpenseCent),
      entries: entries.map((entry) => ({
        id: entry.id,
        date: formatCalendarDate(entry.entryDate),
        income: centToAmount(entry.incomeCent),
        expense: centToAmount(entry.expenseCent),
      })),
    });
  } catch (error) {
    return Response.json({ message: error.message || "查询失败" }, { status: 400 });
  }
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  try {
    const { date, income, expense } = await request.json();
    const entry = await prisma.entry.create({ data: { userId: user.id, entryDate: parseCalendarDate(date), incomeCent: amountToCent(income), expenseCent: amountToCent(expense) } });
    return Response.json({ id: entry.id }, { status: 201 });
  } catch (error) {
    return Response.json({ message: error.message || "新增失败" }, { status: 400 });
  }
}
