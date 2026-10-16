import {
  $createParagraphNode,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  type ElementNode,
  type LexicalNode,
} from "lexical";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";

/*
 * Applies a block style (heading, quote, code, normal) to what the
 * writer highlighted, and ONLY that.
 *
 * Lexical's own $setBlocksType restyles every whole block (paragraph)
 * the selection touches. When a chapter is one big paragraph (common
 * with pasted text), highlighting one sentence and choosing "Quote"
 * turned the entire chapter into a quote. Here, when the highlight
 * sits inside a single paragraph, that paragraph is split into
 * before / highlighted / after, and only the middle piece changes.
 *
 * Other cases behave as before: a caret with nothing highlighted
 * styles its own paragraph, and a highlight across several
 * paragraphs styles those paragraphs.
 */
export function $setBlockTypeForSelection(
  createBlock: () => ElementNode
) {
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) return;

  if (selection.isCollapsed()) {
    $setBlocksType(selection, createBlock);
    return;
  }

  // extract() also splits text nodes exactly at the highlight edges.
  const nodes = selection.extract();

  const blocks = new Set<ElementNode>();

  for (const node of nodes) {
    const block = node.getTopLevelElement();
    if (block && $isElementNode(block)) blocks.add(block);
  }

  if (blocks.size !== 1) {
    $setBlocksType(selection, createBlock);
    return;
  }

  const block = [...blocks][0];

  // Only plain text blocks can be split safely (not lists, code, ...).
  const splittable =
    block.getType() === "paragraph" ||
    $isHeadingNode(block) ||
    $isQuoteNode(block);

  if (!splittable) {
    $setBlocksType(selection, createBlock);
    return;
  }

  // The direct children of `block` that hold the highlighted nodes.
  const selectedChildren = new Set<LexicalNode>();

  for (const node of nodes) {
    let current: LexicalNode | null = node;

    while (current) {
      const parent: ElementNode | null = current.getParent();

      if (parent && parent.is(block)) {
        selectedChildren.add(current);
        break;
      }

      current = parent;
    }
  }

  const children = block.getChildren();
  const first = children.findIndex((c) => selectedChildren.has(c));

  let last = -1;

  children.forEach((c, i) => {
    if (selectedChildren.has(c)) last = i;
  });

  if (first === -1) {
    $setBlocksType(selection, createBlock);
    return;
  }

  // The whole paragraph is highlighted: nothing to split.
  if (first === 0 && last === children.length - 1) {
    $setBlocksType(selection, createBlock);
    return;
  }

  const before = children.slice(0, first);
  const middle = children.slice(first, last + 1);
  const after = children.slice(last + 1);

  const middleBlock = createBlock();
  middleBlock.append(...middle);

  if (before.length === 0) {
    block.insertBefore(middleBlock);
  } else {
    block.insertAfter(middleBlock);
  }

  if (after.length > 0) {
    const afterBlock = $cloneBlockType(block);
    afterBlock.append(...after);
    middleBlock.insertAfter(afterBlock);
  }

  // With nothing before the highlight, the original block is now empty.
  if (before.length === 0 && block.getChildrenSize() === 0) {
    block.remove();
  }

  middleBlock.select(0, middleBlock.getChildrenSize());
}

/* A new, empty block of the same kind as `block` (for the "after" part). */
function $cloneBlockType(block: ElementNode): ElementNode {
  let copy: ElementNode;

  if ($isHeadingNode(block)) {
    copy = $createHeadingNode(block.getTag());
  } else if ($isQuoteNode(block)) {
    copy = $createQuoteNode();
  } else {
    copy = $createParagraphNode();
  }

  copy.setFormat(block.getFormatType());
  copy.setIndent(block.getIndent());

  return copy;
}