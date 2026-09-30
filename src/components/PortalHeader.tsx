import { Search } from 'lucide-react'
import { LogOut } from 'lucide-react'
import BrandLockup from './BrandLockup'

interface PortalHeaderProps {
  onLogout: () => void
}

export default function PortalHeader({ onLogout }: PortalHeaderProps) {
  return (
    <header className="sticky top-3 z-30 rounded-2xl border border-white/10 bg-[#0A2B4F] shadow-lg shadow-[#0A2B4F]/25 sm:top-4">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left: Brand Lockup */}
        <BrandLockup
          size={42}
          tone="light"
          withWordmark={true}
        />

        {/* Center: Record History Search */}
        <div className="relative hidden flex-1 max-w-md md:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-3.5 w-3.5 text-white/60" aria-hidden="true" />
          </div>
          <input
            type="search"
            placeholder="Search record history…"
            aria-label="Search record history"
            className="h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-9 pr-3 text-xs text-white placeholder:text-white/60 transition-colors focus:border-[#FFBB00]/60 focus:bg-white/15 focus:outline-none"
          />
        </div>

        {/* Right: Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          aria-label="Log out of the portal"
          className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-white/20 active:scale-95 md:ml-0"
        >
          <LogOut className="h-3.5 w-3.5 text-[#FFBB00]" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  )
}

