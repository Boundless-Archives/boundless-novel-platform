"use client";

import { useEffect, useRef } from "react";

/*
 * A slow, living night sky for dark mode: a thin layer of stars drifting
 * around a distant galactic centre in two loose spiral arms, plus a few
 * warm embers rising like fireflies. It sits on top of the static CSS
 * stars, costs very little, pauses when the tab is hidden, and holds
 * still for people who prefer reduced motion.
 */

type Star = {
  r: number;
  a: number;
  size: number;
  alpha: number;
  phase: number;
  speed: number;
  gold: boolean;
};

type Ember = {
  x: number;
  y: number;
  vy: number;
  sway: number;
  swaySpeed: number;
  phase: number;
  size: number;
};

const ROTATION = 0.006; // radians per second near the centre; slower further out
const FRAME_MS = 1000 / 30;

function makeEmberSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d");
  if (!g) return c;
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,226,150,1)");
  grad.addColorStop(0.25, "rgba(224,176,80,.55)");
  grad.addColorStop(1, "rgba(201,164,76,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return c;
}

export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sprite = makeEmberSprite();
    const root = document.documentElement;

    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let embers: Ember[] = [];
    let raf = 0;
    let last = 0;
    let t = 0;

    const isDark = () => root.classList.contains("dark");

    function build() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const reach = Math.hypot(w, h) * 0.58;
      const count = Math.max(45, Math.min(170, Math.round((w * h) / 9000)));

      stars = Array.from({ length: count }, () => {
        const r = 25 + Math.pow(Math.random(), 0.8) * reach;
        const arm = Math.random() < 0.5 ? 0 : Math.PI;
        const a = arm + Math.log(r) * 1.3 + (Math.random() - 0.5) * 1.1;
        return {
          r,
          a,
          size: 0.7 + Math.random() * 1.3,
          alpha: 0.55 + Math.random() * 0.45,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 1.2,
          gold: Math.random() < 0.18,
        };
      });

      const emberCount = w < 640 ? 8 : 16;
      embers = Array.from({ length: emberCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vy: 5 + Math.random() * 12,
        sway: 6 + Math.random() * 18,
        swaySpeed: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        size: 5 + Math.random() * 9,
      }));
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      if (!isDark()) return;

      const cx = w * 0.5;
      const cy = h * 0.45;

      for (const s of stars) {
        const ang = s.a + t * ROTATION * (1 / Math.sqrt(1 + s.r / 140));
        const x = cx + Math.cos(ang) * s.r;
        const y = cy + Math.sin(ang) * s.r * 0.72;
        if (x < -4 || x > w + 4 || y < -4 || y > h + 4) continue;

        const tw = 0.65 + 0.35 * Math.sin(t * s.speed + s.phase);
        ctx!.globalAlpha = s.alpha * tw;
        ctx!.fillStyle = s.gold ? "#e2c06a" : "#ede8dc";
        ctx!.fillRect(x, y, s.size, s.size);
      }

      for (const e of embers) {
        const x = e.x + Math.sin(t * e.swaySpeed + e.phase) * e.sway;
        const life = 1 - e.y / h; // fades in near the bottom, out near the top
        const fade = Math.min(1, Math.max(0, Math.min(life * 4, (1 - life) * 3)));
        const flick = 0.75 + 0.25 * Math.sin(t * 2.2 + e.phase * 3);
        ctx!.globalAlpha = 0.55 * fade * flick;
        ctx!.drawImage(sprite, x - e.size / 2, e.y - e.size / 2, e.size, e.size);
      }

      ctx!.globalAlpha = 1;
    }

    function step(now: number) {
      raf = requestAnimationFrame(step);
      if (document.hidden || !isDark()) {
        if (!isDark()) ctx!.clearRect(0, 0, w, h);
        last = now;
        return;
      }
      const dt = now - last;
      if (dt < FRAME_MS) return;
      last = now;

      const sec = Math.min(dt, 100) / 1000;
      t += sec;

      for (const e of embers) {
        e.y -= e.vy * sec;
        if (e.y < -20) {
          e.y = h + 10;
          e.x = Math.random() * w;
        }
      }

      draw();
    }

    build();
    draw();

    if (!reduce) raf = requestAnimationFrame(step);

    const onResize = () => {
      build();
      draw();
    };
    window.addEventListener("resize", onResize);

    // Redraw (or clear) when the theme flips.
    const mo = new MutationObserver(draw);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      mo.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  );
}
