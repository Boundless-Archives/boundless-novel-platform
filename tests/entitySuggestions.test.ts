import test from "node:test";
import assert from "node:assert/strict";
import { suggestNames, htmlToText } from "../src/lib/entitySuggestions";

const text = htmlToText(
  "<p>The wind rose. Kaelen drew his sword. He looked at Kaelen's hand.</p><p>They reached the Iron Gate. Kaelen waited at the Iron Gate. Then Kaelen left; the Iron Gate stood.</p>"
);

test("finds repeated names, ignores sentence starters", () => {
  const out = suggestNames([{ storyId: "s1", text }], []);
  const names = out.map((o) => o.name);
  assert.ok(names.includes("Kaelen"));
  assert.ok(names.includes("Iron Gate"));
  assert.ok(!names.includes("The"));
  assert.ok(!names.includes("They"));
  assert.equal(out[0].storyId, "s1");
});

test("skips names that already have entries", () => {
  const out = suggestNames([{ storyId: "s1", text }], ["Kaelen"]);
  assert.ok(!out.some((o) => o.name === "Kaelen"));
});
