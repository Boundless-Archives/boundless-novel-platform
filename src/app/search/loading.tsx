import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">

      <Skeleton className="h-14 w-72" />

      <Skeleton className="h-14 w-full mt-6" />

      <div className="mt-10 space-y-4">

        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="
              rounded-xl
              border
              p-5
            "
          >
            <Skeleton className="h-8 w-64" />

            <Skeleton className="h-16 w-full mt-4" />
          </div>
        ))}

      </div>

    </main>
  );
}