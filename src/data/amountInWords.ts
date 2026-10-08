const SMALL = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
function words(value: number): string {
  if (value < 20) return SMALL[value]
  if (value < 100) return `${TENS[Math.floor(value / 10)]}${value % 10 ? ` ${SMALL[value % 10]}` : ''}`
  if (value < 1000) return `${SMALL[Math.floor(value / 100)]} Hundred${value % 100 ? ` and ${words(value % 100)}` : ''}`
  for (const [size, label] of [[1e12, 'Trillion'], [1e9, 'Billion'], [1e6, 'Million'], [1000, 'Thousand']] as const) {
    if (value >= size) return `${words(Math.floor(value / size))} ${label}${value % size ? `${value % size < 100 ? ' and ' : ' '}${words(value % size)}` : ''}`
  }
  return ''
}
export function amountInWords(amount: number): string {
  const kobo = Math.round(amount * 100)
  if (!Number.isSafeInteger(kobo) || kobo < 0) return 'Not available'
  return `${words(Math.floor(kobo / 100))} Naira${kobo % 100 ? ` and ${words(kobo % 100)} Kobo` : ''} Only`
}
