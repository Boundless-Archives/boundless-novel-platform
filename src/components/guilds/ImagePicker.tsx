"use client";

import { useRef, useState } from "react";

/*
 * Picks an image, crops and shrinks it in the browser (so uploads stay small
 * and fast), then hands the result to the surrounding form as a normal file.
 */
const SIZES = {
  emblem: { w: 512, h: 512, label: "Emblem", hint: "Square. Shown as a small badge." },
  banner: { w: 1500, h: 500, label: "Banner", hint: "Wide (3:1). Shown across the top of the page." },
} as const;

async function resize(file: File, w: number, h: number): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.max(w / bitmap.width, h / bitmap.height);
  const sw = w / scale;
  const sh = h / scale;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");

  ctx.drawImage(bitmap, (bitmap.width - sw) / 2, (bitmap.height - sh) / 2, sw, sh, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/webp", 0.85)
  );

  return new File([blob], `${Date.now()}.webp`, { type: "image/webp" });
}

export default function ImagePicker({
  name,
  kind,
  currentUrl,
}: {
  name: string;
  kind: keyof typeof SIZES;
  currentUrl?: string | null;
}) {
  const cfg = SIZES[kind];
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image.");
      e.target.value = "";
      return;
    }

    try {
      const small = await resize(file, cfg.w, cfg.h);
      const dt = new DataTransfer();
      dt.items.add(small);
      e.target.files = dt.files;
      setPreview(URL.createObjectURL(small));
      setRemoved(false);
    } catch {
      setError("Couldn't read that image. Try another one.");
      e.target.value = "";
    }
  }

  return (
    <div>
      <p className="font-medium">{cfg.label}</p>
      <p className="text-xs opacity-60">{cfg.hint}</p>

      <div
        className={`mt-2 overflow-hidden border ${
          kind === "emblem" ? "h-24 w-24 rounded-2xl" : "aspect-[3/1] w-full rounded-xl"
        }`}
        style={{ borderColor: "var(--card-border)", backgroundColor: "var(--card)" }}
      >
        {preview && !removed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm opacity-40">No image</div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border px-3 py-1.5"
          style={{ borderColor: "var(--card-border)" }}
        >
          {preview && !removed ? "Change" : "Choose image"}
        </button>

        {(currentUrl || preview) && (
          <label className="flex items-center gap-1.5 opacity-70">
            <input
              type="checkbox"
              name={`${name}Remove`}
              onChange={(e) => setRemoved(e.target.checked)}
            />
            Remove
          </label>
        )}
      </div>

      <input ref={inputRef} type="file" name={name} accept="image/*" onChange={onPick} className="hidden" />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
