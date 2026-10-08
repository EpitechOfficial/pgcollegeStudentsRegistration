export type MedicalValues = Record<string, string>
export const MEDICAL_CONDITIONS = [
  ['tuberculosis', 'Tuberculosis'], ['schistosomiasis', 'Schistosomiasis'],
  ['respiratory', 'Respiratory disease'], ['sickleCell', 'Sickle cell disease'],
  ['allergies', 'Allergies'], ['diabetes', 'Diabetes'],
  ['digestive', 'Disease of the digestive system'], ['heart', 'Heart disease'],
  ['genitourinary', 'Genitourinary system disease'], ['nervous', 'Nervous disease'],
] as const
export const FAMILY_CONDITIONS = [['tuberculosis', 'Tuberculosis'], ['diabetes', 'Diabetes'], ['hypertension', 'Hypertension'], ['mentalIllness', 'Mental illness']] as const
export const IMMUNIZATIONS = [['hepatitis', 'Hepatitis'], ['tetanus', 'Tetanus'], ['yellowFever', 'Yellow fever'], ['meningitis', 'Cerebrospinal meningitis']] as const
// Unconnected forms stay in memory only; medical details are not stored in browser storage.
let draft: MedicalValues = {}
export function buildMedicalDocument(values: MedicalValues): string {
  const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
  const row = (key: string, label: string) => `<tr><th>${escape(label)}</th><td>${escape(values[key] || 'Not provided')}</td></tr>`
  const section = (title: string, fields: readonly (readonly [string, string])[]) => `<h2>${title}</h2><table>${fields.map(([key, label]) => row(key, label)).join('')}</table>`
  const brand = new URL(`${import.meta.env.BASE_URL}brand/`, window.location.origin)
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Medical Record</title><style>*{box-sizing:border-box}body{margin:0;color:#172033;font:12px/1.5 Arial,sans-serif}.document{max-width:900px;margin:auto;padding:24px}header{display:grid;grid-template-columns:65px 1fr 65px;gap:16px;align-items:center;text-align:center;border-bottom:2px solid #0A2B4F;padding-bottom:16px}header img{width:65px;height:65px;object-fit:contain}h1{font-size:18px;margin:0;color:#0A2B4F}header p{margin:4px}h2{font-size:13px;color:#0A2B4F;margin:18px 0 8px}table{width:100%;border-collapse:collapse}th,td{padding:6px 10px;border:1px solid #e5e7eb;text-align:left;vertical-align:top;overflow-wrap:anywhere;white-space:pre-wrap}th{width:58%;font-weight:500;background:#f5f7fa}tr{break-inside:avoid}.notice{background:#fffbeb;padding:10px;text-align:center}@media print{@page{size:A4;margin:12mm}.document{padding:0}h2{break-after:avoid}}</style></head><body><main class="document">${!import.meta.env.VITE_MEDICAL_RECORD_URL ? '' : ''}<header><img src="${escape(new URL('pgc-logo.png', brand).href)}" alt="Postgraduate College logo"><div><h1>UNIVERSITY OF IBADAN</h1><p>The Postgraduate College</p><b>Health Record</b></div><img src="${escape(new URL('ui-logo.png', brand).href)}" alt="University of Ibadan logo"></header>${section('Student Details', [['studentName', 'Name'], ['applicationNumber', 'Application Number']])}${section('Contact Person', [['contactName', 'Name'], ['contactAddress', 'Address'], ['contactTelephone', 'Telephone']])}${section('Personal Medical History', [['healthStatus', 'Health Status'], ['hospitalAdmission', 'Previous in-patient hospital admission'], ...(values.hospitalAdmission === 'Yes' ? [['admissionDetails', 'Admission reason, hospital and date'] as const] : []), ['medication', 'Currently on medication'], ...(values.medication === 'Yes' ? [['medicationDetails', 'Drugs and dosage'] as const] : [])])}${section('Medical Conditions — Current or Previous', MEDICAL_CONDITIONS.map(([key, label]) => [`condition_${key}`, label] as const))}${section('Additional History', [...(MEDICAL_CONDITIONS.some(([key]) => values[`condition_${key}`] === 'Yes') ? [['conditionDetails', 'Condition details and dates'] as const] : []), ['otherHistory', 'Other relevant medical history'], ['travelHistory', 'Travel history with dates']])}${section('Family Medical History', [['familyHealthy', 'Is your family healthy?'], ...FAMILY_CONDITIONS.map(([key, label]) => [`family_${key}`, label] as const)])}${section('Drug Reactions', [['drugReaction', 'Do you react to any drugs?'], ...(values.drugReaction === 'Yes' ? [['drugDetails', 'Drugs and reactions'] as const] : [])])}${section('Immunizations', IMMUNIZATIONS.map(([key, label]) => [`immunization_${key}`, label] as const))}</main></body></html>`
}
export async function loadMedical(signal: AbortSignal): Promise<MedicalValues> {
  const endpoint = import.meta.env.VITE_MEDICAL_RECORD_URL
  if (!endpoint) return { ...draft }
  const response = await fetch(endpoint, { credentials: 'include', signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('Unable to load medical record.')
  const payload = await response.json()
  const values = payload.data ?? payload
  if (!values || typeof values !== 'object' || Array.isArray(values) || !Object.values(values).every((value) => typeof value === 'string')) throw new Error('Invalid medical record.')
  return values
}
export async function saveMedical(values: MedicalValues, signal: AbortSignal): Promise<boolean> {
  const endpoint = import.meta.env.VITE_MEDICAL_RECORD_URL
  if (!endpoint) { draft = { ...values }; return false }
  const response = await fetch(endpoint, { method: 'PUT', credentials: 'include', signal, headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(values) })
  if (!response.ok) throw new Error('Unable to save medical record.')
  return true
}
