import { CURRENT_SESSION, SCHOOL_FEE_ITEMS, STUDENT } from './portal'
import type { ReceiptDetails } from './feeDocument'

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
  { id: 'demo-application', reference: '586001', invoiceNumber: '85954001', receiptNumber: 'DEMO-APP-RCP-001', feeType: 'application-fee', session: CURRENT_SESSION, paidAt: '2025-08-04T09:00:00+01:00', amount: 30_000, status: 'successful', items: [{ description: 'Application Fee', amount: 30_000 }] },
  { id: 'demo-acceptance', reference: '9555001', invoiceNumber: '85954002', receiptNumber: 'DEMO-ACC-RCP-001', feeType: 'acceptance-fee', session: CURRENT_SESSION, paidAt: '2025-10-10T10:00:00+01:00', amount: 50_000, status: 'successful', items: [{ description: 'Acceptance Fee', amount: 50_000 }] },
  { id: 'demo-school-1', reference: '99884001', invoiceNumber: '85954003', receiptNumber: '85954004', feeType: 'school-fees', session: CURRENT_SESSION, paidAt: '2026-01-12T10:00:00+01:00', amount: 100_000, status: 'successful', items: demoReceiptItems(100_000, 0) },
  { id: 'demo-school-2', reference: '99884002', invoiceNumber: '85954004', receiptNumber: '85954005', feeType: 'school-fees', session: CURRENT_SESSION, paidAt: '2026-03-09T11:00:00+01:00', amount: 80_000, status: 'successful', items: demoReceiptItems(80_000, 100_000) },
]

export async function loadPayments(signal: AbortSignal): Promise<{ source: 'demo' | 'backend'; records: PaymentRecord[] }> {
  const endpoint = import.meta.env.VITE_PAYMENTS_URL
  if (!endpoint) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    signal.throwIfAborted()
    return { source: 'demo', records: DEMO_PAYMENTS.map((record) => ({ ...record, applicationNumber: STUDENT.applicationNumber, tellerNumber: null, cashier: null, paymentMode: 'Online', receiptDetails: { surname: 'Alake', otherNames: 'Emmanuel', applicationNumber: STUDENT.applicationNumber, matric: STUDENT.matric, faculty: STUDENT.faculty, department: STUDENT.department, degree: STUDENT.degree, modeOfStudy: STUDENT.modeOfStudy } })) }
  }
  const response = await fetch(endpoint, { credentials: 'include', headers: { Accept: 'application/json' }, signal })
  if (!response.ok) throw new Error('Unable to load payments')
  const payload = await response.json()
  const records: unknown = Array.isArray(payload) ? payload : payload?.data
  if (!Array.isArray(records) || !records.every((record) => {
    if (!record || typeof record !== 'object') return false
    return ['id', 'reference', 'invoiceNumber', 'session'].every((key) => typeof record[key] === 'string') &&
      ['applicationNumber', 'tellerNumber', 'cashier', 'paymentMode'].every((key) => record[key] == null || typeof record[key] === 'string') &&
      (record.receiptDetails === undefined || (record.receiptDetails && typeof record.receiptDetails === 'object' && !Array.isArray(record.receiptDetails) && Object.values(record.receiptDetails).every((value) => typeof value === 'string'))) &&
      (record.receiptNumber === null || typeof record.receiptNumber === 'string') &&
      (record.paidAt === null || (typeof record.paidAt === 'string' && Number.isFinite(Date.parse(record.paidAt)))) &&
      ['school-fees', 'application-fee', 'acceptance-fee', 'other'].includes(record.feeType) &&
      ['successful', 'pending', 'failed'].includes(record.status) && Number.isFinite(record.amount) && record.amount > 0 &&
      Array.isArray(record.items) && record.items.length > 0 && record.items.every((item: { description?: unknown; amount?: unknown }) => item && typeof item.description === 'string' && typeof item.amount === 'number' && Number.isFinite(item.amount) && item.amount >= 0) &&
      Math.abs(record.items.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0) - record.amount) < 0.005
  })) throw new Error('Invalid payment records')
  return { source: 'backend', records: records as PaymentRecord[] }
}

export function receiptablePayments(records: PaymentRecord[]): PaymentRecord[] {
  return records.filter((record) => record.feeType === 'school-fees' && record.status === 'successful')
    .sort((left, right) => (right.paidAt ? Date.parse(right.paidAt) : 0) - (left.paidAt ? Date.parse(left.paidAt) : 0))
}
