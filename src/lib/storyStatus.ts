export const STORY_STATUSES = [
    "Draft",
    "Ongoing",
    "Completed",
    "Hiatus",
    "Dropped",
  ] as const;
  
  export type StoryStatus =
    (typeof STORY_STATUSES)[number];
  
  export const PUBLIC_STORY_STATUSES: StoryStatus[] = [
    "Ongoing",
    "Completed",
    "Hiatus",
  ];