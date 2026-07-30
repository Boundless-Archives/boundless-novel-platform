import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;

  hover?: boolean;

  clickable?: boolean;

  compact?: boolean;

  glass?: boolean;

  outlined?: boolean;

  elevated?: boolean;

  padding?: "none" | "sm" | "md" | "lg";

  className?: string;
};

export default function Card({
  children,

  hover = false,

  clickable = false,

  compact = false,

  glass = false,

  outlined = false,

  elevated = false,

  padding = "md",

  className = "",
}: CardProps) {
  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-8",
  };

  return (
    <div
      className={`
        rounded-2xl

        ${outlined ? "border-2" : "border"}

        ${compact ? "rounded-xl" : ""}

        ${glass ? "backdrop-blur-md" : ""}

        ${elevated ? "shadow-xl" : ""}

        ${hover ? "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" : ""}

        ${clickable ? "cursor-pointer" : ""}

        ${paddings[padding]}

        ${className}
      `}
      style={{
        backgroundColor: glass
          ? "rgba(255,255,255,0.04)"
          : "var(--card)",

        borderColor: "var(--card-border)",
      }}
    >
      {children}
    </div>
  );
}