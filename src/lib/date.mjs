import { currentMonthRange, isCalendarDate } from "./finance.mjs";

export function parseCalendarDate(value) {
  if (!isCalendarDate(value)) throw new Error("日期格式不正确");
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatCalendarDate(value) {
  return value.toISOString().slice(0, 10);
}

export function normalizeDateRange(startDate, endDate) {
  const fallback = currentMonthRange();
  const start = startDate || fallback.startDate;
  const end = endDate || fallback.endDate;
  if (!isCalendarDate(start) || !isCalendarDate(end) || start > end) {
    throw new Error("日期范围不正确");
  }
  return { startDate: start, endDate: end };
}
