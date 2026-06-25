import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="max-w-6xl mx-auto p-8">

      <Skeleton className="h-14 w-64 mb-10" />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {[...Array(6)].map((_, index) => (
          <div
            key={index}
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