import Link from "next/link";

type SectionHeaderProps = {
  title: string;
  icon?: string;

  description?: string;

  href?: string;
  linkText?: string;

  actionHref?: string;
  actionLabel?: string;
};

export default function SectionHeader({
  title,
  icon,
  description,
  href,
  linkText = "View All →",
  actionHref,
  actionLabel,
}: SectionHeaderProps) {
  const finalHref = actionHref ?? href;
  const finalLabel = actionLabel ?? linkText;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">

        <h2 className="flex items-center gap-2 text-3xl font-bold">
          {icon && <span>{icon}</span>}
          {title}
        </h2>

        {finalHref && (
          <Link
            href={finalHref}
            className="opacity-70 hover:opacity-100 transition"
          >
            {finalLabel}
          </Link>
        )}

      </div>

      {description && (
        <p className="mt-4 max-w-3xl text-lg opacity-80">
          {description}
        </p>
      )}
    </div>
  );
}