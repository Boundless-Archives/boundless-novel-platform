import test from "node:test";
import assert from "node:assert/strict";
import {
  makeSnippet,
  resolveParagraphIndex,
  splitParagraphs,
  tagParagraphs,
  SNIPPET_LENGTH,
} from "../src/lib/paragraphs";

test("each non-empty paragraph is tagged in order", () => {
  const { html, paragraphs } = tagParagraphs("<p>First</p><p></p><p>Second <b>bold</b></p>");
  assert.deepEqual(paragraphs, ["First", "Second bold"]);
  assert.match(html, /data-pi="0"/);
  assert.match(html, /data-pi="1"/);
  assert.doesNotMatch(html, /data-pi="2"/);
});

test("old plain-text chapters split by line", () => {
  assert.deepEqual(splitParagraphs("Line one\n\nLine two\n"), ["Line one", "Line two"]);
});

test("comments follow their paragraph when text is inserted above it", () => {
  const before = ["Alpha", "Bravo", "Charlie"];
  const snippet = makeSnippet("Charlie");
  assert.equal(resolveParagraphIndex(before, 2, snippet), 2);
  const after = ["New opening", ...before];
  assert.equal(resolveParagraphIndex(after, 2, snippet), 3);
});

test("a comment on a paragraph that was rewritten is orphaned", () => {
  assert.equal(resolveParagraphIndex(["Totally different"], 0, "Charlie"), null);
});

test("snippets are capped", () => {
  assert.equal(makeSnippet("x".repeat(500)).length, SNIPPET_LENGTH);
});
