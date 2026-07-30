import { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export default function Container({
  children,
  className = "",
}: ContainerProps) {
  return (
    <main
      className={`
        mx-auto
        w-full
        max-w-7xl
        px-6
        py-8
        ${className}
      `}
    >
      {children}
    </main>
  );
}