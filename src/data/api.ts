// The Postman collection's base_url ends in /public/api.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://pgcollege.ui.edu.ng/registrationbackend/public/api').replace(/\/+$/, '')
export function apiUrl(path: string): string {
  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`
}
