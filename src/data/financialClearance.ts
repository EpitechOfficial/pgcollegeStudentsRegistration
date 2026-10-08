import { COLLEGE, CURRENT_SESSION, SCHOOL_FEE_ITEMS, STUDENT } from './portal'
import type { ReceiptDetails } from './feeDocument'

export interface FinancialClearance {
  id: string
  session: string
  amountPaid: number
  items: { description: string; amount: number }[]
  student: ReceiptDetails
  passportUrl?: string | null
  clearedAt?: string | null
  signatureUrl?: string | null
}

export function clearanceTotals(record: FinancialClearance) {
  const total = record.items.reduce((sum, item) => sum + item.amount, 0)
  return { total, paid: record.amountPaid, balance: Math.max(0, Math.round((total - record.amountPaid) * 100) / 100) }
}

export async function loadFinancialClearance(signal: AbortSignal): Promise<{ source: 'demo' | 'backend'; records: FinancialClearance[] }> {
  const endpoint = import.meta.env.VITE_FINANCIAL_CLEARANCE_URL
  if (!endpoint) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    signal.throwIfAborted()
    return { source: 'demo', records: [{
      id: 'demo-clearance-current', session: CURRENT_SESSION, amountPaid: SCHOOL_FEE_ITEMS.reduce(
  (total, item) => total + item.amount,
  0,
),
      items: SCHOOL_FEE_ITEMS, student: { surname: 'Alake', otherNames: 'Emmanuel', applicationNumber: STUDENT.applicationNumber, matric: STUDENT.matric, faculty: STUDENT.faculty, department: STUDENT.department, degree: STUDENT.degree, modeOfStudy: STUDENT.modeOfStudy },
    }] }
  }
  const response = await fetch(endpoint, { credentials: 'include', headers: { Accept: 'application/json' }, signal })
  if (!response.ok) throw new Error('Unable to load financial clearance')
  const payload = await response.json()
  const records: unknown = Array.isArray(payload) ? payload : payload?.data
  if (!Array.isArray(records) || !records.every((record) => {
    if (!record || typeof record !== 'object' || typeof record.id !== 'string' || typeof record.session !== 'string' || !Number.isFinite(record.amountPaid) || record.amountPaid < 0) return false
    if (!Array.isArray(record.items) || !record.items.length) return false
    if (!record.items.every((item: { description?: unknown; amount?: unknown }) => item && typeof item.description === 'string' && typeof item.amount === 'number' && Number.isFinite(item.amount) && item.amount >= 0)) return false
    if (!record.student || typeof record.student !== 'object' || Array.isArray(record.student) || !Object.values(record.student).every((value) => typeof value === 'string')) return false
    if (!['passportUrl', 'signatureUrl', 'clearedAt'].every((key) => record[key] == null || typeof record[key] === 'string')) return false
    return record.clearedAt == null || Number.isFinite(Date.parse(record.clearedAt))
  })) throw new Error('Invalid financial clearance records')
  return { source: 'backend', records: records as FinancialClearance[] }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}
function imageUrl(value?: string | null) {
  if (!value) return ''
  try { const url = new URL(value, window.location.origin); return ['https:', 'http:'].includes(url.protocol) ? escapeHtml(url.href) : '' } catch { return '' }
}

export function buildFinancialClearanceDocument(record: FinancialClearance, demo: boolean): string {
  const student = record.student
  const totals = clearanceTotals(record)
  const issued = !demo && totals.balance === 0
  const money = (value: number) => `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const brand = new URL(`${import.meta.env.BASE_URL}brand/`, window.location.origin)
  const field = (label: string, value?: string) => `<div class="field"><span>${escapeHtml(label)}:</span><b>${escapeHtml(value || 'Not provided')}</b></div>`
  const details = [
    ['Surname', student.surname], ['Other Names', student.otherNames], ['Gender', student.gender],
    ['Marital Status', student.maritalStatus], ['Telephone', student.telephone], ['E-mail address', student.email],
    ['Faculty', student.faculty], ['Department', student.department], ['Degree/Diploma', student.degree],
    ['Mode of Study', student.modeOfStudy], ['Field of Interest', student.fieldOfInterest], ['Supervisor', student.supervisor],
    ['Session of First Registration', student.firstRegistrationSession],
  ].map(([label, value]) => field(label!, value)).join('')
  const passport = imageUrl(record.passportUrl)
  const signature = issued ? imageUrl(record.signatureUrl) : ''
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Financial Clearance Form</title><style>
*{box-sizing:border-box;print-color-adjust:exact;-webkit-print-color-adjust:exact}body{margin:0;background:#f5f7f9;color:#172033;font:12px/1.4 Arial,sans-serif}.document{max-width:1000px;margin:0 auto;background:white;padding:20px}header{display:grid;grid-template-columns:72px minmax(0,1fr) 72px;gap:16px;align-items:center;text-align:center;border-bottom:2px solid #0A2B4F;padding-bottom:14px;margin-bottom:14px}header img{width:72px;height:72px;object-fit:contain}header h1{font-size:17px;margin:0;color:#0A2B4F}header h2{font-size:15px;margin:5px 0;color:#0A2B4F}header p{margin:3px}.notice{padding:10px;background:#fffbeb;color:#92400e;text-align:center;margin-bottom:12px}.meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;background:#f2f6fa;border:1px solid #e5e7eb;padding:12px;margin-bottom:12px}.meta .field{display:block}.field{display:grid;grid-template-columns:43% minmax(0,1fr);gap:8px;padding:3px 0;font-size:11px;break-inside:avoid}.field span{color:#64748b}.field b{overflow-wrap:anywhere;font-weight:600}.biodata{display:grid;grid-template-columns:minmax(0,1fr) 110px;gap:20px;border:1px solid #e5e7eb;padding:12px;margin-bottom:14px}.passport{width:110px;height:130px;border:1px solid #cbd5e1;display:flex;align-items:center;justify-content:center;text-align:center;color:#64748b}.passport img{width:100%;height:100%;object-fit:cover}table{width:100%;border-collapse:collapse}th,td{padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:left}thead{display:table-header-group;background:#0A2B4F;color:white}td:last-child,th:last-child{text-align:right;white-space:nowrap}tfoot{display:table-row-group;background:#f2f6fa;font-weight:bold;color:#0A2B4F}tr{break-inside:avoid}.position{display:flex;justify-content:space-between;gap:16px;margin:14px 0;padding:10px;border:1px solid #e5e7eb}.signature{margin:24px 0 0 auto;width:330px;text-align:center;break-inside:avoid}.signature img{display:block;max-width:180px;height:65px;object-fit:contain;margin:8px auto}.signature .blank{height:60px;border-bottom:1px dashed #94a3b8}.signature p{margin:4px 0}.note{color:#64748b;font-size:11px}
@media screen and (max-width:540px){.document{padding:12px}header{grid-template-columns:45px minmax(0,1fr) 45px;gap:8px}header img{width:45px;height:45px}header h1{font-size:13px}.meta{grid-template-columns:1fr}.biodata{grid-template-columns:1fr}.signature{width:100%}.position{flex-wrap:wrap}}
@media print{@page{size:A4;margin:12mm}body{background:white}.document{margin:0;padding:0;max-width:none}}
</style></head><body><main class="document">${!issued ? `` : ''}
<header><img src="${escapeHtml(new URL('pgc-logo.png', brand).href)}" alt="Postgraduate College logo"><div><h1>UNIVERSITY OF IBADAN, IBADAN, NIGERIA</h1><p><b>${escapeHtml(COLLEGE.shortName.toUpperCase())}</b></p><h2>Financial Clearance Form</h2></div><img src="${escapeHtml(new URL('ui-logo.png', brand).href)}" alt="University of Ibadan logo"></header>
<div class="meta">${field('Application No', student.applicationNumber)}${field('Matriculation No', student.matric)}${field('Session', record.session)}</div>
<div class="biodata"><div>${details}</div><div class="passport">${passport ? `<img src="${passport}" alt="Student passport">` : 'Passport not provided'}</div></div>
<table><thead><tr><th>Cost Item</th><th>Amount (₦)</th></tr></thead><tbody>${record.items.map((item) => `<tr><td>${escapeHtml(item.description)}</td><td>${money(item.amount)}</td></tr>`).join('')}</tbody><tfoot><tr><th>TOTAL</th><td>${money(totals.total)}</td></tr></tfoot></table>
<div class="position"><span>Confirmed payments: <b>${money(totals.paid)}</b></span><span>Outstanding balance: <b>${money(totals.balance)}</b></span></div>
<div class="signature"><p><b>Secretary Postgraduate School</b></p><p>Sign below with Date${issued && record.clearedAt ? ` (${escapeHtml(new Date(record.clearedAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }))})` : ''}</p>${signature ? `<img src="${signature}" alt="Secretary signature">` : '<div class="blank"></div>'}</div>
${totals.balance > 0 ? '<p class="note">Printing becomes available after the session is fully paid.</p>' : ''}</main></body></html>`
}
