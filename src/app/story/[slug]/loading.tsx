import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="max-w-6xl mx-auto p-8">

      <div
        className="
          rounded-xl
          border
          p-6
        "
      >
        <div className="flex flex-col md:flex-row gap-8">

          <Skeleton className="w-[280px] h-[420px]" />

          <div className="flex-1">

            <Skeleton className="h-12 w-3/4" />

            <Skeleton className="h-5 w-48 mt-4" />

            <div className="flex gap-3 mt-6">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-28" />
            </div>

            <div className="flex gap-3 mt-6">
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-44" />
            </div>

            <Skeleton className="h-32 w-full mt-8" />

          </div>

        </div>
      </div>

      <div className="mt-10">

        <Skeleton className="h-10 w-48 mb-6" />

        <div className="space-y-3">

          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border p-4"
            >
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
          ))}

        </div>

      </div>

    </main>
  );
}