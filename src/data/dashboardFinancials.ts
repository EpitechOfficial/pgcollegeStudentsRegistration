import type { FinancialSummary } from '../types'
import { loadFeeSchedule } from './paymentsApi'
import { loadPayments } from './payments'
import { loadWalletBalance } from './wallet'

export async function loadDashboardFinancials(signal: AbortSignal): Promise<FinancialSummary> {
  const [schedule, payments, wallet] = await Promise.all([
    loadFeeSchedule(signal),
    loadPayments(signal, true),
    loadWalletBalance(signal),
  ])
  const amountPaid = payments.records
    .filter((record) => record.feeType === 'school-fees' && record.status === 'successful')
    .reduce((total, record) => total + record.amount, 0)
  return { totalFees: schedule.total, amountPaid, walletBalance: wallet.balance, session: schedule.session }
}
