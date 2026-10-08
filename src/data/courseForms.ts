import { COURSE_CATALOGUE, CURRENT_SESSION, DEFAULT_SELECTED_CODES, STUDENT } from './portal'
import type { CourseOption as Course } from '../types'
import type { ReceiptDetails } from './feeDocument'

interface ContactDetails { name?: string; address?: string; telephone?: string; email?: string }
interface EducationDetails { school: string; from: string; to: string; qualification: string; discipline: string }
const DEMO_STUDENT: ReceiptDetails = { surname: 'Alake', otherNames: 'Emmanuel', matric: STUDENT.matric, faculty: STUDENT.faculty, department: STUDENT.department, degree: STUDENT.degree, modeOfStudy: STUDENT.modeOfStudy }

export interface CourseFormRecord {
  id: string
  applicationNumber: string
  session: string
  registeredAt: string
  courses: Course[]
  student?: ReceiptDetails
  passportUrl?: string | null
  sponsor?: ContactDetails
  employer?: ContactDetails
  education?: EducationDetails[]
  lockedAt?: string | null
  signatureUrl?: string | null
}
let confirmedForms: CourseFormRecord[] = [{
  id: 'demo-course-form-current',
  applicationNumber: STUDENT.applicationNumber,
  session: CURRENT_SESSION,
  registeredAt: '2026-10-08T09:00:00+01:00',
  student: DEMO_STUDENT,
  courses: COURSE_CATALOGUE.filter((course) => DEFAULT_SELECTED_CODES.includes(course.code)).map((course) => ({ ...course })),
}]
export function rememberCourseForm(courses: Course[]) {
  confirmedForms = [{ id: `preview-${CURRENT_SESSION}`, applicationNumber: STUDENT.applicationNumber, session: CURRENT_SESSION, registeredAt: new Date().toISOString(), student: DEMO_STUDENT, courses: courses.map((course) => ({ ...course })) }]
  localStorage.setItem(`pgc.course-form.${STUDENT.applicationNumber}.${CURRENT_SESSION}`, JSON.stringify(confirmedForms))
}
export async function loadCourseForms(signal: AbortSignal): Promise<CourseFormRecord[]> {
  const endpoint = import.meta.env.VITE_COURSE_FORMS_URL
  if (!endpoint) {
    try {
      const saved = JSON.parse(localStorage.getItem(`pgc.course-form.${STUDENT.applicationNumber}.${CURRENT_SESSION}`) || 'null')
      if (Array.isArray(saved) && saved.length === 1 && saved[0].applicationNumber === STUDENT.applicationNumber && saved[0].session === CURRENT_SESSION && typeof saved[0].id === 'string' && Number.isFinite(Date.parse(saved[0].registeredAt)) && Array.isArray(saved[0].courses) && saved[0].courses.every((course: Course) => COURSE_CATALOGUE.some((entry) => entry.code === course?.code && entry.title === course.title && entry.units === course.units && entry.type === course.type))) return [{ ...saved[0], student: DEMO_STUDENT }]
    } catch { /* Ignore an invalid optional preview. */ }
    return confirmedForms
  }
  const response = await fetch(endpoint, { credentials: 'include', signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('Unable to load course forms.')
  const payload = await response.json()
  const records = Array.isArray(payload) ? payload : payload?.data
  if (!Array.isArray(records) || !records.every((record) => record && ['id', 'applicationNumber', 'session', 'registeredAt'].every((key) => typeof record[key] === 'string') && Number.isFinite(Date.parse(record.registeredAt)) && Array.isArray(record.courses) && record.courses.length > 0 && record.courses.every((course: Course) => course && typeof course.code === 'string' && typeof course.title === 'string' && ['Required', 'Elective'].includes(course.type) && Number.isInteger(course.units) && course.units > 0))) throw new Error('Invalid course form records.')
  const textRecord = (value: unknown) => value != null && typeof value === 'object' && !Array.isArray(value) && Object.values(value).every((entry) => entry == null || typeof entry === 'string')
  if (!records.every((record) =>
    (record.student == null || textRecord(record.student)) &&
    (record.sponsor == null || textRecord(record.sponsor)) &&
    (record.employer == null || textRecord(record.employer)) &&
    ['passportUrl', 'signatureUrl', 'lockedAt'].every((key) => record[key] == null || typeof record[key] === 'string') &&
    (record.education == null || (Array.isArray(record.education) && record.education.every(textRecord)))
  )) throw new Error('Invalid course form profile.')
  return records
}
export function buildCourseForm(record: CourseFormRecord): string {
  const escape = (value?: string | null) => (value || 'Not provided').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
  const imageUrl = (value?: string | null) => {
    if (!value) return ''
    try { const url = new URL(value, window.location.origin); return ['http:', 'https:'].includes(url.protocol) ? escape(url.href) : '' } catch { return '' }
  }
  const brand = new URL(`${import.meta.env.BASE_URL}brand/`, window.location.origin)
  const student = record.student ?? {}
  const field = (label: string, value?: string | null) => `<div class="field"><span>${label}:</span><b>${escape(value)}</b></div>`
  const contact = (title: string, data?: ContactDetails) => `<h3>${title}</h3><table><thead><tr><th>Name</th><th>Address</th><th>Telephone</th><th>E-mail Address</th></tr></thead><tbody><tr><td>${escape(data?.name)}</td><td>${escape(data?.address)}</td><td>${escape(data?.telephone)}</td><td>${escape(data?.email)}</td></tr></tbody></table>`
  const passport = imageUrl(record.passportUrl)
  const signature = imageUrl(record.signatureUrl)
  const details = [['Surname', student.surname], ['Other Names', student.otherNames], ['Gender', student.gender], ['Marital Status', student.maritalStatus], ['Telephone', student.telephone], ['E-mail address', student.email], ['Faculty', student.faculty], ['Department', student.department], ['Degree/Diploma', student.degree], ['Mode of Study', student.modeOfStudy], ['Field of Interest', student.fieldOfInterest], ['Session of First Registration', student.firstRegistrationSession]].map(([label, value]) => field(label!, value)).join('')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Course Registration Form</title><style>
*{box-sizing:border-box;print-color-adjust:exact;-webkit-print-color-adjust:exact}body{font:11px/1.4 Arial;color:#172033;margin:0;background:#f5f7f9}.document{max-width:1000px;margin:auto;background:white;padding:20px}header{display:grid;grid-template-columns:70px minmax(0,1fr) 70px;gap:16px;align-items:center;text-align:center;border-bottom:2px solid #0A2B4F;padding-bottom:14px;margin-bottom:14px}header img{width:70px;height:70px;object-fit:contain}h1{font-size:17px;color:#0A2B4F;margin:0}header p{margin:5px}h2{font-size:15px;color:#0A2B4F;margin:5px}h3{font-size:12px;margin:16px 0 6px;color:#0A2B4F;break-after:avoid}.meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;background:#f2f6fa;padding:12px;margin-bottom:12px}.meta .field{display:block}.field{display:grid;grid-template-columns:42% minmax(0,1fr);gap:8px;padding:3px 0}.field span{color:#64748b}.field b{overflow-wrap:anywhere}.biodata{display:grid;grid-template-columns:minmax(0,1fr) 110px;gap:20px;border:1px solid #e5e7eb;padding:12px}.passport{width:110px;height:135px;border:1px solid #cbd5e1;display:flex;align-items:center;justify-content:center;text-align:center;color:#64748b}.passport img{width:100%;height:100%;object-fit:cover}table{width:100%;border-collapse:collapse;table-layout:fixed}td,th{padding:6px 8px;border:1px solid #e5e7eb;text-align:left;overflow-wrap:anywhere}thead{background:#0A2B4F;color:white;display:table-header-group}tr{break-inside:avoid}.courses th:nth-child(1){width:7%}.courses th:nth-child(2){width:17%}.courses th:nth-child(4){width:9%}.courses td:last-child{text-align:center}tfoot{font-weight:bold;background:#f2f6fa}.declaration{margin-top:20px;break-inside:avoid}.signature{width:310px;max-width:100%;margin:30px 0 0 auto;text-align:center;break-inside:avoid}.signature img{max-width:180px;height:65px;object-fit:contain}.signature .blank{height:65px;border-bottom:1px dashed #94a3b8}.notice{padding:10px;background:#fffbeb;color:#92400e;text-align:center}@media screen and (max-width:540px){.meta{grid-template-columns:1fr}.biodata{grid-template-columns:1fr}header{grid-template-columns:45px 1fr 45px;gap:8px}header img{width:45px;height:45px}h1{font-size:13px}.document{padding:12px}}@media print{@page{size:A4;margin:12mm}body{background:white}.document{padding:0;margin:0;max-width:none}}
</style></head><body><main class="document">${!import.meta.env.VITE_COURSE_FORMS_URL ? '' : ''}
<header><img src="${escape(new URL('pgc-logo.png', brand).href)}" alt="Postgraduate College logo"><div><h1>UNIVERSITY OF IBADAN, IBADAN, NIGERIA</h1><p><b>THE POSTGRADUATE COLLEGE</b></p><h2>COURSE REGISTRATION FORM</h2></div><img src="${escape(new URL('ui-logo.png', brand).href)}" alt="University of Ibadan logo"></header>
<div class="meta">${field('Application No', record.applicationNumber)}${field('Matriculation No', student.matric)}${field('Session', record.session)}</div>
<div class="biodata"><div>${details}</div><div class="passport">${passport ? `<img src="${passport}" alt="Student passport">` : 'Passport not provided'}</div></div>
${contact('SPONSOR', record.sponsor)}${contact('EMPLOYER', record.employer)}
<h3>SCHOOLS AND UNIVERSITIES ATTENDED</h3><table><thead><tr><th rowspan="2">School (include City and Country)</th><th colspan="2">Years Attended</th><th rowspan="2">Degree / Diploma Obtained</th><th rowspan="2">Course of Study / Discipline</th></tr><tr><th>From</th><th>To</th></tr></thead><tbody>${record.education?.length ? record.education.map((entry) => `<tr><td>${escape(entry.school)}</td><td>${escape(entry.from)}</td><td>${escape(entry.to)}</td><td>${escape(entry.qualification)}</td><td>${escape(entry.discipline)}</td></tr>`).join('') : '<tr><td colspan="5">Not provided</td></tr>'}</tbody></table>
<h3>COURSES REGISTERED FOR</h3><table class="courses"><thead><tr><th>S/N</th><th>Course Code</th><th>Course Title</th><th>Units</th></tr></thead><tbody>${record.courses.map((course, index) => `<tr><td>${index + 1}</td><td>${escape(course.code)}</td><td>${escape(course.title)}</td><td>${course.units}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="3">Total No of Units</td><td>${record.courses.reduce((sum, course) => sum + course.units, 0)}</td></tr></tfoot></table>
<div class="declaration"><p><b>Declaration:</b> I hereby declare that the particulars which I have supplied above are true. <b>Any alteration renders the document invalid.</b></p><p>Lockup Data Date: ${escape(record.lockedAt)}</p></div>
<div class="signature"><p><b>Secretary Postgraduate School</b><br>(Sign below with Date)</p>${signature ? `<img src="${signature}" alt="Secretary signature">` : '<div class="blank"></div>'}</div></main></body></html>`
}
