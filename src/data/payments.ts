import { CURRENT_SESSION, SCHOOL_FEE_ITEMS, STUDENT, currentStudent } from './portal'
import type { ReceiptDetails } from './feeDocument'
import { isDemoSession, restoreSession } from './auth'
import { apiUrl } from './api'

export interface PaymentRecord {
  id: string
  applicationNumber?: string | null
  tellerNumber?: string | null
  cashier?: string | null
  paymentMode?: string | null
  receiptDetails?: ReceiptDetails
  reference: string
  invoiceNumber: string
  receiptNumber: string | null
  feeType: 'school-fees' | 'application-fee' | 'acceptance-fee' | 'other'
  session: string
  paidAt: string | null
  amountCharged: number
  amount: number
  status: 'successful' | 'pending' | 'failed'
  items: { description: string; amount: number }[]
}

// Preview records only; school fee payments match the dashboard's ₦180,000 paid.
// Illustrative instalment allocation for demo receipts. Live receipts use backend items unchanged.
function demoReceiptItems(amount: number, alreadyPaid: number) {
  let chargeStart = 0
  return SCHOOL_FEE_ITEMS.map((item) => {
    const chargeEnd = chargeStart + item.amount
    const paid = Math.max(0, Math.min(chargeEnd, alreadyPaid + amount) - Math.max(chargeStart, alreadyPaid))
    chargeStart = chargeEnd
    return { description: item.description, amount: paid }
  })
}
const DEMO_PAYMENTS: PaymentRecord[] = [
  { id: 'demo-application', reference: '586001', invoiceNumber: '85954001', receiptNumber: 'DEMO-APP-RCP-001', feeType: 'application-fee', session: CURRENT_SESSION, paidAt: '2025-08-04T09:00:00+01:00', amountCharged: 30_000, amount: 30_000, status: 'successful', items: [{ description: 'Application Fee', amount: 30_000 }] },
  { id: 'demo-acceptance', reference: '9555001', invoiceNumber: '85954002', receiptNumber: 'DEMO-ACC-RCP-001', feeType: 'acceptance-fee', session: CURRENT_SESSION, paidAt: '2025-10-10T10:00:00+01:00', amountCharged: 50_000, amount: 50_000, status: 'successful', items: [{ description: 'Acceptance Fee', amount: 50_000 }] },
  { id: 'demo-school-1', reference: '99884001', invoiceNumber: '85954003', receiptNumber: '85954004', feeType: 'school-fees', session: CURRENT_SESSION, paidAt: '2026-01-12T10:00:00+01:00', amountCharged: 221_700, amount: 100_000, status: 'successful', items: demoReceiptItems(100_000, 0) },
  { id: 'demo-school-2', reference: '99884002', invoiceNumber: '85954004', receiptNumber: '85954005', feeType: 'school-fees', session: CURRENT_SESSION, paidAt: '2026-03-09T11:00:00+01:00', amountCharged: 221_700, amount: 80_000, status: 'successful', items: demoReceiptItems(80_000, 100_000) },
]

const object = (value: unknown): Record<string, unknown> | null => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
const text = (...values: unknown[]) => values.find((value) => typeof value === 'string' && value.trim()) as string | undefined
const identifier = (...values: unknown[]) => {
  const value = values.find((item) => (typeof item === 'string' && item.trim()) || (typeof item === 'number' && Number.isFinite(item) && item !== 0))
  return value == null ? undefined : String(value)
}
const amount = (...values: unknown[]) => {
  const value = values.find((item) => (typeof item === 'number' || typeof item === 'string') && String(item).trim() !== '')
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}
const paymentStatus = (value: unknown): PaymentRecord['status'] => {
  const status = String(value ?? '').toLowerCase()
  return ['paid', 'successful', 'success', 'confirmed', '1'].includes(status) ? 'successful' : ['failed', 'declined', 'cancelled'].includes(status) ? 'failed' : 'pending'
}
const paymentFeeType = (value: unknown): PaymentRecord['feeType'] => {
  const type = String(value ?? '').toLowerCase().replaceAll('_', '-').replaceAll(' ', '-')
  return type.includes('acceptance') ? 'acceptance-fee' : type.includes('application') ? 'application-fee' : type.includes('school') || type.includes('tuition') ? 'school-fees' : 'other'
}
function mapPayment(value: unknown, index: number, confirmed = false): PaymentRecord | null {
  const record = object(value)
  if (!record) return null
  const profile = object(record.profile) ?? object(record.student) ?? object(record.biodata) ?? {}
  const rawItems = Array.isArray(record.items) ? record.items : Array.isArray(record.fee_items) ? record.fee_items : Array.isArray(record.line_items) ? record.line_items : []
  const total = amount(record.amount, record.amount_paid, record.total_amount, record.total)
  const items = rawItems.map((entry) => object(entry)).filter((entry): entry is Record<string, unknown> => !!entry).map((entry) => ({ description: text(entry.description, entry.name, entry.fee, entry.cost_item) ?? 'Fee payment', amount: amount(entry.amount, entry.amount_paid, entry.value) })).filter((entry) => entry.amount >= 0)
  const invoiceNumber = identifier(record.invoiceNumber, record.invoice_number, record.invoiceno, record.invoice_no)
  if (!invoiceNumber) return null
  const paidAmount = amount(record.amount_paid, record.amountPaid)
  const paymentDate = text(record.paidAt, record.paid_at, record.date_paid, record.payment_date, record.created_at) ?? null
  const explicitStatus = record.status
  const status = explicitStatus != null
    ? paymentStatus(explicitStatus)
    : confirmed || (paidAmount > 0 && !!paymentDate) || String(record.invoice_flag) === '1' || record.paid === true
      ? 'successful'
      : 'pending'
  const feeType = paymentFeeType(record.feeType ?? record.fee_type ?? record.payment_type ?? 'school_fees')
  const applicationNumber = text(record.applicationNumber, record.application_number, record.appno, record.numeration, profile.application_number, profile.appno, profile.numeration) ?? currentStudent().applicationNumber
  const paidAt = paymentDate
  const reference = identifier(record.reference, record.refno, record.payment_reference, record.teller_no, record.tellerno) ?? invoiceNumber
  const receiptNumber = identifier(record.receiptNumber, record.receipt_number, record.receiptno, record.receipt_no, record.refno) ?? (status === 'successful' ? reference : null)
  const normalizedItems = items.length ? items : total > 0 ? [{ description: feeType === 'school-fees' ? 'School Fee Payment' : feeType === 'acceptance-fee' ? 'Acceptance Fee' : feeType === 'application-fee' ? 'Application Fee' : 'Fee Payment', amount: total }] : []
  return {
    id: String(record.id ?? `${invoiceNumber}-${index}`), applicationNumber, reference, invoiceNumber, receiptNumber, feeType,
    session: text(record.session, record.academic_session) ?? CURRENT_SESSION, paidAt, amountCharged: amount(record.amount_charge, record.amount_charged, record.charge_amount, record.total_amount) || total, amount: total || normalizedItems.reduce((sum, item) => sum + item.amount, 0), status, items: normalizedItems,
    tellerNumber: identifier(record.tellerNumber, record.teller_number, record.tellerno, record.teller_no) ?? null,
    cashier: text(record.cashier, record.cashier_name) ?? null,
    paymentMode: text(record.paymentMode, record.payment_mode, record.mode_of_payment, record.channel) ?? null,
    receiptDetails: { surname: text(profile.surname, record.surname), otherNames: text(profile.other_names, profile.otherNames, record.other_names), applicationNumber, matric: text(profile.matricno, profile.matric, record.matricno), faculty: text(profile.faculty, record.faculty), department: text(profile.department, record.department), degree: text(profile.degree, record.degree), modeOfStudy: text(profile.mode_of_study, record.mode_of_study) },
  }
}

export async function loadPayments(signal: AbortSignal, history = false): Promise<{ source: 'demo' | 'backend'; records: PaymentRecord[] }> {
  if (isDemoSession()) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    signal.throwIfAborted()
    return { source: 'demo', records: DEMO_PAYMENTS.map((record) => ({ ...record, applicationNumber: STUDENT.applicationNumber, tellerNumber: null, cashier: null, paymentMode: 'Online', receiptDetails: { surname: 'Alake', otherNames: 'Emmanuel', applicationNumber: STUDENT.applicationNumber, matric: STUDENT.matric, faculty: STUDENT.faculty, department: STUDENT.department, degree: STUDENT.degree, modeOfStudy: STUDENT.modeOfStudy } })) }
  }
  const token = restoreSession()
  if (!token) throw new Error('Please sign in again.')
  const response = await fetch(apiUrl(history ? 'payments/records' : 'payments/receipts'), { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, signal })
  if (!response.ok) throw new Error('Unable to load payments')
  const payload = await response.json()
  const data = object(payload)?.data ?? payload
  const container = object(data)
  const records = Array.isArray(data) ? data : Array.isArray(container?.receipts) ? container.receipts : Array.isArray(container?.records) ? container.records : Array.isArray(container?.data) ? container.data : null
  if (!records) throw new Error('Invalid payment records')
  return { source: 'backend', records: records.map((record, index) => mapPayment(record, index, !history)).filter((record): record is PaymentRecord => !!record) }
}

export function receiptablePayments(records: PaymentRecord[]): PaymentRecord[] {
  return records.filter((record) => record.feeType === 'school-fees' && record.status === 'successful')
    .sort((left, right) => (right.paidAt ? Date.parse(right.paidAt) : 0) - (left.paidAt ? Date.parse(left.paidAt) : 0))
}
