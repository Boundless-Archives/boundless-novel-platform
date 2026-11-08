"use client";

import { useEffect, useRef, useState } from "react";
import { getEntityTypeIcon, getEntityTypeLabel } from "@/lib/entityTypes";

export type LoreCardEntity = {
  id: string;
  name: string;
  type: string;
  summary: string | null;
  imageUrl: string | null;
  href: string;
};

type Open = { entity: LoreCardEntity; x: number; y: number; below: boolean };

/*
 * Tap (or hover) a highlighted name in a chapter to see a small lore card.
 * Uses event delegation, so it works inside the paged reader too.
 */
export default function LoreCards({ entities }: { entities: LoreCardEntity[] }) {
  const [open, setOpen] = useState<Open | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const openId = useRef<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    openId.current = open?.entity.id ?? null;
  }, [open]);

  useEffect(() => {
    if (entities.length === 0) return;
    const byId = new Map(entities.map((e) => [e.id, e]));

    function show(el: HTMLElement) {
      const entity = byId.get(el.dataset.lore ?? "");
      if (!entity) return;
      const rect = el.getBoundingClientRect();
      const below = rect.top < 220;
      setOpen({
        entity,
        x: Math.min(Math.max(rect.left + rect.width / 2, 150), window.innerWidth - 150),
        y: below ? rect.bottom + 8 : rect.top - 8,
        below,
      });
    }

    function target(e: Event) {
      return (e.target as HTMLElement | null)?.closest?.(".lore-mark") as HTMLElement | null;
    }

    function onClick(e: MouseEvent) {
      const el = target(e);
      if (el) {
        e.preventDefault();
        if (openId.current === el.dataset.lore && !window.matchMedia("(hover: hover)").matches) setOpen(null);
        else show(el);
        return;
      }
      if (!cardRef.current?.contains(e.target as Node)) setOpen(null);
    }

    function onOver(e: MouseEvent) {
      if (!window.matchMedia("(hover: hover)").matches) return;
      const el = target(e);
      if (el) {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        show(el);
      }
    }

    function onOut(e: MouseEvent) {
      if (!window.matchMedia("(hover: hover)").matches) return;
      if (target(e)) {
        closeTimer.current = setTimeout(() => setOpen(null), 350);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "Enter") {
        const el = target(e);
        if (el) show(el);
      }
    }

    const close = () => setOpen(null);

    document.addEventListener("click", onClick);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);

    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [entities]);

  if (!open) return null;

  const { entity } = open;

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-label={entity.name}
      onMouseEnter={() => closeTimer.current && clearTimeout(closeTimer.current)}
      onMouseLeave={() => setOpen(null)}
      className="fixed z-[10050] w-[290px] rounded-2xl border p-4 shadow-2xl"
      style={{
        left: open.x,
        top: open.y,
        transform: open.below ? "translateX(-50%)" : "translate(-50%, -100%)",
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
        color: "var(--foreground)",
        fontSize: "0.9rem",
        lineHeight: 1.5,
        whiteSpace: "normal",
      }}
    >
      <div className="flex items-start gap-3">
        {entity.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entity.imageUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0">
          <p className="font-bold leading-tight">{entity.name}</p>
          <p className="text-xs opacity-60">
            {getEntityTypeIcon(entity.type)} {getEntityTypeLabel(entity.type)}
          </p>
        </div>
      </div>

      {entity.summary && (
        <p className="mt-3 line-clamp-4 text-sm opacity-85">{entity.summary}</p>
      )}

      <a
        href={entity.href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm font-semibold text-cyan-500"
      >
        Open in the wiki →
      </a>
    </div>
  );
}
