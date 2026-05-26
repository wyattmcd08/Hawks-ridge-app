interface Props {
  size?: number
  className?: string
}

// Hawks Ridge emblem — a stylized hawk over a ridge.
export default function Logo({ size = 40, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-label="Hawks Ridge"
    >
      <defs>
        <linearGradient id="hr-red" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#ff5a4d" />
          <stop offset="55%" stopColor="#e11d2a" />
          <stop offset="100%" stopColor="#8b0c16" />
        </linearGradient>
      </defs>
      {/* Hawk wings */}
      <path
        d="M32 14c5 6 11 9 19 9-4 4-9 6-13 6 5 2 9 2 14 1-5 6-12 8-18 7l-2 3-2-3c-6 1-13-1-18-7 5 1 9 1 14-1-4 0-9-2-13-6 8 0 14-3 19-9z"
        fill="url(#hr-red)"
      />
      {/* Ridge line */}
      <path
        d="M8 50l10-12 8 7 6-9 8 11 6-6 10 9"
        stroke="url(#hr-red)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  )
}
