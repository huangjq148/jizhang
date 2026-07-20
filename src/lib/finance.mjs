export const MAX_AMOUNT_CENT = 2147483647;

export function amountToCent(value) {
  if (typeof value !== "string" || !/^\d+(\.\d{1,2})?$/.test(value)) {
    throw new Error("金额格式不正确");
  }

  const [yuan, fraction = ""] = value.split(".");
  const cent = Number.parseInt(yuan, 10) * 100 + Number.parseInt(fraction.padEnd(2, "0") || "0", 10);
  if (!Number.isSafeInteger(cent) || cent < 0 || cent > MAX_AMOUNT_CENT) {
    throw new Error("金额超出允许范围");
  }
  return cent;
}

export function centToAmount(value) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("金额分值不正确");
  }
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, "0")}`;
}

export function isCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function currentMonthRange(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    startDate: `${year}-${month}-01`,
    endDate: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
  };
}
