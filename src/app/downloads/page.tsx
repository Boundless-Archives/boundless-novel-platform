import DownloadsLibrary from "@/components/offline/DownloadsLibrary";

export default function DownloadsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Offline Downloads
        </h1>

        <p className="mt-2 text-sm opacity-60">
          Books you've saved for reading without
          an internet connection.
        </p>
      </div>

      <DownloadsLibrary />
    </main>
  );
}