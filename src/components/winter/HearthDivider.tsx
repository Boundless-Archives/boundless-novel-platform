/* A small ornamental rule for the winter look: line, snowflake, line. */
export default function HearthDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`hearth-only hearth-divider ${className}`} aria-hidden="true">
      <span />
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17M9 4l3 2.5L15 4M9 20l3-2.5 3 2.5" />
      </svg>
      <span />
    </div>
  );
}
