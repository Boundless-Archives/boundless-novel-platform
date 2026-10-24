import test from "node:test";
import assert from "node:assert/strict";
import { cleanUsernameInput, validateUsername } from "../src/lib/username";

test("accepts good usernames", () => {
  for (const u of ["abc", "user_1", "a".repeat(20), "x9_"]) {
    assert.equal(validateUsername(u), null, u);
  }
});

test("rejects spaces, capitals, symbols and bad lengths", () => {
  for (const u of ["ab", "a".repeat(21), "has space", "Upper", "dash-ed", "émile", ""]) {
    assert.notEqual(validateUsername(u), null, JSON.stringify(u));
  }
});

test("reserved names are refused", () => {
  for (const u of ["admin", "support", "boundless", "series", "api"]) {
    assert.equal(validateUsername(u), "That username isn't available.");
  }
});

test("typed input is cleaned to valid characters", () => {
  assert.equal(cleanUsernameInput("Hello World!_9"), "helloworld_9");
});
