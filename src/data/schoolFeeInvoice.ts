import { apiUrl } from './api'
import { restoreSession } from './auth'
import type { FeeDocument } from './feeDocument'

const object = (value: unknown): Record<string, unknown> | null => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
const string = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined
const number = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export async function generateSchoolFeeInvoice(signal: AbortSignal, staffId?: string): Promise<Omit<FeeDocument, 'kind'>> {
  const token = restoreSession()
  if (!token) throw new Error('Please sign in again.')
  const response = await fetch(apiUrl('invoice/generate'), {
    method: 'POST', signal,
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(staffId ? { staff_id: staffId } : {}),
  })
  let payload: Record<string, unknown> | null = null
  try { payload = object(await response.json()) } catch { /* handled below */ }
  if (!response.ok || payload?.success !== true) throw new Error(string(payload?.message) ?? 'Unable to generate your invoice. Please try again.')
  const data = object(payload.data)
  const student = object(data?.student)
  const lines = Array.isArray(data?.line_items) ? data.line_items : []
  const items = lines.map(object).filter((item): item is Record<string, unknown> => !!item).map((item) => ({ description: string(item.description) ?? '', amount: number(item.amount) ?? -1 })).filter((item) => item.description && item.amount >= 0)
  const reference = string(data?.invoice_number)
  const session = string(data?.invoice_session)
  const createdAt = string(data?.date_requested)
  const charged = number(data?.amount_charge)
  const itemTotal = items.reduce((sum, item) => sum + item.amount, 0)
  if (!reference || !session || !createdAt || !Number.isFinite(Date.parse(createdAt)) || !student || !items.length || charged === null || Math.abs(itemTotal - charged) > 0.01) throw new Error('The server returned incomplete invoice details. Please try again.')
  return {
    reference, session, createdAt, items,
    receiptDetails: {
      applicationNumber: string(student.numeration),
      fullName: string(student.name),
      faculty: string(student.faculty), department: string(student.department), degree: string(student.degree),
      modeOfStudy: string(student.mode_of_study), programme: string(student.programme),
    },
  }
}
