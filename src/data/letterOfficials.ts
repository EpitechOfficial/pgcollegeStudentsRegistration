export interface LetterOfficial {
  id: number | string
  officer_type: string
  title: string
  name: string
  credentials: string | null
  mobile: string | null
  email: string | null
  secondary_email: string | null
  is_active: boolean | number | string
  created_at?: string
  updated_at?: string
}

// Preview fixtures from the supplied table; never used as a fallback for a failed API request.
const DEMO_OFFICIALS: LetterOfficial[] = [
  { id: 1, officer_type: 'provost', title: 'Provost', name: 'Prof. K. M. Samuel', credentials: 'B. A. (Ife), PGDE (Ilorin), M. A. Ph.D (Ibadan)', mobile: '+2348034781804', email: 'provost@pgcollege.ui.edu.ng', secondary_email: 'symphonykay@gmail.com', is_active: 1 },
  { id: 2, officer_type: 'deputy_registrar', title: 'Deputy Registrar', name: 'A. O. Olaoye', credentials: 'B.A.(Hons)Ife, MMP(Ibadan), MANUPA, MCIPDM.', mobile: '08067904060', email: 'deputyregistrar@pgcollege.ui.edu.ng', secondary_email: null, is_active: 1 },
  { id: 3, officer_type: 'deputy_provost_admin', title: 'Deputy Provost (Administration)', name: 'Prof. A. O. Abolaji', credentials: 'B.Sc. (Ile-Ife), M.Sc. (Lagos), Ph.D. (Calabar)', mobile: '+2348068614194', email: 'deputyprovostadmin@pgcollege.ui.edu.ng', secondary_email: 'amosabolajiao@gmail.com', is_active: 1 },
  { id: 4, officer_type: 'deputy_provost_academic', title: 'Deputy Provost', name: 'Prof. Olalekan (John) Taiwo', credentials: 'B.Sc (Geography), M.Sc (Geography), MGIS (Geographic Information Systems), Ph.D. (Geography)', mobile: '+2348029188696', email: 'deputyprovostacademic@pgcollege.ui.edu.ng', secondary_email: 'olalekantaiwo@gmail.com', is_active: 1 },
]

export function activeLetterOfficials(records: LetterOfficial[]): LetterOfficial[] {
  return records.filter((record) => record.is_active === true || record.is_active === 1 || record.is_active === '1')
}

export async function loadLetterOfficials(signal: AbortSignal): Promise<LetterOfficial[]> {
  const endpoint = import.meta.env.VITE_LETTER_OFFICIALS_URL
  if (!endpoint) { signal.throwIfAborted(); return DEMO_OFFICIALS }
  const response = await fetch(endpoint, { credentials: 'include', headers: { Accept: 'application/json' }, signal })
  if (!response.ok) throw new Error('Unable to load letter officials')
  const payload = await response.json()
  const records: unknown = Array.isArray(payload) ? payload : payload?.data
  if (!Array.isArray(records) || !records.every((record) => {
    if (!record || typeof record !== 'object') return false
    return (typeof record.id === 'number' || typeof record.id === 'string') &&
      ['officer_type', 'title', 'name'].every((key) => typeof record[key] === 'string') &&
      ['credentials', 'mobile', 'email', 'secondary_email'].every((key) => record[key] === null || typeof record[key] === 'string') &&
      [true, false, 0, 1, '0', '1'].includes(record.is_active)
  })) throw new Error('Invalid letter officials response')
  return activeLetterOfficials(records as LetterOfficial[])
}
