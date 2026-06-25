import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="max-w-6xl mx-auto p-8">

      <div
        className="
          rounded-xl
          border
          p-8
          mb-10
        "
      >
        <div className="flex flex-col md:flex-row gap-8">

          <Skeleton className="w-[140px] h-[140px] rounded-full" />

          <div className="flex-1">

            <Skeleton className="h-10 w-64" />

            <Skeleton className="h-5 w-40 mt-3" />

            <Skeleton className="h-8 w-24 mt-5" />

            <Skeleton className="h-20 w-full mt-6" />

            <Skeleton className="h-4 w-32 mt-6" />

          </div>

        </div>
      </div>

      <Skeleton className="h-10 w-40 mb-6" />

      <div className="grid gap-6 md:grid-cols-2">

        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="
              rounded-xl
              border
              p-5
            "
          >
            <Skeleton className="h-72 w-full" />

            <Skeleton className="h-8 w-3/4 mt-4" />

            <Skeleton className="h-6 w-20 mt-4" />

            <Skeleton className="h-20 w-full mt-4" />

            <Skeleton className="h-10 w-32 mt-5" />
          </div>
        ))}

      </div>

    </main>
  );
}