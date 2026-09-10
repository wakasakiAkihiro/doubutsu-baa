export function Flower({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <g fill="currentColor">
        <ellipse cx="24" cy="13" rx="8" ry="11" />
        <ellipse cx="34" cy="21" rx="11" ry="8" transform="rotate(-20 34 21)" />
        <ellipse cx="31" cy="34" rx="8" ry="11" transform="rotate(-35 31 34)" />
        <ellipse cx="17" cy="34" rx="8" ry="11" transform="rotate(35 17 34)" />
        <ellipse cx="13" cy="21" rx="11" ry="8" transform="rotate(20 13 21)" />
      </g>
      <circle cx="24" cy="25" r="7" fill="#fff8e9" />
    </svg>
  )
}
export function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      {muted ? (
        <path d="m16 9 5 6m0-6-5 6" />
      ) : (
        <>
          <path d="M15 8a6 6 0 0 1 0 8" />
          <path d="M18 5a10 10 0 0 1 0 14" />
        </>
      )}
    </svg>
  )
}
export function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12h15m-6-6 6 6-6 6" />
    </svg>
  )
}
