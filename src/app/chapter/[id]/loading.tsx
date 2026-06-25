import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">

      <div className="text-center">

        <Skeleton className="h-4 w-40 mx-auto" />

        <Skeleton className="h-12 w-72 mx-auto mt-4" />

        <Skeleton className="h-8 w-96 mx-auto mt-4" />

      </div>

      <article className="max-w-2xl mx-auto mt-12">

        {[...Array(14)].map((_, i) => (
          <Skeleton
            key={i}
            className={`
              h-5
              mb-4
              ${
                i % 5 === 0
                  ? "w-3/4"
                  : "w-full"
              }
            `}
          />
        ))}

      </article>

      <div
        className="
          mt-16
          border-t
          pt-8
          flex
          justify-between
        "
      >
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-28" />
      </div>

    </main>
  );
}