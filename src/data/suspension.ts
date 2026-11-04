import { apiUrl } from './api'
import { restoreSession } from './auth'

export type SuspensionValues = Record<string, string>

export class SuspensionApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// Only fields documented by the suspension API are submitted.
export function suspensionPayload(values: SuspensionValues) {
  const period = ({ '1': '1 Semester', '2': '2 Semesters' } as Record<string, string>)[values.period] ?? values.period
  if (!['1 Semester', '2 Semesters'].includes(period)) throw new Error('Select a suspension period.')
  return {
    matricno: values.matric?.trim() ?? '',
    sec: values.session?.trim() ?? '',
    address: values.address?.trim() ?? '',
    sem_completed: values.semesters?.trim() ?? '',
    reason_suspension: values.reason?.trim() ?? '',
    susp_period: period,
    resumption: values.resume?.trim() ?? '',
    sponsor: values.sponsor?.trim() ?? '',
    sponsor_telno: values.sponsorPhone?.trim() ?? '',
    sponsor_email: values.sponsorEmail?.trim() ?? '',
    sponsor_address: values.sponsorAddress?.trim() ?? '',
    ...(values.employer !== undefined ? { employer: values.employer.trim(), employer_address: values.employerAddress?.trim() ?? '', employer_email: values.employerEmail?.trim() ?? '', employer_telno: values.employerPhone?.trim() ?? '' } : {}),
  }
}

async function requestSuspension(signal: AbortSignal, method = 'GET', body?: Record<string, string>): Promise<Record<string, unknown>> {
  const token = restoreSession()
  if (!token) throw new Error('Please sign in again.')
  const response = await fetch(apiUrl('suspension'), {
    method,
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
    headers: {
      Accept: 'application/json', Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  let payload: Record<string, unknown>
  try {
    const value: unknown = await response.json()
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error()
    payload = value as Record<string, unknown>
  } catch {
    throw new SuspensionApiError('The server returned an invalid suspension response. Please try again.', response.status)
  }
  if (!response.ok || payload.success !== true) {
    throw new SuspensionApiError(typeof payload.message === 'string' ? payload.message : 'Unable to complete the suspension request. Please try again.', response.status)
  }
  return payload
}

export function suspensionRecord(payload: Record<string, unknown>) {
  const object = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid suspension response.')
    return value as Record<string, unknown>
  }
  const profile = object(payload.profile)
  const record = payload.suspension === null ? null : object(payload.suspension)
  const text = (value: unknown) => value == null ? '' : String(value)
  const values: SuspensionValues = {
    fullName: text(profile.name), applicationNumber: text(profile.numeration),
    matric: text(profile.matricno), faculty: text(profile.faculty), department: text(profile.department),
    degree: text(profile.degree), modeOfStudy: text(profile.mode_of_study), firstRegistration: text(profile.first_reg_session),
  }
  const fields: Record<string, string> = { matric: 'matricno', session: 'sec', address: 'address', semesters: 'sem_completed', reason: 'reason_suspension', period: 'susp_period', resume: 'resumption', sponsor: 'sponsor', sponsorPhone: 'sponsor_telno', sponsorEmail: 'sponsor_email', sponsorAddress: 'sponsor_address', employer: 'employer', employerPhone: 'employer_telno', employerEmail: 'employer_email', employerAddress: 'employer_address' }
  for (const [key, field] of Object.entries(fields)) {
    if (record && field in record) values[key] = text(record[field])
  }
  if (values.period === '1 Semester') values.period = '1'
  if (values.period === '2 Semesters') values.period = '2'
  const status = record ? text(record.status).trim().toLowerCase() : ''
  return { values, exists: record !== null, status, locked: record !== null && (status !== 'pending' || !!record.date_approved || record.reactivated === true), approvedDate: text(record?.date_approved) }
}

export async function loadSuspension(signal: AbortSignal) {
  return suspensionRecord(await requestSuspension(signal))
}

export function submitSuspension(values: SuspensionValues, signal: AbortSignal) {
  return requestSuspension(signal, 'POST', suspensionPayload(values))
}

export function updateSuspension(values: SuspensionValues, signal: AbortSignal, previous?: SuspensionValues) {
  const payload = suspensionPayload(values)
  const before = previous ? suspensionPayload(previous) : null
  const changes = before ? Object.fromEntries(Object.entries(payload).filter(([key, value]) => before[key as keyof typeof before] !== value)) : payload
  return requestSuspension(signal, 'PUT', changes)
}
