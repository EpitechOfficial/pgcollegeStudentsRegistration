import { Calendar, GraduationCap, User } from 'lucide-react'
import { CURRENT_SESSION, STUDENT } from '../data/portal'

export default function WelcomeBanner() {
  return (
    <section
      aria-label="Student overview"
      className="relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Avatar + Greeting */}
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-[#0A2B4F] text-white shadow-sm ring-4 ring-[#0A2B4F]/10"
            aria-hidden="true"
          >
            <User className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#212529] sm:text-xl">
              Welcome, {STUDENT.name.split(' ')[0]}
            </h1>
            <p className="mt-0.5 text-xs text-[#495057]">
              {STUDENT.programme} • {STUDENT.faculty}
            </p>
          </div>
        </div>

        {/* Right: Quick Context Badges */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-[#E5E7EB] px-3 py-1.5 text-xs">
            <GraduationCap className="h-3.5 w-3.5 text-[#1B3764]" aria-hidden="true" />
            <span className="font-semibold text-[#212529]">{STUDENT.matric}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A2B4F]/5 border border-[#0A2B4F]/10 px-3 py-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-[#0A2B4F]" aria-hidden="true" />
            <span className="font-semibold text-[#0A2B4F]">{CURRENT_SESSION} Session</span>
          </div>
        </div>
      </div>
    </section>
  )
}
