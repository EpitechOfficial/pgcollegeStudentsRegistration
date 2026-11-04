import { COURSE_CATALOGUE, currentSession, currentStudent, DEFAULT_SELECTED_CODES, MIN_REGISTRATION_UNITS } from './portal'
import type { CourseOption } from '../types'
import { rememberCourseForm } from './courseForms'
import { isDemoSession } from './auth'
import { courseRequest, courseList, object } from './courseApi'

const key = () => `pgc.course-registration.${currentStudent().applicationNumber}.${currentSession()}`
const lockKey = () => `pgc.info-lock.${currentStudent().applicationNumber}`
export function infoIsLocked() { return sessionStorage.getItem(lockKey()) === '1' }
export function setInfoLocked(locked: boolean) { sessionStorage.setItem(lockKey(), locked ? '1' : '0') }
export interface CourseRegistration {
  session: string
  courses: CourseOption[]
  selectedCodes: string[]
  confirmed: boolean
  locked: boolean
  minimumUnits: number
}
export async function loadCourseRegistration(signal: AbortSignal): Promise<CourseRegistration> {
  if (isDemoSession()) {
    let saved: { codes?: unknown; confirmed?: unknown } | null = null
    try { saved = JSON.parse(localStorage.getItem(key()) || 'null') } catch { /* Ignore invalid optional draft. */ }
    const codes = Array.isArray(saved?.codes) && saved.codes.every((code) => typeof code === 'string') ? saved.codes.filter((code) => COURSE_CATALOGUE.some((course) => course.code === code)) : DEFAULT_SELECTED_CODES
    return { session: currentSession(), courses: COURSE_CATALOGUE, selectedCodes: codes, confirmed: saved?.confirmed === true, locked: infoIsLocked(), minimumUnits: MIN_REGISTRATION_UNITS }
  }
  const [available, registered] = await Promise.all([courseRequest('available', signal), courseRequest('registered', signal)])
  const courses = courseList(available.data)
  const saved = courseList(registered.data)
  const summary = object(registered.summary)
  if (typeof summary.locked !== 'boolean' || typeof summary.session !== 'string' || available.session !== summary.session) throw new Error('Course session information changed. Please reload.')
  for (const course of saved) if (!courses.some((entry) => entry.code === course.code)) courses.push(course)
  setInfoLocked(summary.locked)
  return { session: summary.session, courses, selectedCodes: saved.map((course) => course.code), locked: summary.locked, confirmed: summary.locked, minimumUnits: 0 }
}
export async function saveCourseRegistration(courses: CourseOption[], confirm: boolean, signal: AbortSignal): Promise<void> {
  if (isDemoSession()) {
    if (infoIsLocked()) throw new Error('Student information is locked.')
    localStorage.setItem(key(), JSON.stringify({ codes: courses.map((course) => course.code), confirmed: confirm }))
    if (confirm) { rememberCourseForm(courses); setInfoLocked(true) }
    return
  }
  if (courses.some((course) => !Number.isInteger(course.id) || course.id! <= 0)) throw new Error('A selected course has no valid course ID. Please reload.')
  await courseRequest('register', signal, { course_ids: courses.map((course) => course.id) })
  if (confirm) {
    await confirmCourseRegistration(signal)
  }
}

export async function confirmCourseRegistration(signal: AbortSignal): Promise<void> {
  if (isDemoSession()) {
    const registration = await loadCourseRegistration(signal)
    const courses = registration.courses.filter((course) => registration.selectedCodes.includes(course.code))
    if (!courses.length) throw new Error('No courses registered. Please select courses before confirming.')
    await saveCourseRegistration(courses, true, signal)
  } else {
    await courseRequest('confirm', signal, {})
  }
  setInfoLocked(true)
}

export async function loadCourseLock(signal: AbortSignal): Promise<boolean> {
  if (isDemoSession()) return infoIsLocked()
  const payload = await courseRequest('status', signal)
  const status = object(payload.data)
  if (typeof status.locked !== 'boolean') throw new Error('Invalid registration status.')
  setInfoLocked(status.locked)
  return status.locked
}
