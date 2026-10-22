"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

function parseGoal(value: FormDataEntryValue | null, min: number, max: number) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const n = Number(text);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`Goals must be whole numbers from ${min} to ${max}.`);
  }
  return n;
}

/* Saves the signed-in author's own goals. Leave a box empty for no goal. */
export async function saveWritingGoals(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("You must be logged in.");

  const daily = parseGoal(formData.get("daily_words"), 100, 50000);
  const weekly = parseGoal(formData.get("weekly_words"), 100, 300000);

  const { error } = await supabase.from("writing_goals").upsert(
    {
      user_id: user.id,
      daily_words: daily,
      weekly_words: weekly,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/stories");
}
