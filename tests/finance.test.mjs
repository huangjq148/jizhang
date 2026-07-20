import test from "node:test";
import assert from "node:assert/strict";
import { amountToCent, centToAmount, centToBalance, currentMonthRange, isCalendarDate } from "../src/lib/finance.mjs";

test("converts strict decimal money strings to integer cents", () => {
  assert.equal(amountToCent("12.3"), 1230);
  assert.equal(amountToCent("0"), 0);
  assert.equal(centToAmount(1230), "12.30");
  assert.equal(centToBalance(1230), "12.30");
  assert.equal(centToBalance(-1230), "-12.30");
});

test("rejects negative, exponent, three-decimal and empty amounts", () => {
  for (const value of ["-1", "1e2", "1.234", ""]) {
    assert.throws(() => amountToCent(value));
  }
});

test("validates calendar dates without timezone shifts", () => {
  assert.equal(isCalendarDate("2026-02-28"), true);
  assert.equal(isCalendarDate("2026-02-29"), false);
  assert.equal(isCalendarDate("2026/02/28"), false);
});

test("returns the current calendar month range", () => {
  assert.deepEqual(currentMonthRange(new Date(2026, 1, 14)), {
    startDate: "2026-02-01",
    endDate: "2026-02-28",
  });
});
