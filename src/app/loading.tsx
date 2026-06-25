import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="max-w-6xl mx-auto p-6 md:p-10">

      <section className="text-center py-20">

        <Skeleton className="h-20 w-20 mx-auto rounded-full" />

        <Skeleton className="h-14 w-72 mx-auto mt-6" />

        <Skeleton className="h-6 w-full max-w-xl mx-auto mt-6" />

        <Skeleton className="h-14 w-full max-w-2xl mx-auto mt-8" />

      </section>

      <Skeleton className="h-10 w-56 mb-8" />

      <div className="grid gap-6 md:grid-cols-2">

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

            <Skeleton className="h-4 w-1/2 mt-3" />

            <Skeleton className="h-6 w-24 mt-4" />

            <Skeleton className="h-20 w-full mt-4" />

            <Skeleton className="h-10 w-32 mt-5" />
          </div>
        ))}

      </div>

    </main>
  );
}