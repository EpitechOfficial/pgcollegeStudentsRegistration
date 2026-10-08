export const REACTIVATION_FORM_URL = `${import.meta.env.BASE_URL}forms/reactivation-form.doc`
export type ReactivationValues = Record<string, string>

export const REACTIVATION_FIELDS = [
  { name: 'session', label: 'Session', placeholder: 'e.g. 2026/27' },
  { name: 'matric', label: 'Matric No.' },
  { name: 'fullName', label: 'Name in Full (Surname First)' },
  { name: 'address', label: 'Address During Session', multiline: true },
  { name: 'email', label: 'E-mail Address', type: 'email' },
  { name: 'phone', label: 'Telephone Number', type: 'tel' },
  { name: 'sponsor', label: 'Name and Address of Sponsor', multiline: true, optional: true },
  { name: 'employer', label: 'Name and Address of Employer (if different from sponsor)', multiline: true, optional: true },
  { name: 'department', label: 'Department' },
  { name: 'faculty', label: 'Faculty' },
  { name: 'degree', label: 'Degree in View' },
  { name: 'firstRegistration', label: 'Date of First Registration', type: 'date' },
  { name: 'lastRegistration', label: 'Date of Last Registration', type: 'date' },
  { name: 'semesters', label: 'Total Number of Semesters Already Completed', type: 'number' },
] as const

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

export function buildReactivationDocument(values: ReactivationValues): string {
  const brandUrl = new URL(`${import.meta.env.BASE_URL}brand/`, window.location.origin)
  const pgLogo = escapeHtml(new URL('pgc-logo.png', brandUrl).href)
  const uiLogo = escapeHtml(new URL('ui-logo.png', brandUrl).href)
  const title = `Reactivation of ${values.kind === 'lapsed' ? 'Lapsed' : 'Suspended'} Registration`
  const line = (label: string, value: string) => `<div class="field"><b>${escapeHtml(label)}:</b><span>${escapeHtml(value || 'Not applicable')}</span></div>`
  const rows = REACTIVATION_FIELDS.map((field) => line(field.label, values[field.name])).join('')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f5f7f9;color:#172033;font:13px/1.5 Arial,sans-serif}main{max-width:820px;margin:16px auto;padding:30px;background:white;border:1px solid #e5e7eb}header{text-align:center;border-bottom:2px solid #0A2B4F;padding-bottom:16px;margin-bottom:20px}h1{font-size:18px;color:#0A2B4F;text-transform:uppercase}header p{margin:4px}.field{display:grid;grid-template-columns:46% 54%;padding:9px 0;border-bottom:1px solid #e5e7eb;break-inside:avoid}.field span{white-space:pre-wrap;overflow-wrap:anywhere}.signatures{margin-top:24px}.approval{margin-top:24px;break-inside:avoid}.blank{height:60px;border-bottom:1px solid #94a3b8}.signature{display:flex;justify-content:space-between;gap:20px;margin:30px 0}.note{color:#64748b;font-size:12px}@media(max-width:540px){main{padding:16px;margin:0}.field{grid-template-columns:1fr;gap:4px}}@media print{@page{size:A4;margin:15mm}body{background:white}main{margin:0;padding:0;border:0;max-width:none}.field{grid-template-columns:46% 54%}}</style></head><body><main>
<style>
header{display:grid;grid-template-columns:76px minmax(0,1fr) 76px;align-items:center;gap:16px;break-inside:avoid}
.form-logo{width:76px;height:76px;object-fit:contain}
@media(max-width:540px){header{grid-template-columns:48px minmax(0,1fr) 48px;gap:8px}.form-logo{width:48px;height:48px}header h1{font-size:14px}header p{font-size:11px}}
@media print{header{grid-template-columns:76px minmax(0,1fr) 76px;gap:16px}.form-logo{width:76px;height:76px}}
</style>
<header><img class="form-logo" src="${pgLogo}" alt="Postgraduate College logo"><div><p><b>UNIVERSITY OF IBADAN, IBADAN, NIGERIA</b></p><p><b>POSTGRADUATE COLLEGE</b></p><h1>${title}</h1><p>(To be completed in quintuplicate)</p></div><img class="form-logo" src="${uiLogo}" alt="University of Ibadan logo"></header>
${rows}${line('Mode of Study', values.modeOfStudy)}
${values.kind === 'lapsed' ? line('For how many sessions did you fail to register?', `${values.missedSessions} ${values.missedSessions === '1' ? 'Session' : 'Sessions'}`) : line('For how long did you suspend your registration for Higher Degree Programme?', values.suspensionDuration)}
${line('Are you now prepared to continue and complete your programme without any further interruption?', values.ready)}
${values.kind === 'suspended' ? line('How do you intend to finance the course?', values.finance) : ''}
<div class="signatures"><div class="signature"><span>Candidate’s Signature: ____________________</span><span>Date: ______________</span></div></div>
<section class="approval"><b>Comments of the Head of Department</b><div class="blank"></div><div class="blank"></div></section>
<div class="signature"><span>Secretary Postgraduate College: ____________________</span><span>Date: ______________</span></div>
<section class="approval"><b>Comments of the Provost of the Postgraduate College</b><div class="blank"></div><p>Date: ______________</p></section>
<p class="note">Prepared from the student’s entered details. This form requires signatures and college processing; generating it does not reactivate registration.</p>
</main></body></html>`
}
