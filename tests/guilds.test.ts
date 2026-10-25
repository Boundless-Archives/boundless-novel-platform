import test from "node:test";
import assert from "node:assert/strict";
import { GUILD_LEVEL_XP, GUILD_LEVEL_NAMES, guildProgress } from "../src/lib/guilds";

test("level thresholds match the SQL function (0,500,1500,...)", () => {
  assert.deepEqual([...GUILD_LEVEL_XP], [0, 500, 1500, 4000, 10000, 25000, 60000, 140000, 320000, 700000]);
  assert.equal(GUILD_LEVEL_NAMES.length, GUILD_LEVEL_XP.length);
});

test("guildProgress", () => {
  assert.equal(guildProgress(0).level, 1);
  assert.equal(guildProgress(499).level, 1);
  assert.equal(guildProgress(500).level, 2);
  assert.equal(guildProgress(250).percent, 50);
  const top = guildProgress(5_000_000);
  assert.equal(top.level, 10);
  assert.equal(top.percent, 100);
  assert.equal(top.next, null);
});
