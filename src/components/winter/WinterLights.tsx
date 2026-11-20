/*
 * A thin garland of twinkling lights along the very top edge of the page.
 * Pure CSS, ignores the pointer, and hides when the visitor turns winter
 * effects off (html[data-winter="off"], set by the toggle).
 */
const COLORS = ["#e8b84a", "#e4584f", "#5fbf7a", "#8ec9ff", "#e8b84a", "#e089c8"];

export default function WinterLights() {
  return (
    <div className="winter-lights" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          style={{
            background: COLORS[i % COLORS.length],
            color: COLORS[i % COLORS.length],
            animationDelay: `${(i % 7) * 0.45}s`,
          }}
        />
      ))}
    </div>
  );
}
