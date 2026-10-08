let draftUrl: string | null = null
function passportUrl(payload: unknown): string | null {
  const record = payload as { data?: { passportUrl?: unknown }; passportUrl?: unknown }
  const value = record?.data?.passportUrl ?? record?.passportUrl
  if (value == null || value === '') return null
  if (typeof value !== 'string') throw new Error('Invalid passport response')
  const url = new URL(value, window.location.origin)
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid passport URL')
  return url.href
}
export async function loadPassport(signal: AbortSignal): Promise<string | null> {
  const endpoint = import.meta.env.VITE_PASSPORT_URL
  if (!endpoint) return draftUrl
  const response = await fetch(endpoint, { credentials: 'include', headers: { Accept: 'application/json' }, signal })
  if (!response.ok) throw new Error('Unable to load passport')
  return passportUrl(await response.json())
}
export async function uploadPassport(file: File, signal: AbortSignal): Promise<string> {
  const endpoint = import.meta.env.VITE_PASSPORT_URL
  if (!endpoint) {
    if (draftUrl) URL.revokeObjectURL(draftUrl)
    draftUrl = URL.createObjectURL(file)
    return draftUrl
  }
  const form = new FormData()
  form.append('passport', file)
  const response = await fetch(endpoint, { method: 'POST', credentials: 'include', headers: { Accept: 'application/json' }, body: form, signal })
  if (!response.ok) throw new Error('Unable to upload passport')
  const url = passportUrl(await response.json())
  if (!url) throw new Error('Passport URL missing from upload response')
  return url
}
