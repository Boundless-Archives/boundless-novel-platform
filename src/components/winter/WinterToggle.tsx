"use client";

import { useEffect, useState } from "react";

/* Lets anyone switch the whole winter look (colours, scenery, snow, lights) off and back on. */
export default function WinterToggle({ className = "" }: { className?: string }) {
  const [off, setOff] = useState(false);

  useEffect(() => {
    const read = () => setOff(document.documentElement.dataset.winter === "off");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-winter"],
    });
    return () => mo.disconnect();
  }, []);

  function toggle() {
    const root = document.documentElement;
    const next = !off;
    if (next) root.dataset.winter = "off";
    else delete root.dataset.winter;
    try {
      localStorage.setItem("winter-off", next ? "1" : "0");
    } catch {
      /* storage unavailable: the choice just lasts for this visit */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`winter-toggle text-xs underline underline-offset-4 opacity-70 hover:opacity-100 ${className}`}
    >
      {off ? "🕯️ Bring back the winter look" : "Switch to the classic look"}
    </button>
  );
}
