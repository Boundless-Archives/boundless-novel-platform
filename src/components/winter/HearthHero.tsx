/*
 * The Winter Realm hero: a cabin on a snowy hillside under a clear night
 * sky. Pure SVG, no images and no hooks, so it is cheap to render. It is
 * only shown while the cozy winter look is on (".hearth-only" in the CSS).
 */

const STARS: [number, number, number][] = [
  [90, 60, 1.6], [180, 120, 1.1], [260, 40, 1.4], [340, 95, 1], [430, 55, 1.5],
  [520, 130, 1], [610, 38, 1.3], [700, 88, 1], [790, 48, 1.6], [880, 118, 1.1],
  [960, 62, 1.4], [1050, 105, 1], [1130, 45, 1.5], [140, 190, 1], [310, 175, 1.2],
  [470, 200, 1], [660, 170, 1.1], [830, 195, 1], [1010, 180, 1.2], [1160, 150, 1],
];

function Pine({ x, y, s, snow = true }: { x: number; y: number; s: number; snow?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-5" y="0" width="10" height="26" fill="#1a1410" />
      <polygon points="0,-150 46,-60 -46,-60" fill="#0f3326" />
      <polygon points="0,-110 58,-14 -58,-14" fill="#124030" />
      <polygon points="0,-62 72,34 -72,34" fill="#164a37" />
      {snow && (
        <>
          <polygon points="0,-150 18,-112 8,-118 0,-108 -9,-118 -18,-112" fill="#e8f0f6" opacity=".92" />
          <polygon points="0,-110 24,-70 10,-78 0,-66 -12,-78 -24,-70" fill="#e8f0f6" opacity=".85" />
          <polygon points="0,-62 30,-26 12,-34 0,-22 -14,-34 -30,-26" fill="#e8f0f6" opacity=".8" />
        </>
      )}
    </g>
  );
}

export default function HearthHero() {
  return (
    <svg
      className="hearth-only hearth-art"
      viewBox="0 0 1200 640"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="hh-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#06141d" />
          <stop offset=".55" stopColor="#12303a" />
          <stop offset="1" stopColor="#3d3a3a" />
        </linearGradient>
        <radialGradient id="hh-moon" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff6dd" stopOpacity=".95" />
          <stop offset=".35" stopColor="#f6e6bd" stopOpacity=".28" />
          <stop offset="1" stopColor="#f6e6bd" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hh-window" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffc15c" stopOpacity=".75" />
          <stop offset="1" stopColor="#ff9a2e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hh-snow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f6f9" />
          <stop offset="1" stopColor="#b9c9da" />
        </linearGradient>
        <linearGradient id="hh-dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset=".7" stopColor="#0a1d28" stopOpacity="0" />
          <stop offset="1" stopColor="#0a1d28" stopOpacity=".6" />
        </linearGradient>
        <linearGradient id="hh-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#06141d" stopOpacity=".55" />
          <stop offset=".6" stopColor="#06141d" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1200" height="640" fill="url(#hh-sky)" />
      {STARS.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#fff4dc" className="hearth-star" style={{ animationDelay: `${(i % 6) * 0.7}s` }} />
      ))}

      <circle cx="820" cy="150" r="140" fill="url(#hh-moon)" />
      <circle cx="820" cy="150" r="46" fill="#fff4d6" />
      <circle cx="804" cy="138" r="9" fill="#efdcae" opacity=".5" />
      <circle cx="836" cy="162" r="6" fill="#efdcae" opacity=".45" />

      <path d="M0 400 L120 300 L210 360 L330 250 L450 350 L540 300 L660 390 L760 290 L880 370 L990 280 L1100 350 L1200 310 V640 H0 Z" fill="#17313d" />
      <path d="M330 250 L360 280 L345 278 L330 292 L312 276 L300 280 Z M990 280 L1020 308 L1004 306 L990 318 L974 304 L960 308 Z M760 290 L786 316 L772 314 L760 326 L746 312 L734 316 Z" fill="#dbe7ef" opacity=".7" />

      <path d="M0 470 Q150 420 300 455 T620 440 T920 458 T1200 430 V640 H0 Z" fill="#0d2a22" />
      <Pine x={70} y={470} s={0.75} />
      <Pine x={150} y={485} s={0.6} />
      <Pine x={1130} y={475} s={0.8} />
      <Pine x={1050} y={490} s={0.6} />
      <Pine x={250} y={500} s={0.5} />
      <Pine x={960} y={505} s={0.5} />

      <path d="M0 520 Q200 490 420 515 T800 505 T1200 500 V640 H0 Z" fill="url(#hh-snow)" />
      <path d="M0 575 Q260 545 520 570 T1200 560 V640 H0 Z" fill="#dfe8f0" />

      <g transform="translate(830 470)">
        <ellipse cx="60" cy="68" rx="150" ry="22" fill="#ffb347" opacity=".18" />
        <rect x="108" y="-38" width="22" height="46" fill="#2a1a12" />
        <rect x="104" y="-42" width="30" height="8" fill="#e8f0f6" />
        <g className="hearth-smoke">
          <circle cx="119" cy="-58" r="9" fill="#cfd8df" opacity=".35" />
          <circle cx="126" cy="-84" r="13" fill="#cfd8df" opacity=".25" />
          <circle cx="116" cy="-114" r="17" fill="#cfd8df" opacity=".16" />
        </g>
        <rect x="0" y="0" width="140" height="70" fill="#3b2418" />
        <g stroke="#2a190f" strokeWidth="2" opacity=".7">
          <line x1="0" y1="14" x2="140" y2="14" /><line x1="0" y1="28" x2="140" y2="28" />
          <line x1="0" y1="42" x2="140" y2="42" /><line x1="0" y1="56" x2="140" y2="56" />
        </g>
        <polygon points="-14,2 70,-52 154,2" fill="#5a2a22" />
        <polygon points="-14,2 70,-52 154,2 146,2 70,-44 -6,2" fill="#e8f0f6" />
        <polygon points="-6,-2 70,-48 146,-2" fill="#f4f8fb" opacity=".92" />
        <g className="hearth-flicker">
          <circle cx="32" cy="34" r="34" fill="url(#hh-window)" />
          <circle cx="108" cy="34" r="34" fill="url(#hh-window)" />
          <rect x="20" y="22" width="24" height="22" fill="#ffc15c" />
          <rect x="96" y="22" width="24" height="22" fill="#ffc15c" />
          <path d="M32 22 V44 M20 33 H44 M108 22 V44 M96 33 H120" stroke="#3b2418" strokeWidth="2" />
        </g>
        <rect x="58" y="30" width="24" height="40" rx="2" fill="#241209" />
        <circle cx="77" cy="52" r="1.8" fill="#e3b04b" />
        <line x1="-34" y1="70" x2="-34" y2="30" stroke="#2a1a12" strokeWidth="4" />
        <circle cx="-34" cy="26" r="16" fill="url(#hh-window)" />
        <circle cx="-34" cy="26" r="4" fill="#ffd27a" className="hearth-flicker" />
      </g>

      <Pine x={640} y={540} s={0.9} />
      <Pine x={560} y={560} s={0.62} />
      <Pine x={40} y={560} s={1.05} />
      <Pine x={1170} y={565} s={1.1} />

      <rect width="1200" height="640" fill="url(#hh-fade)" />
      <rect width="1200" height="640" fill="url(#hh-dusk)" />
    </svg>
  );
}
