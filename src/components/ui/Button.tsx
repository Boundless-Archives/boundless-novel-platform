import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger";

type ButtonSize =
  | "sm"
  | "md"
  | "lg";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    `
    inline-flex
    items-center
    justify-center
    rounded-xl
    font-semibold
    transition-all
    duration-200
    hover:-translate-y-0.5
    active:scale-[0.98]
    disabled:opacity-50
    disabled:pointer-events-none
    `;

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-3 text-base",
    lg: "px-7 py-4 text-lg",
  };

  const variants = {
    primary: `
      text-[var(--button-text)]
      bg-[var(--button)]
      hover:brightness-110
    `,

    secondary: `
      border
      border-[var(--card-border)]
      bg-[var(--card)]
      hover:bg-[var(--background)]
    `,

    ghost: `
      hover:bg-[var(--card)]
    `,

    danger: `
      bg-red-600
      text-white
      hover:bg-red-700
    `,
  };

  const classes = `
    ${base}
    ${sizes[size]}
    ${variants[variant]}
    ${fullWidth ? "w-full" : ""}
    ${className}
  `;

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}