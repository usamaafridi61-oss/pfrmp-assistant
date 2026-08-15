export default function BrandMark({ className = "brand-crest-svg" }) {
  const gradientId = "crestGrad";
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2d8a4e" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill={`url(#${gradientId})`} />
      <path
        d="M20 8c6.5 3.2 9.5 8.2 9.5 14.2 0 5.4-3.8 8.8-9.5 9.8-5.7-1-9.5-4.4-9.5-9.8C10.5 16.2 13.5 11.2 20 8Z"
        fill="#ecfdf5"
        opacity="0.95"
      />
      <path d="M20 12.5v17" stroke="#166534" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 18c-3.2.4-5.4 2-6.6 4.4" stroke="#166534" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M20 15.5c2.8.6 4.8 2 6 4.2" stroke="#166534" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
