"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { REPORT_REASONS, type ReportTarget } from "@/lib/reports";

const MESSAGES: Record<string, { ok: boolean; message: string }> = {
  ok: { ok: true, message: "Thanks. Our team will take a look." },
  duplicate: { ok: true, message: "You've already reported this." },
  own: { ok: false, message: "You can't report your own post." },
  missing: { ok: false, message: "That post no longer exists." },
  limit: {
    ok: false,
    message: "You've sent a lot of reports today. Please try again tomorrow.",
  },
  invalid: { ok: false, message: "Something was wrong with that report." },
};

export async function reportContent(
  type: ReportTarget,
  targetId: string,
  reason: string,
  details?: string
): Promise<{ ok: boolean; message: string }> {
  if (
    !["comment", "review", "user"].includes(type) ||
    typeof targetId !== "string" ||
    !REPORT_REASONS.some((r) => r.value === reason)
  ) {
    return MESSAGES.invalid;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Please sign in to report." };
  }

  const { data, error } = await createAdminClient().rpc(
    "submit_content_report",
    {
      p_user: user.id,
      p_type: type,
      p_target: targetId,
      p_reason: reason,
      p_details: (details ?? "").slice(0, 1000),
    }
  );

  if (error) {
    console.error("Report failed:", error.message);
    return { ok: false, message: "Couldn't send the report. Try again." };
  }

  return MESSAGES[String(data)] ?? MESSAGES.invalid;
}
