"use client";

/* A submit button that asks "are you sure?" first (used inside a server-action form). */
export default function ConfirmButton({
  children,
  message,
  className = "text-sm opacity-60 transition hover:opacity-100",
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
