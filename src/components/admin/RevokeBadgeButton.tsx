"use client";

import { useState, useTransition } from "react";
import { revokeBadge } from "@/app/badges/actions";

export default function RevokeBadgeButton({
  userBadgeId,
}: {
  userBadgeId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [revoked, setRevoked] = useState(false);

  function handleRevoke() {
    startTransition(async () => {
      try {
        await revokeBadge(userBadgeId);
        setRevoked(true);
      } catch (error) {
        console.error(error);
      }
    });
  }

  if (revoked) {
    return <span className="text-xs opacity-50">Revoked</span>;
  }

  return (
    <button
      type="button"
      onClick={handleRevoke}
      disabled={isPending}
      className="text-xs opacity-60 hover:opacity-100 disabled:opacity-30"
    >
      Revoke
    </button>
  );
}