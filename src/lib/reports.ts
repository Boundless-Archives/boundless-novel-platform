export const REPORT_REASONS = [
  { value: "spam", label: "Spam or advertising" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate speech" },
  { value: "sexual", label: "Sexual or inappropriate content" },
  { value: "copyright", label: "Copied or plagiarised work" },
  { value: "spoiler", label: "Unmarked spoiler" },
  { value: "other", label: "Something else" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];
export type ReportTarget = "comment" | "review" | "user" | "guild_post" | "guild_reply" | "message";

export const REASON_LABEL: Record<string, string> = Object.fromEntries(
  REPORT_REASONS.map((r) => [r.value, r.label])
);
