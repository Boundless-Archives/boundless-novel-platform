import test from "node:test";
import assert from "node:assert/strict";
import { countWords } from "../src/lib/wordCount";
import { MIN_STREAK_WORDS } from "../src/lib/writing";

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");

test("counts plain text", () => {
  assert.equal(countWords("one two  three\nfour"), 4);
  assert.equal(countWords(""), 0);
  assert.equal(countWords("   "), 0);
});

test("HTML tags and attributes are not words", () => {
  assert.equal(countWords('<p class="a b c">hello world</p><p>again</p>'), 3);
  assert.equal(countWords("<p>one</p><p>two</p>"), 2);
});

test("entities and line breaks", () => {
  assert.equal(countWords("<p>fish&nbsp;&amp;&nbsp;chips</p>"), 3);
  assert.equal(countWords("a<br>b<br/>c"), 3);
});

test("a five-line author note can't keep a streak alive", () => {
  const note = "<p>Thanks!</p>".repeat(5);
  assert.ok(countWords(note) < MIN_STREAK_WORDS);
});

test("the streak minimum is 300 words, inclusive", () => {
  assert.equal(MIN_STREAK_WORDS, 300);
  assert.ok(countWords(words(299)) < MIN_STREAK_WORDS);
  assert.ok(countWords(words(300)) >= MIN_STREAK_WORDS);
});
