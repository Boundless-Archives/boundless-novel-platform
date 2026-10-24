import test from "node:test";
import assert from "node:assert/strict";
import { mondayOf, previousMonday } from "../src/lib/leaderboard";

test("weeks start on Monday (UTC)", () => {
  assert.equal(mondayOf(new Date("2026-10-19T00:00:00Z")), "2026-10-19"); // Monday
  assert.equal(mondayOf(new Date("2026-10-22T13:00:00Z")), "2026-10-19"); // Thursday
  assert.equal(mondayOf(new Date("2026-10-25T23:59:59Z")), "2026-10-19"); // Sunday
  assert.equal(mondayOf(new Date("2026-10-26T00:00:00Z")), "2026-10-26"); // next Monday
});

test("crosses month and year boundaries", () => {
  assert.equal(mondayOf(new Date("2027-01-01T10:00:00Z")), "2026-12-28");
  assert.equal(mondayOf(new Date("2026-03-01T00:00:00Z")), "2026-02-23");
});

test("previous week is exactly seven days before this Monday", () => {
  const diff =
    (Date.parse(mondayOf(new Date()) + "T00:00:00Z") -
      Date.parse(previousMonday() + "T00:00:00Z")) /
    86_400_000;
  assert.equal(diff, 7);
});
