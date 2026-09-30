import { CheckCircle2, CreditCard, Receipt, TriangleAlert } from 'lucide-react'
import type { FinancialSummary } from '../types'
import { formatNaira } from '../data/portal'

interface FinancialSummaryCardsProps {
  data: FinancialSummary
}

export default function FinancialSummaryCards({ data }: FinancialSummaryCardsProps) {
  const paidPercent = Math.min(100, Math.max(0, data.paidPercent))

  const cards = [
    {
      id: 'total-fees',
      label: 'Total Fees',
      value: formatNaira(data.totalFees),
      subtext: `${data.session} Session`,
      icon: Receipt,
      iconBg: 'bg-[#0A2B4F]/5 text-[#0A2B4F]',
    },
    {
      id: 'amount-paid',
      label: 'Amount Paid',
      value: formatNaira(data.amountPaid),
      subtext: `${paidPercent}% settled`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
      progress: paidPercent,
    },
    {
      id: 'outstanding',
      label: 'Outstanding Balance',
      value: formatNaira(data.outstanding),
      subtext: 'Payment required',
      icon: data.outstanding > 0 ? TriangleAlert : CreditCard,
      iconBg: data.outstanding > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600',
    },
  ]

  return (
    <section aria-label="Financial summary">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {cards.map((card) => (
          <article
            key={card.id}
            className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#495057]">{card.label}</span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${card.iconBg}`}
                aria-hidden="true"
              >
                <card.icon className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-3">
              <p className="text-xl font-bold tracking-tight text-[#212529] sm:text-2xl">
                {card.value}
              </p>
              <div className="mt-1 flex items-center justify-between text-xs text-[#495057]">
                <span>{card.subtext}</span>
              </div>

              {card.progress !== undefined && (
                <div
                  className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-valuenow={card.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
