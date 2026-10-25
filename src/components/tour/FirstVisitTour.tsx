"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const KEY = "boundless-tour-v1";

/*
 * Each step can point at a real button. `targets` lists data-tour keys in
 * order of preference; the first one actually visible on this screen wins
 * (the desktop link, the phone tab, or the menu button). When the pointer
 * lands on the menu button, `menuText` says where to go from there. A step
 * with no visible target simply shows centred.
 */
type Step = {
  icon: string;
  title: string;
  text: string;
  menuText?: string;
  targets?: string[];
  href?: string;
  cta?: string;
};

const STEPS: Step[] = [
  {
    icon: "🌌",
    title: "Welcome to the Boundless Universe",
    text: "A home for stories without borders. Let us show you around. It takes a few seconds.",
  },
  {
    icon: "🧭",
    title: "Find your next story",
    text: "Explore is where every book lives. Browse by genre, status and what's rising.",
    targets: ["/explore"],
    menuText: "Open the menu and tap Explore to browse every story.",
  },
  {
    icon: "🔥",
    title: "Keep your flame alive",
    text: "Read a little each day and your streak grows. Streaks and quests earn Sparks for the shop.",
    targets: ["streak", "/quests"],
    menuText: "Open the menu and tap Quests to see today's tasks and earn Sparks.",
  },
  {
    icon: "🧘",
    title: "Walk your Path",
    text: "Everything you read and write feeds your cultivation. Choose a path and break through realms here.",
    targets: ["/cultivation"],
    menuText: "Open the menu and tap Path to choose your cultivation path.",
  },
  {
    icon: "⛰️",
    title: "Join a gathering",
    text: "Sects, covens, cults and guilds live here, with events to match. Join one and grow together.",
    targets: ["/guilds"],
    menuText: "Open the menu and tap Sects & Guilds. Events is just beside it.",
    href: "/guilds",
    cta: "Take me there",
  },
  {
    icon: "🔔",
    title: "Your inbox",
    text: "Replies, rewards, guild news and updates all land here.",
    targets: ["/notifications"],
    menuText: "Your inbox is in the menu too.",
  },
];

type Pointer = { key: string; rect: DOMRect } | null;

function findTarget(targets: string[] | undefined): Pointer {
  if (!targets) return null;

  const all = [...targets, "menu"];
  for (const key of all) {
    const els = document.querySelectorAll<HTMLElement>(`[data-tour="${key}"]`);
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight) {
        return { key, rect: r };
      }
    }
  }
  return null;
}

/* A short, skippable welcome the first time someone visits. */
export default function FirstVisitTour() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [pointer, setPointer] = useState<Pointer>(null);

  const s = STEPS[step];

  useEffect(() => {
    let seen = true;
    try {
      seen = !!localStorage.getItem(KEY);
    } catch {
      seen = true; // storage blocked: don't nag
    }
    if (seen) return;
    const t = setTimeout(() => setOpen(true), 2600); // after the splash
    return () => clearTimeout(t);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  // Keep the pointer on its button.
  useEffect(() => {
    if (!open) return;

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const found = findTarget(STEPS[step].targets);
        if (found) {
          const el = document.querySelector<HTMLElement>(`[data-tour="${found.key}"]`);
          el?.scrollIntoView?.({ block: "nearest", inline: "center" });
        }
        setPointer(findTarget(STEPS[step].targets));
      });
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const hidden = pathname.startsWith("/auth") || pathname.startsWith("/chapter");
  if (!open || hidden) return null;

  const last = step === STEPS.length - 1;
  const text = pointer?.key === "menu" && s.menuText ? s.menuText : s.text;

  const vw = typeof window === "undefined" ? 400 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const width = Math.min(340, vw - 24);

  let cardStyle: React.CSSProperties = {};
  let centred = true;

  if (pointer) {
    centred = false;
    const r = pointer.rect;
    const left = Math.min(Math.max(r.left + r.width / 2 - width / 2, 12), vw - width - 12);
    cardStyle =
      r.bottom + 220 < vh
        ? { position: "fixed", top: r.bottom + 14, left, width }
        : { position: "fixed", bottom: vh - r.top + 14, left, width };
  }

  const card = (
    <div
      className="rounded-2xl border p-5 text-center shadow-2xl"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
        ...(centred ? { width: "100%", maxWidth: 420 } : cardStyle),
      }}
    >
      <div className="text-4xl" aria-hidden>{s.icon}</div>
      <h2 className="mt-2 text-xl font-bold">{s.title}</h2>
      <p className="mt-2 text-sm opacity-80">{text}</p>

      <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
        {STEPS.map((_, i) => (
          <span
            key={i}
            className="h-1.5 w-5 rounded-full"
            style={{ backgroundColor: i === step ? "var(--button)" : "var(--card-border)" }}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" onClick={close} className="text-sm opacity-60 hover:opacity-100">
          Skip
        </button>

        <div className="flex items-center gap-3">
          {s.href && (
            <Link href={s.href} onClick={close} className="text-sm underline underline-offset-4">
              {s.cta}
            </Link>
          )}
          <button
            type="button"
            onClick={() => (last ? close() : setStep(step + 1))}
            className="rounded-lg px-4 py-2 text-sm font-semibold"
            style={{ backgroundColor: "var(--button)", color: "var(--button-text)" }}
          >
            {last ? "Start exploring" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[10000]" role="dialog" aria-modal="true" aria-label="Welcome tour">
      {pointer ? (
        <>
          {/* Dim everything except the button being pointed at */}
          <div
            className="pointer-events-none fixed rounded-xl"
            style={{
              top: pointer.rect.top - 6,
              left: pointer.rect.left - 6,
              width: pointer.rect.width + 12,
              height: pointer.rect.height + 12,
              boxShadow: "0 0 0 9999px rgba(0,0,0,.68), 0 0 0 2px var(--button), 0 0 18px 4px var(--button)",
            }}
          />
          <div className="fixed inset-0" onClick={close} aria-hidden />
          {card}
        </>
      ) : (
        <div className="flex h-full items-end justify-center bg-black/65 p-4 sm:items-center" onClick={close}>
          <div className="w-full" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            {card}
          </div>
        </div>
      )}
    </div>
  );
}
