import test from "node:test";
import assert from "node:assert/strict";
import { parsePublished, shareLinks, shareText } from "../src/lib/share";

test("share links encode the url and text", () => {
  const links = shareLinks("https://x.org/story/a b", "Read “A & B”");
  const wa = links.find((l) => l.key === "whatsapp")!;
  assert.ok(wa.href.startsWith("https://wa.me/?text="));
  assert.ok(!wa.href.includes(" "));
  assert.equal(links.length, 4);
});

test("share text names the book", () => {
  assert.match(shareText("Broken Worlds"), /Broken Worlds/);
});

test("parsePublished rejects junk and fills defaults", () => {
  assert.equal(parsePublished(""), null);
  assert.equal(parsePublished("not json"), null);
  assert.equal(parsePublished(JSON.stringify({ chapterId: "1" })), null);
  const p = parsePublished(JSON.stringify({ chapterId: "1", storySlug: "s" }));
  assert.equal(p?.chapterTitle, "Your chapter");
  assert.equal(p?.chapterNumber, null);
});
