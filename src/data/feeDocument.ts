import { COLLEGE, STUDENT } from './portal'
import { amountInWords } from './amountInWords'

export interface ReceiptDetails {
  surname?: string
  otherNames?: string
  gender?: string
  maritalStatus?: string
  telephone?: string
  email?: string
  faculty?: string
  department?: string
  degree?: string
  modeOfStudy?: string
  fieldOfInterest?: string
  supervisor?: string
  firstRegistrationSession?: string
  applicationNumber?: string
  matric?: string
  bankName?: string
  cashier?: string
}

export interface FeeDocument {
  kind: 'invoice' | 'receipt'
  reference: string
  createdAt: string
  session: string
  items: { description: string; amount: number }[]
  paymentReference?: string
  invoiceNumber?: string
  demo?: boolean
  receiptDetails?: ReceiptDetails
}

// Separate document identities; a receipt must only be issued after confirmed payment.
const DOCUMENT_COLORS = { invoice: '#0A2B4F', receipt: '#0f766e' }

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!)
}

export function buildFeeDocument(document: FeeDocument): string {
  const title = document.kind === 'invoice' ? 'Invoice' : 'Receipt'
  const color = DOCUMENT_COLORS[document.kind]
  const logo = escapeHtml(new URL('/brand/pgc-logo.png', window.location.origin).href)
  const money = (amount: number) => escapeHtml(`₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
  const total = document.items.reduce((total, item) => total + item.amount, 0)
  const amount = money(total)
  const profile = document.receiptDetails ?? {}
  const studentDetails = document.kind === 'receipt' ? [
    ['Surname', profile.surname], ['Other Names', profile.otherNames],
    ['Gender', profile.gender], ['Marital Status', profile.maritalStatus],
    ['Telephone', profile.telephone], ['E-mail address', profile.email],
    ['Faculty', profile.faculty], ['Department', profile.department],
    ['Degree/Diploma', profile.degree], ['Mode of Study', profile.modeOfStudy],
    ['Field of Interest', profile.fieldOfInterest], ['Supervisor', profile.supervisor],
    ['Session of First Registration', profile.firstRegistrationSession],
  ] : [
    ['Name', STUDENT.name], ['Application Number', STUDENT.applicationNumber],
    [document.kind === 'invoice' ? 'Invoice Session' : 'Payment Session', document.session], ['Faculty', STUDENT.faculty],
    ['Department', STUDENT.department], ['Degree', STUDENT.degree],
    ['Mode of Study', STUDENT.modeOfStudy], ['Programme', STUDENT.programme],
  ]
  const detailGrid = (fields: (string | undefined)[][]) => fields.map(([label, value]) => `<div><p>${escapeHtml(label!)}:</p><b>${escapeHtml(value || 'Not provided')}</b></div>`).join('')
  const details = detailGrid(studentDetails)
  const compactFields = (fields: (string | undefined)[][]) => fields.map(([label, value]) => `<div class="detail-row"><span>${escapeHtml(label!)}:</span><b>${escapeHtml(value || 'Not provided')}</b></div>`).join('')
  const receiptPanel = `<section class="receipt-details"><div class="detail-group"><h3>Student Details</h3>${compactFields(studentDetails)}</div><div class="detail-group"><h3>Payment Details</h3>${compactFields([
    ['Date/time Paid', new Date(document.createdAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })],
    ['Session', document.session], ['P.G. Reg. Number', profile.applicationNumber],
    ['Matric No', profile.matric], ['Invoice No', document.invoiceNumber],
    ['Degree in View', profile.degree], ['Payment Reference', document.paymentReference],
  ])}</div></section>`
  const rows = document.items.map((item, index) => `<tr>${document.kind === 'invoice' ? `<td>${index + 1}</td>` : ''}<td>${escapeHtml(item.description)}</td><td class="price">${money(item.amount)}</td></tr>`).join('')
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>School Fees | ${title}</title>
<style>
*{box-sizing:border-box;print-color-adjust:exact;-webkit-print-color-adjust:exact}
body{margin:0;background:#f4f6fb;color:#172033;font-family:Arial,sans-serif;font-size:15px}
.container{max-width:1100px;margin:0 auto;padding:0 10px 10px}
.document{background:white;border:1px solid #dfe3ec;padding:18px}
.header{display:flex;justify-content:space-between;align-items:center;background:#f8fafc;min-height:110px;border-bottom:1px solid #e6eaf2}
.brand{display:flex;align-items:center;gap:14px;padding:18px;flex:1}
.brand img{width:64px;height:64px;object-fit:contain}
.brand p{margin:0;font-size:12px;line-height:1.5;text-transform:uppercase;font-weight:bold}
.title{display:flex;align-items:center;justify-content:flex-end;padding:18px;align-self:stretch;width:52%;background:${color};color:white;font-size:38px;font-weight:800;text-transform:uppercase}
.metadata{display:flex;justify-content:flex-end;margin:10px 0}
.metadata div{display:flex;flex-wrap:wrap;gap:10px 20px;max-width:100%;background:${color};color:white;padding:12px 16px;border-radius:0 0 0 8px;overflow-wrap:anywhere}
.summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:8px}
.summary p{margin:0 0 6px;color:#64748b}.summary b{line-height:1.5;overflow-wrap:anywhere}
table{width:100%;border-collapse:collapse}th,td{padding:12px;border-bottom:1px solid #e7e7e7;text-align:left}
thead{display:table-header-group}tr{break-inside:avoid}.total,.note{break-inside:avoid}
thead,.total{background:${color};color:white}.price{text-align:right;white-space:nowrap}
.total{display:flex;justify-content:space-between;gap:16px;margin:12px 0 0 auto;padding:14px;width:45%;font-size:16px;font-weight:bold}
.note{text-align:center;margin-top:28px;border-top:1px solid #e5e7eb;padding-top:18px;line-height:1.6;color:#475569}
.demo{margin:0 0 16px;padding:10px;background:#fffbeb;color:#92400e;font-size:12px;text-align:center}
.cashier{margin:36px 0 12px auto;width:240px;text-align:center;border-top:1px dashed #64748b;padding-top:8px;break-inside:avoid}
.receipt-details{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:16px;border:1px solid #e5e7eb;border-radius:6px;padding:12px;margin-bottom:12px}
.detail-group{min-width:0}.detail-group+ .detail-group{border-left:1px solid #e5e7eb;padding-left:16px}
.detail-group h3{margin:0 0 7px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:${color}}
.detail-row{display:grid;grid-template-columns:minmax(105px,42%) minmax(0,1fr);gap:8px;padding:3px 0;font-size:11px;line-height:1.35;break-inside:avoid}
.detail-row span{color:#64748b}.detail-row b{font-weight:600;overflow-wrap:anywhere}
@media screen and (max-width:640px){.receipt-details{grid-template-columns:1fr;gap:12px}.detail-group+ .detail-group{border-left:0;border-top:1px solid #e5e7eb;padding:10px 0 0}.detail-row{grid-template-columns:minmax(110px,40%) minmax(0,1fr)}}
@media(max-width:540px){.container{padding:8px;margin:0}.document{padding:12px}.brand{padding:12px;gap:8px}.brand img{width:42px;height:42px}.brand p{font-size:10px}.title{font-size:22px}.summary{grid-template-columns:1fr;gap:12px}.total{width:100%}th,td{padding:10px 6px}}
@media print{body{background:white}.container{margin:0;max-width:none;padding:0}.document{box-shadow:none;border:0}.summary{grid-template-columns:repeat(3,minmax(0,1fr))}.total{width:55%}}
</style></head><body><main class="container"><article class="document">
${document.demo ? '' : ''}
<header class="header"><div class="brand"><img src="${logo}" alt="Postgraduate College logo"><p>${escapeHtml(COLLEGE.shortName)},<br>${escapeHtml(COLLEGE.university)},<br>Ibadan, Nigeria.</p></div><div class="title">Students' ${title}</div></header>
<div class="metadata"><div><span>${title} No: <b>${escapeHtml(document.reference)}</b></span><span>Date: <b>${escapeHtml(new Date(document.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }))}</b></span></div></div>
${document.kind === 'receipt' ? receiptPanel : `<section class="summary">${details}</section>`}
<table><thead><tr>${document.kind === 'invoice' ? '<th>Item</th>' : ''}<th>${document.kind === 'receipt' ? 'Cost Item' : 'Description'}</th><th class="price">${document.kind === 'receipt' ? 'Amount (₦)' : 'Price'}</th></tr></thead><tbody>${rows}</tbody></table>
<div class="total"><span>${document.kind === 'receipt' ? 'Amount Paid' : 'Grand Total'}</span><span>${amount}</span></div>
${document.kind === 'receipt' ? `<section class="summary" style="margin-top:20px;grid-template-columns:minmax(0,4fr) minmax(0,1fr)"><div><p>Amount in Words:</p><b>${escapeHtml(amountInWords(total))}</b></div><div><p>Bank Name:</p><b>${escapeHtml(profile.bankName || 'Not provided')}</b></div></section><div class="cashier">${profile.cashier ? `<b>${escapeHtml(profile.cashier)}</b><br>` : ''}Cashier</div>` : ''}
<footer class="note"><b>${document.kind === 'invoice' ? 'Payment information' : 'Payment confirmation'}</b><br>${document.kind === 'invoice' ? 'This invoice lists the full school fee charges for the session. Check your payment record for payments already made.<br>An invoice is not proof of payment.' : 'A receipt is issued only after payment has been confirmed.'}</footer>
</article></main></body></html>`
}
