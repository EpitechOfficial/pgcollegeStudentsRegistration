import { apiUrl } from './api'
import { restoreSession } from './auth'
import type { ReactivationValues } from './reactivation'

export class ReactivationApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function reactivationPayload(values: ReactivationValues) {
  if (!['suspended', 'lapsed'].includes(values.kind)) throw new Error('Select a reactivation type.')
  const semesters = Number(values.semesters)
  if (!values.semesters?.trim() || !Number.isInteger(semesters) || semesters < 0) throw new Error('Enter a whole number of semesters completed.')
  const mode = values.modeOfStudy?.trim().toLowerCase().replace(/[\s-]+/g, '')
  if (!['fulltime', 'parttime'].includes(mode)) throw new Error('Select a mode of study.')
  return {
    reactivation_type: values.kind === 'lapsed' ? 'Lapsed Registration' : 'Suspended Registration',
    session: values.session?.trim() ?? '',
    matricno: values.matric?.trim() ?? '',
    address: values.address?.trim() ?? '',
    email: values.email?.trim() ?? '',
    telephone: values.phone?.trim() ?? '',
    sponsor_details: values.sponsor?.trim() || null,
    employer_details: values.employer?.trim() || null,
    date_first_reg: values.firstRegistration?.trim() ?? '',
    date_last_reg: values.lastRegistration?.trim() ?? '',
    sem_completed: semesters,
    susp_period: values.kind === 'lapsed' ? `${values.missedSessions?.trim() ?? ''} ${values.missedSessions?.trim() === '1' ? 'Session' : 'Sessions'}`.trim() : values.suspensionDuration?.trim() ?? '',
    mode_of_study: mode === 'fulltime' ? 'Full-time' : 'Part-time',
    commitment: values.ready?.trim() ?? '',
    finance_plan: values.kind === 'suspended' ? values.finance?.trim() ?? '' : null,
  }
}
export const suspendedReactivationPayload = reactivationPayload

async function requestReactivation(signal: AbortSignal, body?: ReturnType<typeof reactivationPayload>): Promise<Record<string, unknown>> {
  const token = restoreSession()
  if (!token) throw new Error('Please sign in again.')
  const response = await fetch(apiUrl('reactivation'), {
    method: body ? 'POST' : 'GET',
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  let payload: Record<string, unknown>
  try {
    const result: unknown = await response.json()
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error()
    payload = result as Record<string, unknown>
  } catch {
    throw new ReactivationApiError('The server returned an invalid reactivation response. Please try again.', response.status)
  }
  if (!response.ok || payload.success !== true) throw new ReactivationApiError(typeof payload.message === 'string' ? payload.message : 'Unable to prepare the reactivation form. Please try again.', response.status)
  return payload
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('The server returned incomplete reactivation details.')
  return value as Record<string, unknown>
}

const fields: Record<string, string> = {
  name: 'fullName', numeration: 'applicationNumber', matricno: 'matric', email: 'email', telephone: 'phone',
  faculty: 'faculty', department: 'department', degree: 'degree', mode_of_study: 'modeOfStudy',
  session: 'session', address: 'address', date_first_reg: 'firstRegistration', date_last_reg: 'lastRegistration',
  sem_completed: 'semesters', susp_period: 'suspensionDuration', sponsor_details: 'sponsor', employer_details: 'employer',
  commitment: 'ready', finance_plan: 'finance',
}

export function reactivationValues(record: Record<string, unknown>): ReactivationValues {
  const values: ReactivationValues = {}
  for (const [source, target] of Object.entries(fields)) {
    if (!(source in record)) continue
    const value = record[source]
    if (value != null && typeof value !== 'string' && typeof value !== 'number') throw new Error('Invalid reactivation form field.')
    values[target] = value == null ? '' : String(value)
  }
  if (values.modeOfStudy) {
    const mode = values.modeOfStudy.toLowerCase().replace(/[\s-]+/g, '')
    if (mode === 'fulltime') values.modeOfStudy = 'Full-time'
    if (mode === 'parttime') values.modeOfStudy = 'Part-time'
  }
  if (values.semesters?.trim().toLowerCase() === 'nil') values.semesters = '0'
  return values
}

export async function loadReactivation(signal: AbortSignal) {
  const payload = await requestReactivation(signal)
  const prefill = object(payload.prefill)
  const values = reactivationValues(prefill)
  const joined = (name: string) => [prefill[name], prefill[`${name}_address`]].filter(value => typeof value === 'string' && value.trim()).join('\n')
  values.sponsor = joined('sponsor'); values.employer = joined('employer')
  values.kind = 'suspended'
  const status = payload.suspension_status == null ? null : object(payload.suspension_status)
  return { values, status: typeof status?.status === 'string' ? status.status : '', reactivated: status?.reactivated === true }
}

export async function generateReactivation(values: ReactivationValues, signal: AbortSignal) {
  const payload = await requestReactivation(signal, reactivationPayload(values))
  const data = object(payload.form_data)
  const requiredFields = Object.keys(fields).filter(field => field !== 'numeration')
  const expectedType = values.kind === 'lapsed' ? 'Lapsed Registration' : 'Suspended Registration'
  if (data.reactivation_type !== expectedType || requiredFields.some(field => !(field in data))) {
    throw new Error('The server returned incomplete form_data. Please try again.')
  }
  const mapped = reactivationValues(data)
  if (values.kind === 'lapsed') mapped.missedSessions = String(data.susp_period ?? '').match(/\d+/)?.[0] ?? values.missedSessions ?? ''
  return { applicationNumber: values.applicationNumber ?? '', ...mapped, kind: values.kind }
}
export const generateSuspendedReactivation = generateReactivation
