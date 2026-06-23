import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ChapterPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: chapter } = await supabase
    .from("chapters")
    .select("*")
    .eq("id", id)
    .single();

  if (!chapter) {
    notFound();
  }

  return (
    <main className="p-10 max-w-4xl">
      <h1 className="text-4xl font-bold">
        {chapter.title}
      </h1>

      <div className="mt-8 whitespace-pre-wrap">
        {chapter.content}
      </div>
    </main>
  );
}