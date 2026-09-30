interface BrandLockupProps {
  /** Height of the crest in pixels */
  size?: number
  tone?: 'dark' | 'light'
  withWordmark?: boolean
  tagline?: string
}

export default function BrandLockup({
  size = 52,
  tone = 'dark',
  withWordmark = true,
  tagline,
}: BrandLockupProps) {
  const titleColor = tone === 'dark' ? 'text-navy-900' : 'text-white'
  const subColor = tone === 'dark' ? 'text-royal' : 'text-gold'

  return (
    <span className="flex items-center gap-3">
      <img
        src="/brand/pgc-logo.png"
        alt="Postgraduate College, University of Ibadan crest"
        style={{ height: size, width: size }}
        className="shrink-0 rounded-md bg-white object-contain p-1 shadow-card"
      />
      {withWordmark && (
        <span className="flex flex-col">
          <span className={`text-base font-bold leading-tight ${titleColor}`}>
            The Postgraduate College
          </span>
          <span className={`text-2xs font-semibold uppercase tracking-[0.18em] ${subColor}`}>
            University of Ibadan
          </span>
          {tagline && (
            <span
              className={`mt-0.5 text-xs italic ${
                tone === 'dark' ? 'text-muted' : 'text-navy-100/85'
              }`}
            >
              {tagline}
            </span>
          )}
        </span>
      )}
    </span>
  )
}
