import type { ReactNode } from "react";
import type { Cosmetic } from "@/lib/cosmetics";

type Props = {
  /** Picture URL, or leave out to show `fallback`. */
  src?: string | null;
  alt: string;
  /** Width and height in pixels. */
  size: number;
  frame?: Cosmetic | null;
  /** Shown when there is no picture (an initial, an emoji...). */
  fallback?: ReactNode;
  className?: string;
};

/*
 * A round avatar with an optional frame around it. With no frame it
 * looks exactly like a plain round avatar, so it can replace the
 * existing avatar markup anywhere.
 */
export default function FramedAvatar({
  src,
  alt,
  size,
  frame,
  fallback,
  className = "",
}: Props) {
  const ring =
    typeof frame?.style.ring === "string" ? frame.style.ring : null;
  const glow =
    typeof frame?.style.glow === "string" ? frame.style.glow : null;

  const inner = (
    <div
      className="h-full w-full overflow-hidden rounded-full"
      style={{ backgroundColor: "var(--card)" }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center border text-lg font-bold"
          style={{ borderColor: "var(--card-border)" }}
        >
          {fallback}
        </div>
      )}
    </div>
  );

  if (!ring) {
    return (
      <div
        className={`shrink-0 rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        {inner}
      </div>
    );
  }

  // The ring is a gradient behind a slightly smaller picture.
  const thickness = Math.max(2, Math.round(size / 24));

  return (
    <div
      className={`shrink-0 rounded-full ${className}`}
      title={frame?.name}
      style={{
        width: size,
        height: size,
        padding: thickness,
        background: ring,
        boxShadow: glow ? `0 0 ${Math.round(size / 6)}px ${glow}66` : undefined,
      }}
    >
      {inner}
    </div>
  );
}
