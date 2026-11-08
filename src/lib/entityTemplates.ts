/*
 * Starter templates for wiki entries. Empty boxes are intimidating, so each
 * entity type gets a short outline authors can fill in or delete.
 */

export const ENTITY_TEMPLATES: Record<string, { summary: string; content: string }> = {
  character: {
    summary: "Who they are in one or two lines.",
    content:
      "## Overview\nWho are they, and what do they want?\n\n## Appearance\n\n## Personality\n\n## Abilities\n\n## Allies & enemies\n\n## History\n",
  },
  location: {
    summary: "Where it is and what it feels like.",
    content:
      "## Overview\n\n## Geography & climate\n\n## Who lives here\n\n## Notable places\n\n## History\n\n## Secrets\n",
  },
  faction: {
    summary: "Who they are and what they stand for.",
    content:
      "## Overview\n\n## Goals\n\n## Leadership\n\n## Structure & ranks\n\n## Allies & rivals\n\n## History\n",
  },
  item: {
    summary: "What it is and why it matters.",
    content:
      "## Overview\n\n## Appearance\n\n## Powers & limits\n\n## Origin\n\n## Current owner\n",
  },
  event: {
    summary: "What happened, in a line or two.",
    content:
      "## What happened\n\n## When & where\n\n## Who was involved\n\n## Causes\n\n## Aftermath\n",
  },
  concept: {
    summary: "The idea in plain words.",
    content:
      "## Overview\n\n## How it works\n\n## Rules & limits\n\n## Who uses it\n\n## History\n",
  },
  species: {
    summary: "What they are and where they live.",
    content:
      "## Overview\n\n## Appearance\n\n## Abilities & weaknesses\n\n## Culture\n\n## Habitat\n\n## Relations with others\n",
  },
  alternate_universe: {
    summary: "How this version of the world differs.",
    content:
      "## The point of difference\n\n## What changed\n\n## Who is different\n\n## What stayed the same\n",
  },
  alternate_timeline: {
    summary: "Where this timeline splits and where it leads.",
    content:
      "## The split\n\n## Timeline\n\n## Key differences\n\n## How it ends\n",
  },
};

export function getEntityTemplate(type: string) {
  return ENTITY_TEMPLATES[type] ?? { summary: "", content: "" };
}

export function isTemplateContent(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return true;
  return Object.values(ENTITY_TEMPLATES).some(
    (t) => t.content.trim() === trimmed
  );
}
