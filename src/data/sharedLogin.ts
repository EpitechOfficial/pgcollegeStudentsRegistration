export const APPLICATION_LOGIN_URL = import.meta.env.VITE_APPLICATION_LOGIN_URL || (import.meta.env.DEV
  ? 'http://localhost:5175/login'
  : 'https://app.pgcollege.ui.edu.ng/applicationfrontend/login')

export function validHandoffMessage(event: MessageEvent, opener: Window | null, nonce: string): boolean {
  return !!opener && event.source === opener && event.origin === new URL(APPLICATION_LOGIN_URL).origin &&
    event.data?.type === 'pgc:registration-token' && event.data?.nonce === nonce &&
    typeof event.data?.token === 'string' && !!event.data.token.trim()
}
