export default function RefineryIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 220" className={className} preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="skyfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B2B26" stopOpacity="0" />
          <stop offset="100%" stopColor="#06211c" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="220" fill="url(#skyfade)" />
      <g fill="#123832">
        <rect x="20" y="120" width="10" height="90" />
        <rect x="45" y="90" width="14" height="120" />
        <rect x="75" y="140" width="8" height="70" />
        <rect x="100" y="60" width="16" height="150" />
        <rect x="130" y="110" width="10" height="100" />
        <rect x="155" y="80" width="12" height="130" />
        <rect x="185" y="130" width="8" height="80" />
        <rect x="210" y="50" width="18" height="160" />
        <rect x="245" y="100" width="10" height="110" />
        <rect x="270" y="75" width="14" height="135" />
        <rect x="300" y="125" width="8" height="85" />
        <rect x="325" y="95" width="16" height="115" />
        <rect x="355" y="140" width="10" height="70" />
      </g>
      <g fill="#facc15" opacity="0.85">
        <circle cx="25" cy="115" r="2" />
        <circle cx="52" cy="85" r="2" />
        <circle cx="108" cy="55" r="2" />
        <circle cx="161" cy="75" r="2" />
        <circle cx="219" cy="45" r="2" />
        <circle cx="277" cy="70" r="2" />
        <circle cx="333" cy="90" r="2" />
      </g>
    </svg>
  );
}
