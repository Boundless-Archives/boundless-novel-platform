import test from "node:test";
import assert from "node:assert/strict";
import {
  getNextStreakMilestone,
  getStreakReward,
} from "../src/lib/streaks";

test("reader milestones pay Sparks only on milestone days", () => {
  assert.equal(getStreakReward("reader", 10), 100);
  assert.equal(getStreakReward("reader", 25), 200);
  assert.equal(getStreakReward("reader", 50), 400);
  assert.equal(getStreakReward("reader", 100), 1000);
});

test("ordinary streak days pay nothing", () => {
  for (const day of [1, 2, 9, 11, 24, 26, 49, 99, 101, 149]) {
    assert.equal(getStreakReward("reader", day), 0, `day ${day}`);
    assert.equal(getStreakReward("writer", day), 0, `day ${day}`);
  }
});

test("after day 100 a reward repeats every 50 days", () => {
  assert.equal(getStreakReward("reader", 150), 500);
  assert.equal(getStreakReward("reader", 200), 500);
  assert.equal(getStreakReward("writer", 150), 1000);
  assert.equal(getStreakReward("reader", 175), 0);
});

test("writers earn double readers at the early milestones", () => {
  for (const day of [10, 25, 50, 100]) {
    assert.equal(
      getStreakReward("writer", day),
      getStreakReward("reader", day) * 2
    );
  }
});

test("next milestone for the streak card", () => {
  assert.deepEqual(getNextStreakMilestone("reader", 0), { day: 10, reward: 100 });
  assert.deepEqual(getNextStreakMilestone("reader", 10), { day: 25, reward: 200 });
  assert.deepEqual(getNextStreakMilestone("reader", 99), { day: 100, reward: 1000 });
  assert.deepEqual(getNextStreakMilestone("reader", 100), { day: 150, reward: 500 });
  assert.deepEqual(getNextStreakMilestone("reader", 160), { day: 200, reward: 500 });
});
