"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, Share, X } from "lucide-react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Stored = {
  visits: number;
  dismissals: number;
  snoozeUntil: number;
  installed: boolean;
};

const STORE_KEY = "install-prompt-v1";
const SESSION_KEY = "install-prompt-session";
const MIN_VISITS = 2; // don't show on the first visit
const DELAY_MS = 20_000; // wait this long before showing
const SNOOZE_DAYS = 14; // hidden this long after a dismissal
const MAX_DISMISSALS = 3; // then never ask again
const HIDE_ON = ["/auth", "/chapter", "/editor"]; // never interrupt these pages

function read(): Stored {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { visits: 0, dismissals: 0, snoozeUntil: 0, installed: false };
}

function write(s: Stored) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {}
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  const ua = navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export default function InstallPrompt() {
  const pathname = usePathname();
  const [mode, setMode] = useState<"native" | "ios" | null>(null);
  const [visible, setVisible] = useState(false);
  const deferred = useRef<InstallEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;

    // count one visit per browser session
    if (!sessionStorage.getItem(SESSION_KEY)) {
      const s = read();
      write({ ...s, visits: s.visits + 1 });
      sessionStorage.setItem(SESSION_KEY, "1");
    }

    const eligible = () => {
      const s = read();
      return (
        !s.installed &&
        s.dismissals < MAX_DISMISSALS &&
        Date.now() >= s.snoozeUntil &&
        s.visits >= MIN_VISITS
      );
    };

    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = (kind: "native" | "ios") => {
      if (!eligible()) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        setMode(kind);
        setVisible(true);
      }, DELAY_MS);
    };

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferred.current = e as InstallEvent;
      schedule("native");
    };

    const onInstalled = () => {
      write({ ...read(), installed: true });
      deferred.current = null;
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    if (isIOS()) schedule("ios");

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    const s = read();
    write({
      ...s,
      dismissals: s.dismissals + 1,
      snoozeUntil: Date.now() + SNOOZE_DAYS * 86_400_000,
    });
    setVisible(false);
  };

  const install = async () => {
    const evt = deferred.current;
    if (!evt) return;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    deferred.current = null;
    if (outcome === "accepted") {
      write({ ...read(), installed: true });
      setVisible(false);
    } else {
      dismiss();
    }
  };

  if (!visible || !mode || HIDE_ON.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Install Boundless"
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+4.25rem)] z-50 mx-auto max-w-md rounded-xl border border-card-border bg-card p-3 text-foreground shadow-lg md:bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {mode === "ios" ? <Share size={20} /> : <Download size={20} />}
        </div>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium">Install Boundless</p>
          {mode === "ios" ? (
            <p className="opacity-75">
              Tap the Share button, then “Add to Home Screen” for one-tap access.
            </p>
          ) : (
            <p className="opacity-75">
              Add it to your home screen for faster, full-screen reading.
            </p>
          )}
          {mode === "native" && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={install}
                className="rounded-md bg-button px-3 py-1.5 text-xs font-medium text-button-text"
              >
                Install
              </button>
              <button onClick={dismiss} className="px-2 py-1.5 text-xs opacity-70">
                Not now
              </button>
            </div>
          )}
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 opacity-60">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}