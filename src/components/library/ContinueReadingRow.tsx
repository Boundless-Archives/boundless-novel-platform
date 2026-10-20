import Image from "next/image";
import Link from "next/link";
import type { ContinueItem } from "@/lib/continueReading";

export default function ContinueReadingRow({
  items,
}: {
  items: ContinueItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Continue Reading</h2>
          <p className="mt-1 text-sm opacity-60">
            Pick up where you left off.
          </p>
        </div>
        <Link
          href="/library/saved"
          className="text-sm opacity-70 hover:underline"
        >
          My shelves →
        </Link>
      </div>

      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3">
        {items.map((item) => (
          <Link
            key={item.storyId}
            href={`/chapter/${item.chapterId}`}
            className="flex w-[300px] shrink-0 snap-start gap-4 rounded-2xl border p-4 transition hover:-translate-y-0.5"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >
            {item.coverUrl ? (
              <Image
                src={item.coverUrl}
                alt=""
                width={72}
                height={108}
                className="h-[108px] w-[72px] shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-[108px] w-[72px] shrink-0 items-center justify-center rounded-lg text-3xl opacity-30">
                📖
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
              <p className="line-clamp-2 font-bold">{item.title}</p>

              <p className="mt-1 line-clamp-2 text-xs opacity-70">
                {item.isNext ? "Next: " : ""}Chapter {item.chapterNumber} ·{" "}
                {item.chapterTitle}
              </p>

              <div className="mt-auto pt-3">
                <div
                  className="h-1.5 rounded-full"
                  style={{ backgroundColor: "var(--card-border)" }}
                >
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${Math.max(item.progress, 3)}%`,
                      backgroundColor: "var(--accent)",
                    }}
                  />
                </div>
                <p className="mt-1 text-xs opacity-60">
                  {item.isNext ? "New chapter ready" : `${item.progress}% read`}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
