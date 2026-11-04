import type { LucideIcon } from 'lucide-react'

export interface Student {
  name: string
  nameForForms: string
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
  walletBalance: number
  session: string
}

export interface PortalService {
  id: string
  label: string
  icon: LucideIcon
  /** Service is currently locked on the portal (not accessible) */
  locked?: boolean
  /**
   * Interactive action bound to this service:
   * - `lock-info` toggles the student info lock (Lock Up)
   * - `register-courses` opens the course registration screen
   */
  action?: 'lock-info' | 'register-courses' | 'external-link'
  externalUrl?: string
}

export type CourseType = 'Core' | 'Elective' | 'Required'

export interface CourseOption {
  id?: number
  code: string
  title: string
  type: CourseType
  units: number
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
