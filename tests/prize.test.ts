import test from "node:test";
import assert from "node:assert/strict";
import { lastDayLabel, naira, prizeCloseMs, type PrizeSprint } from "../src/lib/prize";

const base = {
  starts_at: "2026-11-20T00:00:00+01:00",
  ends_at: "2027-01-06T00:00:00+01:00",
  prize_closes_at: null,
} as unknown as PrizeSprint;

test("prize close defaults to 10 days after entries close", () => {
  assert.equal(prizeCloseMs(base), new Date("2027-01-16T00:00:00+01:00").getTime());
});

test("an explicit prize close date wins", () => {
  const s = { ...base, prize_closes_at: "2027-01-20T00:00:00+01:00" } as PrizeSprint;
  assert.equal(prizeCloseMs(s), new Date("2027-01-20T00:00:00+01:00").getTime());
});

test("a midnight close is described as the day before", () => {
  assert.match(lastDayLabel("2027-01-06T00:00:00+01:00"), /5 January 2027/);
});

test("naira formatting", () => {
  assert.match(naira(20000), /^₦20[,\s]?000$/);
});
