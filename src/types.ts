import type { LucideIcon } from 'lucide-react'

export interface Student {
  name: string
  matric: string
  applicationNumber: string
  degree: string
  modeOfStudy: string
  programme: string
  department: string
  faculty: string
}

export interface FinancialSummary {
  totalFees: number
  amountPaid: number
  outstanding: number
  session: string
  paidPercent: number
}

export interface PortalService {
  id: string
  label: string
  icon: LucideIcon
  /** Service is currently locked on the portal (not accessible) */
  locked?: boolean
  /** Interactive action bound to this service (e.g. Lock Up toggles the student info lock) */
  action?: 'lock-info'
}

export interface ServiceSection {
  id: string
  title: string
  /** Short institutional note under the section title */
  note?: string
  services: PortalService[]
}

export interface Credentials {
  matric: string
  password: string
  remember: boolean
}
