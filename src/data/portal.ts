import {
  BadgeCheck,
  Banknote,
  BookOpen,
  ClipboardList,
  Clock,
  CreditCard,
  Download,
  FileCheck,
  FileText,
  GraduationCap,
  HeartPulse,
  Landmark,
  Lock,
  Printer,
  Receipt,
  ReceiptText,
  RefreshCw,
  ScanEye,
  Stethoscope,
  Upload,
} from 'lucide-react'
import type { CourseOption, FinancialSummary, ServiceSection, Student } from '../types'

/* ------------------------------------------------------------------ */
/* Institutional identity — official contacts of the Postgraduate      */
/* College, University of Ibadan (pgcollege.ui.edu.ng)                 */
/* ------------------------------------------------------------------ */
export const COLLEGE = {
  shortName: 'The Postgraduate College',
  university: 'University of Ibadan',
  portalTitle: 'Registration Portal',
  email: 'informationdesk@pgcollege.ui.edu.ng',
  altEmail: 'pgcollegeuiinformationdesk@gmail.com',
  phone: '+234 907 1871 740',
  address: 'University of Ibadan, Oyo State, Nigeria',
} as const

export const CURRENT_SESSION = '2025/2026' as const

/* ------------------------------------------------------------------ */
/* Signed-in student (portal session data)                             */
/* ------------------------------------------------------------------ */
export const STUDENT: Student = {
  name: 'Alake Emmanuel',
  matric: 'PG/2024/03571',
  programme: 'M.Sc. Economics',
  department: 'Economics',
  faculty: 'Faculty of Economics',
}

/* ------------------------------------------------------------------ */
/* Financial summary — the three approved metrics only                 */
/* ------------------------------------------------------------------ */
export const FINANCIALS: FinancialSummary = {
  totalFees: 245_000,
  amountPaid: 180_000,
  outstanding: 65_000,
  session: CURRENT_SESSION,
  paidPercent: 73,
}

/* ------------------------------------------------------------------ */
/* Service catalogue — exact portal wording, grouped into sections     */
/* ------------------------------------------------------------------ */
export const SERVICE_SECTIONS: ServiceSection[] = [
  {
    id: 'process',
    title: 'Process',
    note: 'Registration and programme documents',
    services: [
      { id: 'generate-invoice', label: 'Generate Invoice', icon: FileText },
      { id: 'suspend-programme', label: 'Suspend Programme', icon: Landmark },
      { id: 'reactivation-form', label: 'Download Reactivation Form', icon: Download },
      { id: 'clearance-form', label: 'Admission Clearance Form', icon: FileCheck },
      { id: 'result-notification', label: 'Print Notification of Result', icon: Printer },
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    note: 'Fees, receipts and financial clearance',
    services: [
      { id: 'schedule-of-fees', label: 'Schedule of Fees', icon: Receipt },
      { id: 'print-receipt', label: 'Print Receipt', icon: ReceiptText },
      { id: 'financial-clearance', label: 'Print Financial Clearance', icon: BadgeCheck },
      { id: 'payment-record', label: 'Payment Record', icon: CreditCard },
    ],
  },
  {
    id: 'course-form',
    title: 'Course Form',
    note: 'Course registration for the current session',
    services: [
      { id: 'register-courses', label: 'Register Courses', icon: BookOpen, action: 'register-courses' },
      { id: 'print-course-form', label: 'Print Course Form', icon: Printer },
      { id: 'lock-up', label: 'Lock Up', icon: Lock, action: 'lock-info' },
    ],
  },
  {
    id: 'medicals',
    title: 'Medicals / Biodata',
    note: 'Health record and personal details',
    services: [
      { id: 'edit-medical', label: 'Edit Medical Record', icon: HeartPulse },
      { id: 'print-medical', label: 'Print Medical Record', icon: Stethoscope },
      { id: 'upload-passport', label: 'Upload Passport', icon: Upload },
    ],
  },
  {
    id: 'examination',
    title: 'Examination Process',
    note: 'Thesis title and doctoral administration',
    services: [
      { id: 'thesis-title', label: 'Registration of Title of Thesis', icon: FileText },
      { id: 'track-thesis', label: 'Track Registration of Title of Thesis', icon: ClipboardList },
      { id: 'print-thesis', label: 'Print Registration of Title of Thesis', icon: Printer },
      { id: 'conversion', label: 'M.Phil/Ph.D to Ph.D Conversion', icon: GraduationCap },
      { id: 'correction', label: 'Certification of Correction of Thesis', icon: ScanEye },
      { id: 'doctoral-academy', label: 'Doctoral Academy', icon: RefreshCw },
    ],
  },
  {
    id: 'wallet',
    title: 'Wallet',
    note: 'Deposits and online payments',
    services: [
      { id: 'deposit', label: 'Deposit', icon: Banknote },
      { id: 'make-payment', label: 'Make Payment', icon: CreditCard },
      { id: 'history', label: 'History', icon: Clock },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Course catalogue — the courses a student may register this session,  */
/* mirroring the approved programme outline for M.Sc. Economics.        */
/* ------------------------------------------------------------------ */
export const COURSE_CATALOGUE: CourseOption[] = [
  { code: 'RES 701', title: 'Research Methodology', type: 'Required', units: 3 },
  { code: 'STA 701', title: 'Statistical Methods', type: 'Required', units: 3 },
  { code: 'GST 701', title: 'Academic Writing and Communication', type: 'Required', units: 2 },
  { code: 'RES 703', title: 'Research Ethics', type: 'Elective', units: 2 },
  { code: 'RES 705', title: 'Qualitative Research Methods', type: 'Elective', units: 3 },
  { code: 'RES 707', title: 'Quantitative Research Methods', type: 'Elective', units: 3 },
]

/** Courses pre-selected when the registration screen opens. */
export const DEFAULT_SELECTED_CODES: string[] = ['RES 701', 'STA 701', 'GST 701', 'RES 703']

/** The minimum number of units a postgraduate student must register each session. */
export const MIN_REGISTRATION_UNITS = 10

export const TOTAL_SERVICE_COUNT = SERVICE_SECTIONS.reduce(
  (total, section) => total + section.services.length,
  0,
)

/* ------------------------------------------------------------------ */
/* Formatting helper                                                   */
/* ------------------------------------------------------------------ */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}
