import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="max-w-4xl mx-auto p-8">

      <Skeleton className="h-14 w-64 mb-8" />

      <div
        className="
          rounded-xl
          border
          p-8
        "
      >
        <div className="flex flex-col md:flex-row gap-8">

          <Skeleton className="w-[140px] h-[140px] rounded-full" />

          <div className="flex-1">

            <Skeleton className="h-10 w-64" />

            <Skeleton className="h-5 w-40 mt-3" />

            <Skeleton className="h-8 w-24 mt-5" />

            <Skeleton className="h-6 w-20 mt-8" />

            <Skeleton className="h-20 w-full mt-3" />

          </div>

        </div>

        <div className="flex flex-wrap gap-4 mt-8">

          <Skeleton className="h-10 w-32" />

          <Skeleton className="h-10 w-32" />

          <Skeleton className="h-10 w-40" />

        </div>

      </div>

    </main>
  );
}