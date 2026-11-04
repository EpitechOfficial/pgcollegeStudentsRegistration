import { apiUrl } from './api'
import { restoreSession } from './auth'
import type { CourseOption } from '../types'

export async function courseRequest(path: string, signal: AbortSignal, body?: unknown): Promise<Record<string, unknown>> {
  const token = restoreSession()
  if (!token) throw new Error('Please sign in again.')
  const response = await fetch(apiUrl(`courses/${path}`), {
    method: body === undefined ? 'GET' : 'POST',
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  let payload: Record<string, unknown>
  try { payload = object(await response.json()) }
  catch { throw new Error('The server returned an invalid course response. Please try again.') }
  if (!response.ok || payload.success !== true) {
    throw new Error(typeof payload.message === 'string' ? payload.message : 'Unable to complete the course request. Please try again.')
  }
  return payload
}

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid course response.')
  return value as Record<string, unknown>
}
export function courseList(value: unknown): CourseOption[] {
  if (!Array.isArray(value)) throw new Error('Invalid course list.')
  return value.map((entry) => {
    const row = object(entry)
    const type = ({ C: 'Core', E: 'Elective', R: 'Required' } as Record<string, string>)[String(row.type)] ?? row.type
    const units = Number(row.unit)
    const id = row.course_id ?? row.id
    if (typeof row.course_code !== 'string' || typeof row.course_title !== 'string' || !['Required', 'Elective', 'Core'].includes(String(type)) || !Number.isInteger(units) || units < 0) throw new Error('Invalid course details.')
    return { id: id == null ? undefined : Number(id), code: row.course_code, title: row.course_title, units, type: type as CourseOption['type'] }
  })
}
