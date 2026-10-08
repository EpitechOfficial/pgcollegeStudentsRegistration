import { COLLEGE, CURRENT_SESSION, STUDENT } from './portal'

type RecordData = Record<string, unknown>
export interface AdmissionClearanceData {
  applicant: RecordData
  application: RecordData
  biodata: RecordData
  sponsors: RecordData[]
  education: RecordData[]
}
export interface AdmissionClearanceResult {
  source: 'backend' | 'demo'
  data: AdmissionClearanceData
}

function isRecord(value: unknown): value is RecordData {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/** Configure an authenticated endpoint returning these five sections (or { data: sections }). */
export async function loadAdmissionClearance(signal: AbortSignal): Promise<AdmissionClearanceResult> {
  const endpoint = import.meta.env.VITE_ADMISSION_CLEARANCE_URL
  if (!endpoint) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    signal.throwIfAborted()
    return {
      source: 'demo',
      data: {
        applicant: { application_number: STUDENT.applicationNumber, name: STUDENT.name },
        application: { session: CURRENT_SESSION, faculty: STUDENT.faculty, department: STUDENT.department, degree: STUDENT.degree, mode_of_study: STUDENT.modeOfStudy },
        biodata: {}, sponsors: [], education: [],
      },
    }
  }
  const response = await fetch(endpoint, { credentials: 'include', headers: { Accept: 'application/json' }, signal })
  if (!response.ok) throw new Error('Unable to retrieve admission records.')
  const payload: unknown = await response.json()
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : payload
  if (!isRecord(data) || !isRecord(data.applicant) || !isRecord(data.application) || !isRecord(data.biodata) ||
      !Array.isArray(data.sponsors) || !data.sponsors.every(isRecord) ||
      !Array.isArray(data.education) || !data.education.every(isRecord)) {
    throw new Error('Admission records have an unexpected format.')
  }
  return { source: 'backend', data: data as unknown as AdmissionClearanceData }
}

function pick(record: RecordData, keys: string[], fallback = 'Not provided'): string {
  for (const key of keys) {
    const value = record[key]
    if ((typeof value === 'string' && value.trim()) || typeof value === 'number') return String(value)
  }
  return fallback
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

function date(value: string): string {
  if (!value) return 'Not provided'
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value)
  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : value
}

function imageUrl(value: string): string {
  if (!value) return ''
  try {
    const url = new URL(value, window.location.origin)
    return ['http:', 'https:'].includes(url.protocol) ? escapeHtml(url.href) : ''
  } catch { return '' }
}

export function buildAdmissionClearanceDocument(result: AdmissionClearanceResult): string {
  const { applicant, application, biodata, sponsors, education } = result.data
  const row = (label: string, value: string) => `<div class="row"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`
  const section = (title: string, content: string) => `<section><h4>${title}</h4>${content}</section>`
  const fullName = pick(applicant, ['name', 'full_name', 'fullName', 'candidate_name'], '') ||
    [pick(applicant, ['surname', 'last_name'], ''), pick(applicant, ['first_name', 'firstname'], ''), pick(applicant, ['middle_name', 'other_names'], '')].filter(Boolean).join(' ') || 'Not provided'
  const passport = imageUrl(pick(biodata, ['passport_photo_url', 'passport_photo', 'photo_url'], ''))
  const brand = new URL(`${import.meta.env.BASE_URL}brand/`, window.location.origin)
  const sponsorRows = sponsors.map((record) => `<tr><td>${escapeHtml(pick(record, ['name', 'sponsor_name']))}</td><td>${escapeHtml(pick(record, ['address', 'sponsor_address']))}</td></tr>`).join('') || '<tr><td colspan="2">No sponsorship record provided.</td></tr>'
  const educationRows = education.map((record) => {
    const period = (prefix: string) => [pick(record, [`${prefix}_month`], ''), pick(record, [`${prefix}_year`], '')].filter(Boolean).join(', ') || 'Not provided'
    const cells = [pick(record, ['school', 'institution', 'institution_name']), period('from'), period('to'), pick(record, ['degree', 'degree_name', 'qualification']), date(pick(record, ['award_date', 'date_award', 'date_of_award'], '')), pick(record, ['course', 'course_of_study', 'discipline']), pick(record, ['class', 'class_name', 'obtained'])]
    return `<tr>${cells.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`
  }).join('') || '<tr><td colspan="7">No educational record provided.</td></tr>'
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admission Clearance Form</title><style>
*{box-sizing:border-box;print-color-adjust:exact;-webkit-print-color-adjust:exact}body{margin:0;background:#f5f7f9;color:#1f2933;font:13px/1.45 Arial,sans-serif}.document{background:white;margin:6px auto;max-width:1100px;padding:18px 22px}header{display:grid;grid-template-columns:90px minmax(0,1fr) 90px;gap:18px;align-items:center;border:2px solid #0A2B4F;border-radius:4px;padding:12px;text-align:center;margin-bottom:18px}header img{max-height:76px;max-width:86px;object-fit:contain}h2{margin:0;font-size:22px;line-height:1.25;color:#4b5563}h3{display:inline-block;background:#0A2B4F;color:white;font-size:15px;margin:14px 0 0;padding:7px 18px}.meta,.note{background:#f8fafc;border:1px solid #d7dee8;padding:12px 14px}.row{display:grid;grid-template-columns:220px minmax(0,1fr);gap:12px;margin-bottom:6px}.row strong{color:#374151}.row span{color:#111827;overflow-wrap:anywhere}section{margin-top:20px}h4{background:#f2f6fa;border-left:4px solid #0A2B4F;color:#0A2B4F;font-size:14px;margin:0 0 10px;padding:8px 10px}.biodata{display:grid;grid-template-columns:minmax(0,1fr) 120px;gap:20px}.passport{display:flex;align-items:center;justify-content:center;width:120px;height:120px;background:#f8fafc;border:1px solid #cbd5e1;color:#6b7280}.passport img{width:100%;height:100%;object-fit:cover}.two-column{display:grid;grid-template-columns:1fr 1fr;gap:10px 18px}.two-column .row{grid-template-columns:1fr;gap:2px}table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:10px}th,td{border:1px solid #cbd5e1;padding:6px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#f1f5f9;color:#374151}.table-wrap{overflow-x:auto}.education{min-width:650px}.declaration{border-top:1px solid #d7dee8;margin-top:24px;padding-top:14px}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin:26px 0 14px}.sign-line{height:26px;border-bottom:1px dotted #111827}footer{border-top:1px solid #d7dee8;margin-top:30px;padding-top:12px;text-align:center;color:#4b5563}footer p{margin:2px 0}.demo{background:#fffbeb;color:#92400e;padding:10px;text-align:center;margin-bottom:12px}tr,header,.meta,.declaration{break-inside:avoid}thead{display:table-header-group}
@media screen and (max-width:768px){.document{padding:14px}header{grid-template-columns:56px minmax(0,1fr) 56px;gap:10px}header img{max-width:52px;max-height:52px}h2{font-size:17px}.biodata,.two-column,.signatures{grid-template-columns:1fr}.row{grid-template-columns:1fr;gap:2px}}
@media print{@page{size:A4;margin:12mm}body{background:white}.document{margin:0;padding:0;max-width:none}.table-wrap{overflow:visible}.education{min-width:0}header{grid-template-columns:76px minmax(0,1fr) 76px}.row{grid-template-columns:180px minmax(0,1fr)}}
</style></head><body><main class="document">${result.source === 'demo' ? '' : ''}
<header><img src="${escapeHtml(new URL('pgc-logo.png', brand).href)}" alt="Postgraduate College logo"><div><h2>The Postgraduate College</h2><h2>University of Ibadan</h2><h3>ACCEPTANCE OF OFFER OF PROVISIONAL ADMISSION</h3></div><img src="${escapeHtml(new URL('ui-logo.png', brand).href)}" alt="University of Ibadan logo"></header>
<div class="meta">${row('Application Number', pick(applicant, ['application_number', 'applicationNumber', 'appno', 'numeration']))}${row('Form Number', pick(application, ['form_number', 'formno', 'form_no']))}${row('Session', pick(application, ['session', 'apply_session']))}</div>
${section('BIODATA INFORMATION', `<div class="biodata"><div>${row('Name of Candidate', fullName)}${row('Maiden Name', pick(biodata, ['maiden_name', 'maidenName'], 'Not Applicable'))}${row('Date of Birth', date(pick(biodata, ['date_of_birth', 'dob'], '')))}${row('State of Origin', pick(biodata, ['state', 'state_of_origin']))}${row('Local Government Area', pick(biodata, ['lga', 'local_government', 'local_government_area']))}${row('Permanent Home Address', pick(biodata, ['permanent_address', 'permanentAddress', 'home_address']))}</div><div class="passport">${passport ? `<img src="${passport}" alt="Passport">` : 'No Passport'}</div></div>`)}
${section('PROPOSED PROGRAM OF STUDY', `<div class="two-column">${row('Proposed Faculty of Study', pick(application, ['faculty_name', 'faculty']))}${row('Proposed Department of Study', pick(application, ['department_name', 'department']))}${row('Proposed Degree / Diploma', pick(application, ['degree_name', 'degree']))}${row('Proposed Mode of Study', pick(application, ['mode_of_study_name', 'mode_of_study', 'modeOfStudy']))}${row('Field of Interest', pick(application, ['field_of_interest_name', 'field_of_interest', 'specialization']))}</div>`)}
${section('SPONSORSHIP', `<table><thead><tr><th>Name</th><th>Address</th></tr></thead><tbody>${sponsorRows}</tbody></table>`)}
${section('EDUCATIONAL RECORD(S)', `<div class="table-wrap"><table class="education"><thead><tr><th>School</th><th>From</th><th>To</th><th>Degree / Diploma</th><th>Date of Award</th><th>Course of Study/Discipline</th><th>Class Obtained</th></tr></thead><tbody>${educationRows}</tbody></table></div>`)}
<div class="declaration"><p>Declaration: I <b>${escapeHtml(fullName)}</b> accept the offer of admission into the above programme. Any alteration renders the document invalid.</p><div class="signatures"><div><div class="sign-line"></div><strong>Signature</strong></div><div><div class="sign-line"></div><strong>Date</strong></div></div><p class="note"><strong>Note:</strong> The University is not bound to honour any request for the deferment of an offer not taken up in any given academic year. Candidates requesting for deferment offers are therefore advised to re-apply for admission in the following year.</p></div>
<footer><p>Copyright © ${new Date().getFullYear()} The Postgraduate College, I.T. Unit</p><p>Contact: Tel: 09090561432</p><p>Email: ${escapeHtml(COLLEGE.email)}</p></footer></main></body></html>`
}
