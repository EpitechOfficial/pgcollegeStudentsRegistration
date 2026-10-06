import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  CircleCheck,
  CircleCheckBig,
  Printer,
  Save,
  Search,
} from 'lucide-react'
import PortalHeader from '../components/PortalHeader'
import PortalFooter from '../components/PortalFooter'
import SupportChat from '../components/SupportChat'
import { signOut } from '../data/auth'
import {
  COLLEGE,
  COURSE_CATALOGUE,
  CURRENT_SESSION,
  DEFAULT_SELECTED_CODES,
  STUDENT,
} from '../data/portal'
import type { CourseType } from '../types'

type TypeFilter = 'All' | CourseType

const TYPE_FILTERS: TypeFilter[] = ['All', 'Required', 'Elective']

export default function RegisterCoursesPage() {
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All')
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(DEFAULT_SELECTED_CODES),
  )
  const [confirmed, setConfirmed] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const feedbackTimer = useRef<number | null>(null)

  // Clear the feedback timer if the page unmounts mid-notification
  useEffect(() => {
    return () => {
      if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current)
    }
  }, [])

  const showFeedback = useCallback((message: string) => {
    setFeedback(message)
    if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current)
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 3000)
  }, [])

  const visibleCourses = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return COURSE_CATALOGUE.filter((course) => {
      const matchesType = typeFilter === 'All' || course.type === typeFilter
      const matchesQuery =
        needle.length === 0 ||
        course.code.toLowerCase().includes(needle) ||
        course.title.toLowerCase().includes(needle)
      return matchesType && matchesQuery
    })
  }, [query, typeFilter])

  const selectedCourses = useMemo(
    () => COURSE_CATALOGUE.filter((course) => selected.has(course.code)),
    [selected],
  )
  const totalUnits = selectedCourses.reduce((sum, course) => sum + course.units, 0)

  /** Toggling invalidates a previous confirmation — the selection changed. */
  const toggleCourse = useCallback((code: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
    setConfirmed(false)
  }, [])

  const handleConfirm = useCallback(() => {
    if (selectedCourses.length === 0) {
      showFeedback('Select at least one course before confirming.')
      return
    }
    setConfirmed(true)
    showFeedback(`Course selection confirmed for ${CURRENT_SESSION}.`)
  }, [selectedCourses.length, showFeedback])

  const handleSaveDraft = useCallback(() => {
    showFeedback('Draft saved on this device.')
  }, [showFeedback])

  const handlePrint = useCallback(() => {
    showFeedback('Preparing the course form preview…')
    window.print()
  }, [showFeedback])

  const handleLogout = useCallback(() => {
    signOut()
    navigate('/', { replace: true })
  }, [navigate])

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9]">
      {/* Top Header - No Sidebar */}
      <div className="px-3 pt-4 sm:px-5 sm:pt-5">
        <PortalHeader onLogout={handleLogout} />
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Back to the dashboard */}
        <Link
          to="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#495057] transition-colors hover:text-[#0A2B4F]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to dashboard
        </Link>

        {/* Page header — title/subtitle left, status chip right */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#212529] sm:text-3xl">
              Course registration
            </h1>
            <p className="mt-1 text-sm text-[#495057]">
              Review the course catalogue and confirm your selection.
            </p>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
              confirmed
                ? 'border-[#0A2B4F]/15 bg-[#0A2B4F]/5 text-[#0A2B4F]'
                : 'border-[#E5E7EB] bg-white text-[#495057]'
            }`}
          >
            {confirmed ? (
              <CircleCheck className="h-3.5 w-3.5 text-[#0A2B4F]" aria-hidden="true" />
            ) : (
              <span
                className="h-2 w-2 rounded-full border border-[#6C757D]"
                aria-hidden="true"
              />
            )}
            {confirmed ? 'Selection confirmed' : 'Not yet confirmed'}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6">
          {/* ==================== Available courses ==================== */}
          <section
            aria-label="Available courses"
            className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm"
          >
            <div className="flex flex-col gap-3 border-b border-[#E5E7EB] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <h2 className="text-base font-bold text-[#212529]">Available courses</h2>

              <div className="relative sm:w-64">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-3.5 w-3.5 text-[#6C757D]" aria-hidden="true" />
                </div>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search courses"
                  aria-label="Search courses"
                  className="h-10 w-full rounded-xl border border-[#E5E7EB] bg-white pl-9 pr-3 text-xs text-[#212529] transition-colors placeholder:text-[#6C757D] focus:border-[#0A2B4F] focus:outline-none focus:ring-2 focus:ring-[#0A2B4F]/15"
                />
              </div>
            </div>

            {/* Toolbar — type filter + result count */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] px-4 py-3 sm:px-5">
              <label
                htmlFor="course-type-filter"
                className="text-xs font-medium text-[#495057]"
              >
                Show courses
              </label>
              <select
                id="course-type-filter"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
                className="rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#212529] transition-colors focus:border-[#0A2B4F] focus:outline-none focus:ring-2 focus:ring-[#0A2B4F]/15"
              >
                {TYPE_FILTERS.map((filter) => (
                  <option key={filter} value={filter}>
                    {filter}
                  </option>
                ))}
              </select>
              <span className="text-xs text-[#6C757D]">
                {visibleCourses.length} {visibleCourses.length === 1 ? 'course' : 'courses'} found
              </span>
            </div>

            {/* Course table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 text-2xs uppercase tracking-wide text-[#495057]">
                    <th scope="col" className="w-16 px-4 py-3 font-semibold sm:px-5">
                      Select
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Code
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Course title
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Type
                    </th>
                    <th scope="col" className="w-20 px-4 py-3 text-right font-semibold sm:px-5">
                      Units
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCourses.map((course) => {
                    const isSelected = selected.has(course.code)
                    return (
                      <tr
                        key={course.code}
                        className={`border-t border-[#E5E7EB]/70 transition-colors ${
                          isSelected ? 'bg-[#0A2B4F]/[0.03]' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="px-4 py-3 sm:px-5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCourse(course.code)}
                            aria-label={`Select ${course.code} ${course.title}`}
                            className="h-4 w-4 cursor-pointer rounded border-[#CCCCCC] text-[#0A2B4F] focus:ring-2 focus:ring-[#0A2B4F]/25"
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-[#212529]">
                          {course.code}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#212529]">{course.title}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-md px-1.5 py-0.5 text-2xs font-semibold ${
                              course.type === 'Required'
                                ? 'bg-[#0A2B4F]/5 text-[#0A2B4F]'
                                : 'bg-[#FFBB00]/15 text-[#B98400]'
                            }`}
                          >
                            {course.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-[#212529] sm:px-5">
                          {course.units}
                        </td>
                      </tr>
                    )
                  })}

                  {visibleCourses.length === 0 && (
                    <tr className="border-t border-[#E5E7EB]/70">
                      <td colSpan={5} className="px-5 py-10 text-center">
                        <BookOpen
                          className="mx-auto h-6 w-6 text-[#6C757D]"
                          aria-hidden="true"
                        />
                        <p className="mt-2 text-xs font-medium text-[#495057]">
                          No courses match your search.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ==================== Your selection ==================== */}
          <section
            aria-label="Your selection"
            className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm"
          >
            <div className="border-b border-[#E5E7EB] p-4 sm:p-5">
              <h2 className="text-base font-bold text-[#212529]">Your selection</h2>
            </div>

            {/* Stats */}
            <div className="flex items-start gap-10 px-4 py-5 sm:px-5">
              <div>
                <p className="text-2xl font-bold tracking-tight text-[#212529]">
                  {selectedCourses.length}
                </p>
                <p className="mt-0.5 text-2xs font-medium uppercase tracking-wide text-[#6C757D]">
                  Courses
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-[#212529]">{totalUnits}</p>
                <p className="mt-0.5 text-2xs font-medium uppercase tracking-wide text-[#6C757D]">
                  Total units
                </p>
              </div>
            </div>

            {/* Chosen courses */}
            <ul className="border-t border-[#E5E7EB]">
              {selectedCourses.map((course) => (
                <li
                  key={course.code}
                  className="flex items-center justify-between gap-3 border-b border-[#E5E7EB]/70 px-4 py-3.5 sm:px-5"
                >
                  <span className="text-xs font-semibold text-[#212529]">{course.code}</span>
                  <button
                    type="button"
                    onClick={() => toggleCourse(course.code)}
                    aria-label={`Remove ${course.code} ${course.title}`}
                    className="text-xs font-medium text-[#495057] transition-colors hover:text-red-600"
                  >
                    Remove
                  </button>
                </li>
              ))}

              {selectedCourses.length === 0 && (
                <li className="px-4 py-8 text-center text-xs text-[#6C757D] sm:px-5">
                  No courses selected yet.
                </li>
              )}
            </ul>

            {/* Actions */}
            <div className="space-y-2.5 p-4 sm:p-5">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={selectedCourses.length === 0}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0A2B4F] text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#12335A] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CircleCheckBig className="h-4 w-4 text-[#FFBB00]" aria-hidden="true" />
                Confirm selection
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#212529] transition-colors hover:border-[#0A2B4F]/30 hover:bg-slate-50"
              >
                <Save className="h-4 w-4 text-[#1B3764]" aria-hidden="true" />
                Save draft
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#212529] transition-colors hover:border-[#0A2B4F]/30 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4 text-[#1B3764]" aria-hidden="true" />
                Print course form
              </button>

              <p className="pt-1 text-2xs leading-relaxed text-[#6C757D]">
                Printed output is a preview, not an official registration form.
              </p>
            </div>
          </section>
        </div>

        {/* Session footer line — mirrors the reference */}
        <div className="mt-8 flex flex-col gap-1 border-t border-[#E5E7EB] pt-4 text-xs text-[#6C757D] sm:flex-row sm:items-center sm:justify-between">
          <span>
            {COLLEGE.shortName}, {COLLEGE.university}
          </span>
          <span>
            Student registration · {CURRENT_SESSION} · {STUDENT.matric}
          </span>
        </div>
      </main>

      {/* Clean Footer */}
      <PortalFooter />

      {/* Floating support chat — Information Unit */}
      <SupportChat />

      {/* Feedback toast (confirm / save / print) */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
      >
        {feedback && (
          <div className="flex items-center gap-2 rounded-xl bg-[#0A2B4F] px-4 py-3 text-xs font-semibold text-white shadow-2xl">
            <CircleCheck className="h-4 w-4 text-[#FFBB00]" aria-hidden="true" />
            <span>{feedback}</span>
          </div>
        )}
      </div>
    </div>
  )
}
