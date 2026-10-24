import test from "node:test";
import assert from "node:assert/strict";
import { isReactionEmoji, REACTION_EMOJIS } from "../src/lib/engage";
import { REASON_LABEL, REPORT_REASONS } from "../src/lib/reports";

test("only the five reaction emojis are accepted", () => {
  for (const e of REACTION_EMOJIS) assert.ok(isReactionEmoji(e));
  for (const bad of ["👍", "", "❤", null, undefined, 5, "❤️❤️"]) {
    assert.equal(isReactionEmoji(bad), false, String(bad));
  }
});

test("every report reason has a label", () => {
  for (const r of REPORT_REASONS) assert.ok(REASON_LABEL[r.value]);
  assert.equal(REPORT_REASONS.length, 7);
});
