import { ReactNode } from "react";

type SectionProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function Section({
  title,
  action,
  children,
  className = "",
}: SectionProps) {
  return (
    <section className={`mb-16 ${className}`}>

      <div className="mb-8 flex items-center justify-between">

        <h2 className="text-4xl font-bold">
          {title}
        </h2>

        {action}

      </div>

      {children}

    </section>
  );
}