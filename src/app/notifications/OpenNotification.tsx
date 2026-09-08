"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { openNotification } from "./actions";

type Props = {
  notificationId: string;
  href?: string | null;
  children: React.ReactNode;
};

export default function OpenNotification({
  notificationId,
  href,
  children,
}: Props) {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  function handleClick(
    event: React.MouseEvent<HTMLAnchorElement>
  ) {
    event.preventDefault();

    startTransition(async () => {
      try {
        const link = await openNotification(
          notificationId
        );

        router.push(
          link ||
            href ||
            "/notifications"
        );
      } catch {
        router.push(
          href || "/notifications"
        );
      }
    });
  }

  return (
    <a
      href={href || "/notifications"}
      onClick={handleClick}
      className={`
        block
        transition
        hover:-translate-y-[1px]
        hover:opacity-95
        active:translate-y-0
        ${
          isPending
            ? "pointer-events-none opacity-50"
            : ""
        }
      `}
    >
      {children}
    </a>
  );
}