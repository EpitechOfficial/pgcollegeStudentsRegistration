import { COURSE_CATALOGUE, CURRENT_SESSION, DEFAULT_SELECTED_CODES, MIN_REGISTRATION_UNITS, STUDENT } from './portal'
import type { CourseOption } from '../types'
import { rememberCourseForm } from './courseForms'

const key = `pgc.course-registration.${STUDENT.applicationNumber}.${CURRENT_SESSION}`
const lockKey = `pgc.info-lock.${STUDENT.applicationNumber}`
export function infoIsLocked() { return sessionStorage.getItem(lockKey) === '1' }
export function setInfoLocked(locked: boolean) { sessionStorage.setItem(lockKey, locked ? '1' : '0') }
export interface CourseRegistration {
  courses: CourseOption[]
  selectedCodes: string[]
  confirmed: boolean
  locked: boolean
  minimumUnits: number
}
export async function loadCourseRegistration(signal: AbortSignal): Promise<CourseRegistration> {
  const endpoint = import.meta.env.VITE_COURSE_REGISTRATION_URL
  if (!endpoint) {
    let saved: { codes?: unknown; confirmed?: unknown } | null = null
    try { saved = JSON.parse(localStorage.getItem(key) || 'null') } catch { /* Ignore invalid optional draft. */ }
    const codes = Array.isArray(saved?.codes) && saved.codes.every((code) => typeof code === 'string') ? saved.codes.filter((code) => COURSE_CATALOGUE.some((course) => course.code === code)) : DEFAULT_SELECTED_CODES
    return { courses: COURSE_CATALOGUE, selectedCodes: codes, confirmed: saved?.confirmed === true, locked: infoIsLocked(), minimumUnits: MIN_REGISTRATION_UNITS }
  }
  const response = await fetch(endpoint, { signal, credentials: 'include', headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('Unable to load course registration.')
  const payload = await response.json()
  const record = payload?.data ?? payload
  if (!record || !Array.isArray(record.courses) || !record.courses.every((course: CourseOption) => course && typeof course.code === 'string' && typeof course.title === 'string' && ['Required', 'Elective'].includes(course.type) && Number.isInteger(course.units) && course.units > 0) || !Array.isArray(record.selectedCodes) || !record.selectedCodes.every((code: unknown) => typeof code === 'string' && record.courses.some((course: CourseOption) => course.code === code)) || typeof record.confirmed !== 'boolean' || typeof record.locked !== 'boolean' || !Number.isInteger(record.minimumUnits) || record.minimumUnits < 0) throw new Error('Invalid course registration response.')
  return { ...record, locked: record.locked || infoIsLocked() }
}
export async function saveCourseRegistration(courses: CourseOption[], confirm: boolean, signal: AbortSignal): Promise<void> {
  const endpoint = import.meta.env.VITE_COURSE_REGISTRATION_URL
  if (infoIsLocked()) throw new Error('Student information is locked.')
  if (!endpoint) {
    localStorage.setItem(key, JSON.stringify({ codes: courses.map((course) => course.code), confirmed: confirm }))
    if (confirm) rememberCourseForm(courses)
    return
  }
  const response = await fetch(endpoint, { method: confirm ? 'POST' : 'PUT', credentials: 'include', signal, headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ session: CURRENT_SESSION, selectedCodes: courses.map((course) => course.code) }) })
  if (!response.ok) throw new Error('Unable to save course registration. Please try again.')
}
