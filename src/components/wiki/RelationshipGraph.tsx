import Link from "next/link";
import { getEntityTypeIcon } from "@/lib/entityTypes";

export type GraphNode = { id: string; name: string; type: string; href: string };
export type GraphEdge = { from: string; to: string; label: string };

const TYPE_COLORS: Record<string, string> = {
  character: "#06b6d4",
  location: "#22c55e",
  faction: "#ef4444",
  item: "#f59e0b",
  event: "#a855f7",
  concept: "#6366f1",
  species: "#ec4899",
  alternate_universe: "#14b8a6",
  alternate_timeline: "#f97316",
};

const SIZE = 800;
const CENTER = SIZE / 2;

function short(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

/*
 * A simple web of how entries connect. Only entries with at least one
 * relationship are drawn, grouped around a ring by type.
 */
export default function RelationshipGraph({
  nodes,
  edges,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const connectedIds = new Set(edges.flatMap((e) => [e.from, e.to]));
  const shown = nodes
    .filter((n) => connectedIds.has(n.id))
    .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));

  if (shown.length < 2) return null;

  const pos = new Map<string, { x: number; y: number }>();
  const outer = shown.length > 14;
  const rings = outer ? [shown.filter((_, i) => i % 2 === 0), shown.filter((_, i) => i % 2 === 1)] : [shown];

  rings.forEach((ring, r) => {
    const radius = outer ? (r === 0 ? 330 : 190) : 290;
    ring.forEach((n, i) => {
      const angle = (i / ring.length) * Math.PI * 2 - Math.PI / 2 + (r === 1 ? Math.PI / ring.length : 0);
      pos.set(n.id, {
        x: CENTER + Math.cos(angle) * radius,
        y: CENTER + Math.sin(angle) * radius,
      });
    });
  });

  // merge parallel edges between the same pair into one line with joined labels
  const merged = new Map<string, { a: string; b: string; labels: string[] }>();
  for (const e of edges) {
    if (!pos.has(e.from) || !pos.has(e.to)) continue;
    const key = [e.from, e.to].sort().join("|");
    const entry = merged.get(key) ?? { a: e.from, b: e.to, labels: [] };
    if (!entry.labels.includes(e.label)) entry.labels.push(e.label);
    merged.set(key, entry);
  }

  const usedTypes = [...new Set(shown.map((n) => n.type))];

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold mb-4">🕸️ Web of Connections</h2>

      <div
        className="rounded-2xl border p-2 sm:p-4"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--card-border)" }}
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto h-auto w-full max-w-3xl" role="img" aria-label="Relationship graph">
          {[...merged.values()].map((e) => {
            const a = pos.get(e.a)!;
            const b = pos.get(e.b)!;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            return (
              <g key={`${e.a}-${e.b}`}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
                <text x={mx} y={my} textAnchor="middle" fontSize="12" fill="currentColor" fillOpacity="0.75"
                  stroke="var(--card)" strokeWidth="4" paintOrder="stroke">
                  {short(e.labels.join(" / "), 26)}
                </text>
              </g>
            );
          })}

          {shown.map((n) => {
            const p = pos.get(n.id)!;
            const color = TYPE_COLORS[n.type] ?? "#64748b";
            return (
              <Link key={n.id} href={n.href}>
                <g className="cursor-pointer">
                  <circle cx={p.x} cy={p.y} r="26" fill={color} fillOpacity="0.18" stroke={color} strokeWidth="2.5" />
                  <text x={p.x} y={p.y + 6} textAnchor="middle" fontSize="18">
                    {getEntityTypeIcon(n.type)}
                  </text>
                  <text x={p.x} y={p.y + 46} textAnchor="middle" fontSize="14" fontWeight="600" fill="currentColor"
                    stroke="var(--card)" strokeWidth="4" paintOrder="stroke">
                    {short(n.name, 16)}
                  </text>
                </g>
              </Link>
            );
          })}
        </svg>

        <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs opacity-70">
          {usedTypes.map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[t] ?? "#64748b" }} />
              {t.replace("_", " ")}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
