"use client";

import { useTransition } from "react";
import { toggleStoryLike } from "@/app/actions/storyLikes";

type Props = {
  storyId: string;
  storySlug: string;
  likes: number;
  liked: boolean;
};

export default function LikeButton({
  storyId,
  storySlug,
  likes,
  liked,
}: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleStoryLike(storyId, storySlug);
        })
      }
      className="
        flex
        items-center
        gap-2
        rounded-xl
        border
        px-4
        py-2
        transition
        hover:shadow-md
        disabled:opacity-60
      "
      style={{
        borderColor: "var(--card-border)",
      }}
    >
      <span className="text-xl">
        {liked ? "❤️" : "🤍"}
      </span>

      <span className="font-medium">
        {likes}
      </span>
    </button>
  );
}