import test from "node:test";
import assert from "node:assert/strict";
import { fingerprintOf } from "../src/lib/errorLog";

const stack = "Error: x\n    at doThing (/app/a.js:10:5)\n    at other (/app/b.js:1:1)";

test("the same error groups together", () => {
  assert.equal(
    fingerprintOf("server", "Cannot read property 'a'", stack),
    fingerprintOf("server", "Cannot read property 'a'", stack)
  );
});

test("ids and numbers in the message don't split a group", () => {
  assert.equal(
    fingerprintOf("server", "Story 12 not found (3f2c1a9e-1111-4222-8333-444455556666)", stack),
    fingerprintOf("server", "Story 987 not found (aaaaaaaa-1111-4222-8333-444455556666)", stack)
  );
});

test("line numbers moving between deploys don't split a group", () => {
  const moved = stack.replace(":10:5", ":42:9");
  assert.equal(
    fingerprintOf("server", "boom", stack),
    fingerprintOf("server", "boom", moved)
  );
});

test("different errors and sources stay separate", () => {
  assert.notEqual(fingerprintOf("server", "boom", stack), fingerprintOf("server", "bang", stack));
  assert.notEqual(fingerprintOf("server", "boom", stack), fingerprintOf("client", "boom", stack));
});
