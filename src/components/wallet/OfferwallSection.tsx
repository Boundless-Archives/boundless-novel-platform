import { ExternalLink } from "lucide-react";
import { CURRENCY_NAME } from "@/lib/currency";

export default function OfferwallSection({
  userId,
}: {
  userId: string;
}) {
  const template = process.env.NEXT_PUBLIC_ADGEM_WALL_URL;

  // Stays invisible until the offerwall is configured.
  if (!template) return null;

  const url = template.replace("{userId}", userId);

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Earn more {CURRENCY_NAME}
        </h2>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs underline underline-offset-4 opacity-70"
        >
          Open in a new tab
          <ExternalLink size={12} />
        </a>
      </div>

      <p className="mb-3 text-sm opacity-70">
        Complete offers from our partners to earn {CURRENCY_NAME}.
        Rewards can take a little while to arrive — you'll get a
        notification when they do.
      </p>

      <iframe
        src={url}
        title="Offerwall"
        loading="lazy"
        className="h-[700px] w-full rounded-xl border"
        style={{ borderColor: "var(--card-border)" }}
      />
    </section>
  );
}