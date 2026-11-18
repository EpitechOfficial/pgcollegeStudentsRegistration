import { useEffect, useState } from 'react'
import { Calendar, GraduationCap, User } from 'lucide-react'
import { currentSession, currentStudent } from '../data/portal'
import { isDemoSession } from '../data/auth'
import { loadApplicationApplicant } from '../data/applicationDocuments'

export default function WelcomeBanner({ greeting = true }: { greeting?: boolean }) {
  const Heading = greeting ? 'h1' : 'h2'
  const student = currentStudent()
  const session = currentSession()
  const [passportUrl, setPassportUrl] = useState<string | null>(null)
  const [passportFailed, setPassportFailed] = useState(false)

  useEffect(() => {
    if (isDemoSession()) return
    const controller = new AbortController()
    void loadApplicationApplicant(controller.signal)
      .then((applicant) => {
        if (!controller.signal.aborted) {
          setPassportUrl(applicant.passportPhotoUrl)
          setPassportFailed(false)
        }
      })
      .catch(() => { /* The welcome card keeps its neutral avatar on failure. */ })
    return () => controller.abort()
  }, [])
  return (
    <section
      aria-label="Student overview"
      className="relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        {/* Left: Avatar + Greeting */}
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0A2B4F] text-white shadow-sm ring-4 ring-[#0A2B4F]/10"
          >
            {passportUrl && !passportFailed ? (
              <img
                src={passportUrl}
                alt={`${student.name}'s passport`}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setPassportFailed(true)}
              />
            ) : (
              <User className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <Heading className="text-lg font-bold tracking-tight text-[#212529] sm:text-xl">
              {greeting ? `Welcome, ${student.name}` : student.name}
            </Heading>
            <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
              {[
                ['Faculty', student.faculty],
                ['Department', student.department],
                ['Degree', student.degree],
                ['Programme', student.programme],
                ['Mode of Study', student.modeOfStudy],
              ].map(([label, value]) => (
                <div key={label} className="flex min-w-0 max-w-full flex-wrap items-baseline gap-1.5">
                  <dt className="rounded bg-[#0A2B4F]/5 px-1.5 py-0.5 text-[10px] font-semibold text-[#0A2B4F]">{label}</dt>
                  <dd className="min-w-0 break-words text-[#495057]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Right: Quick Context Badges */}
        <div className="flex shrink-0 flex-wrap items-center gap-2.5 sm:gap-3 xl:max-w-xs xl:justify-end">
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-[#E5E7EB] px-3 py-1.5 text-xs">
            <GraduationCap className="h-3.5 w-3.5 text-[#1B3764]" aria-hidden="true" />
            <span className="font-semibold text-[#212529]">{student.applicationNumber}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A2B4F]/5 border border-[#0A2B4F]/10 px-3 py-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-[#0A2B4F]" aria-hidden="true" />
            <span className="font-semibold text-[#0A2B4F]">{session} Session</span>
          </div>
        </div>
      </div>
    </section>
  )
}
