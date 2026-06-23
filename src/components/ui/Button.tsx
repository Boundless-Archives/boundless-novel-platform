import { ButtonHTMLAttributes } from "react";

type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        border
        rounded
        p-2
        cursor-pointer
        transition
        hover:bg-gray-100
        active:scale-95
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}