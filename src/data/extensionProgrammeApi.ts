import { apiUrl } from './api'
import { restoreSession } from './auth'

export type ExtensionProgrammeValues = Record<string, string>

export interface ExtensionApplication extends Record<string, unknown> {
  id?: number | string
  status?: string
  date_approved?: string | null
}

export interface ExtensionProgrammeDetails {
  eligible: boolean
  sessionsSpent: number
  maxSessions: number
  values: ExtensionProgrammeValues
  existingApplication: ExtensionApplication | null
}

export class ExtensionProgrammeApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const object = (value: unknown): Record<string, unknown> | null => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
const text = (value: unknown) => value == null ? '' : String(value)
const count = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0

async function request(signal: AbortSignal, body?: Record<string, string | null>) {
  const token = restoreSession()
  if (!token) throw new Error('Please sign in again.')
  const response = await fetch(apiUrl('extension-programme'), {
    method: body ? 'POST' : 'GET',
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  let payload: Record<string, unknown>
  try {
    const value: unknown = await response.json()
    if (!object(value)) throw new Error()
    payload = value as Record<string, unknown>
  } catch {
    throw new ExtensionProgrammeApiError('The server returned an invalid programme extension response.', response.status)
  }
  if (!response.ok || payload.success !== true) {
    throw new ExtensionProgrammeApiError(typeof payload.message === 'string' ? payload.message : 'Unable to process the programme extension request.', response.status)
  }
  return payload
}

function mappedValues(source: Record<string, unknown>): ExtensionProgrammeValues {
  return {
    fullName: text(source.name),
    applicationNumber: text(source.numeration),
    matric: text(source.matricno),
    email: text(source.email),
    phone: text(source.telephone),
    faculty: text(source.faculty),
    department: text(source.department),
    degree: text(source.degree),
    modeOfStudy: text(source.mode_of_study),
    session: text(source.sec),
    address: text(source.address),
    sponsor: text(source.sponsor),
    sponsorAddress: text(source.sponsor_address),
    employer: text(source.employer),
    employerAddress: text(source.employer_address),
    reason: text(source.reason),
    commitment: text(source.commitment),
    financePlan: text(source.finance_plan),
  }
}

export async function loadExtensionProgramme(signal: AbortSignal): Promise<ExtensionProgrammeDetails> {
  const payload = await request(signal)
  const prefill = object(payload.prefill)
  if (!prefill) throw new Error('The server returned incomplete programme extension details.')
  const existing = object(payload.existing_application) as ExtensionApplication | null
  return {
    eligible: payload.eligible === true,
    sessionsSpent: count(payload.sessions_spent),
    maxSessions: count(payload.max_sessions),
    values: { ...mappedValues(prefill), ...(existing ? mappedValues({ ...prefill, ...existing }) : {}) },
    existingApplication: existing,
  }
}

export function extensionProgrammePayload(values: ExtensionProgrammeValues) {
  return {
    sec: values.session.trim(),
    matricno: values.matric.trim(),
    address: values.address.trim(),
    email: values.email.trim(),
    telephone: values.phone.trim(),
    sponsor: values.sponsor.trim() || null,
    sponsor_address: values.sponsorAddress.trim() || null,
    employer: values.employer.trim() || null,
    employer_address: values.employerAddress.trim() || null,
    reason: values.reason.trim(),
    commitment: values.commitment.trim(),
    finance_plan: values.financePlan.trim(),
  }
}

export async function submitExtensionProgramme(values: ExtensionProgrammeValues, signal: AbortSignal) {
  const payload = await request(signal, extensionProgrammePayload(values))
  const application = object(payload.data)
  if (!application) throw new Error('The server returned incomplete programme extension application details.')
  return {
    message: typeof payload.message === 'string' ? payload.message : 'Programme extension application submitted successfully.',
    application: application as ExtensionApplication,
  }
}
