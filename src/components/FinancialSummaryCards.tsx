import { CheckCircle2, Receipt, Wallet } from 'lucide-react'
import type { FinancialSummary } from '../types'
import { formatNaira } from '../data/portal'

interface FinancialSummaryCardsProps {
  data: FinancialSummary | null
  loading?: boolean
  enhancedStyle?: boolean
}

export default function FinancialSummaryCards({ data, loading = false, enhancedStyle = true }: FinancialSummaryCardsProps) {
  const value = (amount?: number) => loading
    ? 'Loading…'
    : amount === undefined
      ? 'Unavailable'
      : formatNaira(amount)

  const cards = [
    {
      id: 'total-fees',
      label: 'Total Fees',
      value: value(data?.totalFees),
      subtext: data?.session ? `${data.session} Session` : 'Current session',
      icon: Receipt,
      cardBg: 'border-[#16466E] bg-gradient-to-br from-[#0A2B4F] to-[#16466E]',
      iconBg: 'bg-[#FFBB00]/15 text-[#FFBB00] ring-1 ring-[#FFBB00]/25',
      labelClass: 'text-blue-100',
      subtextClass: 'text-blue-100/80',
      defaultIconBg: 'bg-[#0A2B4F]/5 text-[#0A2B4F]',
    },
    {
      id: 'amount-paid',
      label: 'Amount Paid',
      value: value(data?.amountPaid),
      subtext: 'All school fee payments',
      icon: CheckCircle2,
      cardBg: 'border-emerald-700 bg-gradient-to-br from-emerald-900 to-teal-700',
      iconBg: 'bg-emerald-200/15 text-emerald-100 ring-1 ring-emerald-100/20',
      labelClass: 'text-emerald-100',
      subtextClass: 'text-emerald-100/80',
      defaultIconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'wallet-balance',
      label: 'Wallet Balance',
      value: value(data?.walletBalance),
      subtext: 'Available wallet funds',
      icon: Wallet,
      cardBg: 'border-rose-700 bg-gradient-to-br from-rose-900 to-rose-700',
      iconBg: 'bg-rose-200/15 text-rose-100 ring-1 ring-rose-100/20',
      labelClass: 'text-rose-100',
      subtextClass: 'text-rose-100/80',
      defaultIconBg: 'bg-sky-50 text-sky-700',
    },
  ]

  return (
    <section aria-label="Financial summary">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {cards.map((card) => (
          <article
            key={card.id}
            className={`flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md sm:p-5 ${enhancedStyle ? 'border-[#E5E7EB] bg-white' : card.cardBg}`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${enhancedStyle ? 'text-[#495057]' : card.labelClass}`}>{card.label}</span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${enhancedStyle ? card.defaultIconBg : card.iconBg}`}
                aria-hidden="true"
              >
                <card.icon className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-3">
              <p className={`text-xl font-bold tracking-tight sm:text-2xl ${enhancedStyle ? 'text-[#212529]' : 'text-white'}`}>
                {card.value}
              </p>
              <div className={`mt-1 flex items-center justify-between text-xs ${enhancedStyle ? 'text-[#495057]' : card.subtextClass}`}>
                <span>{card.subtext}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
