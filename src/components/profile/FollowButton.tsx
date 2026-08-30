"use client";

import { useState, useTransition } from "react";
import {
  followUser,
  unfollowUser,
} from "@/app/followers/actions";

type Props = {
  userId: string;
  initialFollowing: boolean;
};

export default function FollowButton({
  userId,
  initialFollowing,
}: Props) {
  const [following, setFollowing] =
    useState(initialFollowing);

  const [isPending, startTransition] =
    useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        if (following) {
          await unfollowUser(userId);
          setFollowing(false);
        } else {
          await followUser(userId);
          setFollowing(true);
        }
      } catch (error) {
        console.error(error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="
        rounded-xl
        border
        px-5
        py-2.5
        font-semibold
        transition
        hover:-translate-y-0.5
        hover:shadow-md
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
      style={{
        borderColor: "var(--card-border)",
        backgroundColor: following
          ? "var(--card)"
          : "var(--button)",
        color: following
          ? "inherit"
          : "var(--button-text)",
      }}
    >
      {isPending
        ? "..."
        : following
          ? "Following"
          : "Follow"}
    </button>
  );
}