"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Props = {
  chapterId: string;
};

export default function PublishChapterButton({
  chapterId,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  async function publishChapter() {
    const { error } = await supabase
      .from("chapters")
      .update({
        status: "Published",
        published_at: new Date().toISOString(),
      })
      .eq("id", chapterId);

    if (!error) {
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={publishChapter}
      className="
        rounded-lg
        px-4
        py-2
        font-medium
        bg-emerald-600
        text-white
        hover:bg-emerald-700
        transition
      "
    >
      Publish
    </button>
  );
}