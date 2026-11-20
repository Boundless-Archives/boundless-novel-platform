"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function joinSprintAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data, error } = await createAdminClient().rpc("join_sprint", {
    p_user: user.id,
    p_sprint: String(formData.get("sprintId") ?? ""),
  });

  if (error) console.error("join_sprint failed:", error.message);

  revalidatePath("/sprint");
  revalidatePath("/stories");
  redirect(`/sprint?j=${error ? "failed" : data}`);
}
