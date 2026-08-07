import { createClient } from "@/utils/supabase/server";

type RecordViewParams = {
  userId: string | null;
  storyId: string;
  chapterId: string;
};

export async function recordChapterView({
  userId,
  storyId,
  chapterId,
}: RecordViewParams) {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  // We'll build this function step-by-step.
}