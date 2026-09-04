import OfflineBookReader from "@/components/offline/OfflineBookReader";

type OfflineBookPageProps = {
  params: Promise<{
    storyId: string;
  }>;
};

export default async function OfflineBookPage({
  params,
}: OfflineBookPageProps) {
  const { storyId } = await params;

  return (
    <OfflineBookReader storyId={storyId} />
  );
}