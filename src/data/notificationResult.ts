import { STUDENT } from './portal'
import { activeLetterOfficials, type LetterOfficial } from './letterOfficials'

export interface NotificationResultData {
  name: string
  matric: string
  department: string
  faculty: string
  degreeAward: string
  fieldTitle?: string
  salutation?: string
  address?: string
  approvalDate?: string
  awardDate?: string
  remarks?: string
  signatureUrl?: string
}

// Replace with approved backend result records when the result endpoint is connected.
const DEMO_RESULT: NotificationResultData = {
  name: STUDENT.name, matric: STUDENT.matric, department: STUDENT.department,
  faculty: STUDENT.faculty, degreeAward: STUDENT.programme,
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

function formatCredentials(value: string): string {
  return value.replace(/[ \t]+(?=MGIS\b)/gi, '\n').split(/\r?\n/)
    .map((line) => line.trim()).filter(Boolean).map(formatCredentialLine).join('<br>')
}

function formatCredentialLine(value: string): string {
  const qualifications: string[] = []
  let depth = 0
  let start = 0
  for (let index = 0; index < value.length; index++) {
    if (value[index] === '(') depth++
    if (value[index] === ')') depth = Math.max(0, depth - 1)
    if (value[index] === ',' && depth === 0) {
      qualifications.push(value.slice(start, index + 1).trim())
      start = index + 1
    }
  }
  const last = value.slice(start).trim()
  if (last) qualifications.push(last)
  return qualifications.map((qualification) => `<span class="qualification">${escapeHtml(qualification)}</span>`).join(' ')
}

export function buildNotificationResultDocument(data: NotificationResultData = DEMO_RESULT, officials: LetterOfficial[] = []): string {
  const logo = escapeHtml(new URL(`${import.meta.env.BASE_URL}brand/ui-logo.png`, window.location.origin).href)
  const active = activeLetterOfficials(officials)
  const registrar = active.find((officer) => officer.officer_type === 'deputy_registrar')
  const positions = { left: ['provost', 'deputy_registrar'], right: ['deputy_provost_admin', 'deputy_provost_academic'] }
  const officers = (side: 'left' | 'right') => positions[side].map((type) => {
    const officer = active.find((record) => record.officer_type === type)
    if (!officer) return ''
    const contacts = [officer.mobile ? `Mobile: ${officer.mobile}` : null, officer.email ? `E-mail: ${officer.email}` : null, officer.secondary_email].filter((line): line is string => !!line)
    return `<div class="office-block"><strong>${escapeHtml(officer.title)}</strong><p>${escapeHtml(officer.name)}</p>${officer.credentials ? `<p class="credentials">${formatCredentials(officer.credentials)}</p>` : ''}${contacts.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}</div>`
  }).join('')
  const date = (value?: string) => {
    if (!value) return 'Not provided'
    const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value)
    return escapeHtml(Number.isFinite(parsed.getTime()) ? parsed.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : value)
  }
  let signature = ''
  if (data.signatureUrl) {
    try {
      const url = new URL(data.signatureUrl, window.location.origin)
      if (['http:', 'https:'].includes(url.protocol)) signature = `<img src="${escapeHtml(url.href)}" alt="Deputy Registrar signature">`
    } catch { /* Leave the signature blank when its URL is invalid. */ }
  }
  const department = /^(department\b)/i.test(data.department) ? data.department : `Department of ${data.department}`
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Notification of Higher Degree Result — Preview</title><style>
*{box-sizing:border-box;print-color-adjust:exact;-webkit-print-color-adjust:exact}
body{margin:0;background:#f5f7f9;color:#111827;font:13.5px/1.4 Roboto,Arial,Helvetica,sans-serif}
.letter{background:white;box-shadow:0 4px 14px #0f172a14;max-width:1000px;min-height:800px;margin:0 auto;padding:20px 26px}
.letter-head{border-bottom:2px solid #0A2B4F;margin-bottom:16px;padding-bottom:14px;text-align:center}
.letter-head h2,.letter-head h3,.letter-head p{margin:0}
.letter-head h2{color:#0A2B4F;font-size:20px;font-weight:700;text-transform:uppercase}
.letter-head h3{color:#0A2B4F;font-size:17px;margin-top:3px;text-transform:uppercase}
.letter-head p{color:#4b5563;font-size:12px;margin-top:7px}
.officers{--office-column-width:calc((100% - 140px)/2);display:grid;width:100%;grid-template-columns:var(--office-column-width) 104px var(--office-column-width);column-gap:18px;align-items:start;border-bottom:1px solid #d7dee8;margin-bottom:18px;padding-bottom:14px;break-inside:avoid}
.office-side{display:grid;gap:12px;min-width:0;width:100%;max-width:100%;justify-self:stretch}.office-right{width:max-content;max-width:100%;justify-self:end;text-align:left}.office-block{min-width:0;width:100%}
.office-block strong{color:#0A2B4F;display:block;font-family:Arial,sans-serif;font-size:11px;margin-bottom:2px;text-transform:uppercase}
.office-block p{margin:0;overflow-wrap:anywhere;font-size:12px}
.office-block .credentials{font-size:10.5px;line-height:1.5;margin:2px 0 3px;overflow-wrap:normal}
.qualification{display:inline-block;max-width:100%;vertical-align:top;overflow-wrap:anywhere}
.center-logo{display:flex;justify-content:center;align-items:center;align-self:center;min-width:0}.center-logo img{max-height:96px;max-width:96px;object-fit:contain}
.heading{text-align:center;text-decoration:underline;text-transform:uppercase;font-size:15px;margin:24px 0}
.pending{padding:20px;border:1px dashed #cbd5e1;background:#f8fafc;text-align:center;color:#64748b;font-size:13px}
.preview-note{background:#fffbeb;color:#92400e;padding:10px;margin-bottom:14px;text-align:center;font-size:12px}
.letter-date{text-align:right;margin:14px 0;font-family:'Times New Roman',serif;font-size:15px}
.recipient,.letter-body,.signatory{font-family:'Times New Roman',serif;font-size:17px;line-height:1.7}
.recipient p{margin:0}.recipient .salutation{margin-top:16px}.recipient-address{white-space:pre-line}
.letter-body p{margin:0 0 18px;text-align:justify}.letter-body .remarks{white-space:pre-wrap}
.heading{font-family:'Times New Roman',serif;font-size:19px}
.signatory{width:45%;margin:24px 0 0 auto;text-align:center;break-inside:avoid}.signatory p{margin:0}.signatory img{display:block;max-width:180px;height:80px;object-fit:contain;margin:0 auto}.signature-space{height:65px}.signatory .matric{font-size:13px}
@media screen and (max-width:600px){.signatory{width:100%}}
@media screen and (max-width:600px){.letter{padding:18px}.officers{grid-template-columns:minmax(0,1fr);gap:20px}.center-logo{order:-1}.office-right{width:100%;justify-self:stretch}.letter-head h2{font-size:18px}}
@media print{@page{size:A4;margin:10mm}body{background:white}.letter{box-shadow:none;margin:0;padding:0;max-width:none;min-height:0}.officers{grid-template-columns:var(--office-column-width) 104px var(--office-column-width)}}
</style></head><body><main class="letter"><header class="letter-head"><h2>University of Ibadan, Nigeria</h2><h3>The Postgraduate College</h3><p>Telegram: University of Ibadan</p></header>
<div class="officers"><div class="office-side">${officers('left')}</div><div class="center-logo"><img src="${logo}" alt="University of Ibadan logo"></div><div class="office-side office-right">${officers('right')}</div></div>
<p class="letter-date"><em><strong>Date: ${date(data.approvalDate)}</strong></em></p>
<div class="recipient"><p><em><strong>${escapeHtml(data.name)}</strong></em></p><p><em><strong>(S I. ${escapeHtml(data.matric)})</strong></em></p><div class="recipient-address"><em><strong>${escapeHtml(data.address || `${department}\nUniversity of Ibadan.`)}</strong></em></div><p class="salutation"><em><strong>DEAR ${escapeHtml(data.salutation || data.name)},</strong></em></p></div>
<h1 class="heading">Notification of Higher Degree Result</h1>
<div class="letter-body"><p>I have pleasure in informing you that, sequel to the ratification of the <em><strong>${escapeHtml(data.faculty)}</strong></em> Postgraduate Committee and the Board of the Postgraduate College, Senate has approved the recommendation of the examiners that the degree of <em><strong>${escapeHtml([data.degreeAward, data.fieldTitle].filter(Boolean).join(' '))}</strong></em> of this University be conferred on you.</p>
<p>The effective date of the award is <em><strong>${date(data.awardDate)}</strong></em></p>
${data.remarks ? `<p class="remarks"><strong><em>${escapeHtml(data.remarks)}</em></strong></p>` : ''}
<p>On behalf of the Vice Chancellor, I congratulate you on the successful completion of your programme.</p></div>
<div class="signatory"><p>Yours Sincerely,</p>${registrar && signature ? signature : '<div class="signature-space" aria-label="Signature not provided"></div>'}<p><strong>${escapeHtml(registrar?.name || 'Signatory not provided')}</strong><br><em><strong>${escapeHtml(registrar?.title || '')}<br>(Exams &amp; Records)</strong></em></p><p class="matric"><strong><em>${escapeHtml(data.matric)}</em></strong></p></div>
</main></body></html>`
}
