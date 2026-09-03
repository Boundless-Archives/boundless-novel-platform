"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Announcement = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  published_at: string | null;
};

type AnnouncementBannerProps = {
  announcements: Announcement[];
};

export default function AnnouncementBanner({
  announcements,
}: AnnouncementBannerProps) {
  const items = announcements.slice(0, 3);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((current) =>
        current === items.length - 1
          ? 0
          : current + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) {
    return null;
  }

  const current = items[currentIndex];

  const goPrevious = () => {
    setCurrentIndex((current) =>
      current === 0
        ? items.length - 1
        : current - 1
    );
  };

  const goNext = () => {
    setCurrentIndex((current) =>
      current === items.length - 1
        ? 0
        : current + 1
    );
  };

  const formattedDate = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(
    new Date(
      current.published_at ?? current.created_at
    )
  );

  return (
    <section
      className="
        relative
        mb-16
        overflow-hidden
        rounded-2xl
        border
        shadow-sm
      "
      style={{
        borderColor: "var(--card-border)",
        background:
          "linear-gradient(135deg, rgba(99,102,241,.12), rgba(59,130,246,.06))",
      }}
    >
      <Link
        href="/announcements"
        className="
          group
          block
          transition
          hover:bg-[var(--card)]
          hover:bg-opacity-20
        "
      >
        <div className="flex min-h-[150px] items-center gap-5 px-5 py-6 sm:px-7">
          {/* Announcement icon */}
          <div
            className="
              hidden
              h-14
              w-14
              shrink-0
              items-center
              justify-center
              rounded-2xl
              border
              bg-[var(--card)]
              text-2xl
              shadow-sm
              sm:flex
            "
            style={{
              borderColor: "var(--card-border)",
            }}
          >
            📢
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  opacity-60
                "
              >
                Latest Announcement
              </span>

              <span className="opacity-30">•</span>

              <span className="text-xs opacity-50">
                {formattedDate}
              </span>
            </div>

            <h2
              key={current.id}
              className="
                mt-2
                line-clamp-1
                text-xl
                font-bold
                tracking-tight
                transition
                group-hover:opacity-80
                sm:text-2xl
              "
            >
              {current.title}
            </h2>

            <p
              key={`${current.id}-content`}
              className="
                mt-2
                line-clamp-2
                max-w-3xl
                text-sm
                leading-6
                opacity-65
              "
            >
              {current.content}
            </p>

            <div
              className="
                mt-3
                text-sm
                font-medium
                opacity-60
                transition
                group-hover:opacity-100
              "
            >
              View all announcements →
            </div>
          </div>

          {/* Desktop arrow */}
          <div
            className="
              hidden
              text-2xl
              opacity-30
              transition
              group-hover:translate-x-1
              group-hover:opacity-70
              sm:block
            "
          >
            →
          </div>
        </div>
      </Link>

      {/* Controls */}
      {items.length > 1 && (
        <div
          className="
            absolute
            bottom-4
            right-5
            flex
            items-center
            gap-2
            sm:right-7
          "
        >
          <button
            type="button"
            aria-label="Previous announcement"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              goPrevious();
            }}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              border
              text-sm
              transition
              hover:bg-[var(--card)]
              active:scale-95
            "
            style={{
              borderColor: "var(--card-border)",
              backgroundColor:
                "color-mix(in srgb,var(--background) 55%,transparent)",
            }}
          >
            ←
          </button>

          <button
            type="button"
            aria-label="Next announcement"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              goNext();
            }}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              border
              text-sm
              transition
              hover:bg-[var(--card)]
              active:scale-95
            "
            style={{
              borderColor: "var(--card-border)",
              backgroundColor:
                "color-mix(in srgb,var(--background) 55%,transparent)",
            }}
          >
            →
          </button>
        </div>
      )}

      {/* Indicators */}
      {items.length > 1 && (
        <div
          className="
            absolute
            bottom-5
            left-5
            flex
            items-center
            gap-1.5
            sm:left-7
          "
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show announcement ${index + 1}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setCurrentIndex(index);
              }}
              className="
                h-1.5
                rounded-full
                transition-all
                duration-300
              "
              style={{
                width:
                  index === currentIndex
                    ? "22px"
                    : "6px",
                backgroundColor:
                  index === currentIndex
                    ? "var(--foreground)"
                    : "color-mix(in srgb,var(--foreground) 25%,transparent)",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}