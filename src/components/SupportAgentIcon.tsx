/**
 * Support-agent mark: a person wearing a headset with mic, drawn in the
 * school's gold palette so it pops on the navy chat launcher.
 */
export default function SupportAgentIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Headset band over the head */}
      <path
        d="M17 34v-5c0-8.837 7.163-16 15-16s15 7.163 15 16v5"
        stroke="#B98400"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      {/* Head */}
      <circle cx="32" cy="31" r="9.5" fill="#FFBB00" />
      {/* Shoulders / torso */}
      <path
        d="M13 56c0-8.837 8.507-16 19-16s19 7.163 19 16v2H13v-2Z"
        fill="#FFBB00"
      />
      {/* Left earcup */}
      <rect x="13.5" y="29" width="7" height="11" rx="3.5" fill="#B98400" />
      {/* Right earcup */}
      <rect x="43.5" y="29" width="7" height="11" rx="3.5" fill="#B98400" />
      {/* Mic boom from left earcup towards the mouth */}
      <path
        d="M17 39.5c0 3.59 2.91 6.5 6.5 6.5h3"
        stroke="#B98400"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Mic tip */}
      <circle cx="28.5" cy="46" r="3" fill="#B98400" />
      {/* Tie */}
      <path
        d="M32 41.5 28 44l2.4 8h3.2L36 44l-4-2.5Z"
        fill="#B98400"
      />
    </svg>
  )
}
