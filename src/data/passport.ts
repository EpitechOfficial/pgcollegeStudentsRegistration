import { isDemoSession } from './auth'
import { apiUrl } from './api'
import { medicalObject, medicalRequest } from './medicalApi'
export interface PassportRecord { url: string | null; locked: boolean }
let draftUrl: string | null = null
function passportUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Passport URL missing from response.')
  const url = new URL(value, apiUrl('medical/passport'))
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid passport URL.')
  return url.href
}
export async function loadPassport(signal: AbortSignal): Promise<PassportRecord> {
  if (isDemoSession()) return { url: draftUrl, locked: false }
  const payload = await medicalRequest('medical/passport', signal)
  const data = medicalObject(payload.data)
  if (typeof payload.is_locked !== 'boolean' || typeof data.has_passport !== 'boolean') throw new Error('Invalid passport response.')
  return { url: data.has_passport ? passportUrl(data.url) : null, locked: payload.is_locked }
}
export async function uploadPassport(file: File, signal: AbortSignal): Promise<string> {
  if (!['image/jpeg', 'image/png'].includes(file.type) || file.size === 0 || file.size > 2 * 1024 * 1024) throw new Error('Choose a JPG or PNG image up to 2 MB.')
  if (isDemoSession()) {
    if (draftUrl) URL.revokeObjectURL(draftUrl)
    draftUrl = URL.createObjectURL(file)
    return draftUrl
  }
  const form = new FormData()
  form.append('photo', file)
  const payload = await medicalRequest('medical/passport', signal, 'POST', form)
  const url = new URL(passportUrl(medicalObject(payload.data).url))
  url.searchParams.set('v', String(Date.now()))
  return url.href
}
