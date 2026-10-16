"use client";

import { useEffect, useState } from "react";

const KEY = "splash-shown";

export default function AppSplash() {
  const [phase, setPhase] = useState<"show" | "hide" | "gone">("show");

  useEffect(() => {
    if (sessionStorage.getItem(KEY)) {
      const t0 = setTimeout(() => setPhase("gone"), 0);
      return () => clearTimeout(t0);
    }
    const t1 = setTimeout(() => setPhase("hide"), 1600);
    const t2 = setTimeout(() => {
      sessionStorage.setItem(KEY, "1");
      setPhase("gone");
    }, 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className={`app-splash ${phase === "hide" ? "app-splash--hide" : ""}`}
      aria-hidden="true"
    >
      <div className="app-splash__glow" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon/icon-512.png"
        alt=""
        width={220}
        height={220}
        className="app-splash__logo"
      />
      <div className="app-splash__embers">
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            style={{ left: `${12 + i * 10}%`, animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}