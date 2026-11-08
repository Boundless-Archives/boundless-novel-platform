import test from "node:test";
import assert from "node:assert/strict";
import { markLore } from "../src/lib/loreLinks";

const ents = [
  { id: "1", name: "Kaelen" },
  { id: "2", name: "Iron Gate" },
];

test("marks only the first mention", () => {
  const out = markLore("<p>Kaelen ran. Kaelen fell.</p>", ents);
  assert.equal(out.match(/lore-mark/g)?.length, 1);
});

test("does not touch tags, links or attributes", () => {
  const out = markLore('<p class="Kaelen"><a href="/x">Kaelen</a> and Kaelen</p>', ents);
  assert.equal(out.match(/lore-mark/g)?.length, 1);
  assert.ok(out.startsWith('<p class="Kaelen"><a href="/x">Kaelen</a> and <span'));
});

test("respects word boundaries and multi-word names", () => {
  const out = markLore("<p>Kaelenbrook sat at the Iron Gate.</p>", ents);
  assert.ok(!out.includes('data-lore="1"'));
  assert.ok(out.includes('data-lore="2"'));
});

test("no entities leaves html unchanged", () => {
  assert.equal(markLore("<p>Hi</p>", []), "<p>Hi</p>");
});
