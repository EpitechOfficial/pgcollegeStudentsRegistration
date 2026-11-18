export function formatDateEnGb(value: unknown, { month = '2-digit', fallback = '' } = {}) {
  if (!value) return fallback
  const input = String(value).trim()
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return input || fallback
  const [, year, monthNumber, day] = match
  if (month === 'long') {
    const name = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' })
      .format(new Date(Date.UTC(Number(year), Number(monthNumber) - 1, Number(day))))
    return `${Number(day)} ${name} ${year}`
  }
  return `${day}/${monthNumber}/${year}`
}
