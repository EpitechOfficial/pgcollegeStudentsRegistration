import BrandLockup from './BrandLockup'

function Placeholder({ className }: { className: string }) {
  return <div className={`rounded-lg bg-slate-200 motion-safe:animate-pulse ${className}`} />
}

export default function PortalLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="min-h-screen bg-[#F5F7F9] pb-8">
      <span className="sr-only">Loading your portal…</span>
      <div aria-hidden="true">
        <div className="px-3 pt-4 sm:px-5 sm:pt-5">
          <div className="flex h-16 items-center justify-between gap-4 rounded-xl bg-[#0A2B4F] px-4 shadow-lg sm:px-6">
            <BrandLockup size={42} tone="light" withWordmark={true} />
            <div className="h-8 w-20 shrink-0 rounded-xl bg-white/10 motion-safe:animate-pulse" />
          </div>
        </div>
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-1 items-center gap-4">
              <Placeholder className="h-14 w-14 shrink-0 rounded-full" />
              <div className="flex-1 space-y-3">
                <Placeholder className="h-6 w-52 max-w-full" />
                <Placeholder className="h-3 w-80 max-w-full" />
                <Placeholder className="h-3 w-60 max-w-full" />
              </div>
            </div>
            <Placeholder className="h-8 w-40" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Placeholder className="h-4 w-32" />
                <Placeholder className="h-8 w-40" />
                <Placeholder className="h-3 w-24" />
              </div>
            ))}
          </div>
          <div className="space-y-3 pt-2">
            <Placeholder className="h-6 w-40" />
            <Placeholder className="h-3 w-96 max-w-full" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Placeholder className="h-12 w-12 shrink-0" />
                <div className="flex-1 space-y-3">
                  <Placeholder className="h-4 w-32 max-w-full" />
                  <Placeholder className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
