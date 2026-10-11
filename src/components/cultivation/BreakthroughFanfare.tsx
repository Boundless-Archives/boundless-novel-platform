"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type FanfareEvent = {
  id: string;
  name: string;
  realmName: string;
  path: "qi" | "mana";
};

const PATH_COLORS: Record<string, string> = {
  qi: "#2DD4BF",
  mana: "#818CF8",
};

const DURATION_MS = 4800;

function Embers({ color }: { color: string }) {
  const motes = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {motes.map((i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 1.2;
        const duration = 2.2 + Math.random() * 1.6;
        const size = 2 + Math.random() * 3;
        const drift = (Math.random() - 0.5) * 120;

        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              bottom: 0,
              width: size,
              height: size,
              borderRadius: "9999px",
              backgroundColor: color,
              boxShadow: `0 0 ${size * 2}px ${color}`,
              animation: `ember-rise ${duration}s ease-out ${delay}s forwards`,
              ["--drift" as any]: `${drift}px`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function BreakthroughFanfare() {
  const [events, setEvents] = useState<FanfareEvent[]>([]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("global-events")
      .on(
        "broadcast",
        { event: "cultivation_breakthrough" },
        ({ payload }) => {
          const id = `${Date.now()}-${Math.random()}`;

          setEvents((current) => [
            ...current,
            {
              id,
              name: payload.name,
              realmName: payload.realmName,
              path: payload.path,
            },
          ]);

          setTimeout(() => {
            setEvents((current) =>
              current.filter((e) => e.id !== id)
            );
          }, DURATION_MS);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (events.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-4"
      aria-hidden="true"
    >
      {events.map((event) => {
        const color = PATH_COLORS[event.path] ?? "#C9A44C";

        return (
          <div key={event.id} className="relative w-full">
            <Embers color={color} />

            <div
              className="relative mx-auto w-fit rounded-full border px-6 py-3 text-center backdrop-blur-md"
              style={{
                backgroundColor: "color-mix(in srgb, var(--background) 70%, transparent)",
                borderColor: color,
                animation: `fanfare-float ${DURATION_MS}ms ease-in-out forwards`,
              }}
            >
              <p
                className="font-serif text-lg font-semibold"
                style={{ color }}
              >
                {event.name} has broken through
              </p>
              <p className="text-sm opacity-80">
                {event.realmName}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}