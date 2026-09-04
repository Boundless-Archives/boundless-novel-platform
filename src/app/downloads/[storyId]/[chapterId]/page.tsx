import OfflineChapterReader from "@/components/offline/OfflineChapterReader";

type OfflineChapterPageProps = {
  params: Promise<{
    storyId: string;
    chapterId: string;
  }>;
};

export default async function OfflineChapterPage({
  params,
}: OfflineChapterPageProps) {
  const { storyId, chapterId } = await params;

  return (
    <OfflineChapterReader
      storyId={storyId}
      chapterId={chapterId}
    />
  );
}