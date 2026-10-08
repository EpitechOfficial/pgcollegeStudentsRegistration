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
  Upload,
} from 'lucide-react'
import type { FinancialSummary, ServiceSection, Student } from '../types'

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
  matric: '03571',
  applicationNumber: 'PGS202403571',
  degree: 'M.Sc.',
  modeOfStudy: 'Full-time',
  programme: 'M.Sc. Economics',
  department: 'Economics',
  faculty: 'Faculty of Economics',
}

/* ------------------------------------------------------------------ */
/* Financial summary — the three approved metrics only                 */
/* ------------------------------------------------------------------ */
export const SCHOOL_FEE_ITEMS = [
  { description: 'Registration-Tuition Fee', amount: 30_000 },
  { description: 'Examination Fee', amount: 50_000 },
  { description: 'Health Insurance Premium', amount: 7_500 },
  { description: 'Postgraduate Development Fee', amount: 10_000 },
  { description: 'Postgraduate Regulations and Publications Fee', amount: 10_000 },
  { description: 'I.D. Card', amount: 12_500 },
  { description: 'U.I. Development Levy', amount: 10_000 },
  { description: 'Faculty Registration', amount: 5_000 },
  { description: 'Departmental Registration (Major)', amount: 7_500 },
  { description: 'Portal Access Fees', amount: 4_000 },
  { description: 'Students Welfare Insurance Scheme', amount: 1_000 },
  { description: 'Library Registration', amount: 4_000 },
  { description: 'Sports', amount: 1_000 },
  { description: 'Student Union fee/levy', amount: 200 },
  { description: 'Career and Counselling', amount: 1_000 },
  { description: 'Supervision Fee', amount: 25_000 },
  { description: 'Department Facilities Upgrade Fee', amount: 10_000 },
  { description: 'ITeMS Internet Fee', amount: 8_000 },
  { description: 'Induction-Oath taking fees', amount: 5_000 },
  { description: 'Lapse Registration Charge', amount: 0 },
  { description: 'Program Tuition/Fee (Late Registration Charge)', amount: 0 },
  { description: 'Utility Fee', amount: 20_000 },
]

export const SCHOOL_FEE_TOTAL = SCHOOL_FEE_ITEMS.reduce((total, item) => total + item.amount, 0)

export const SCHOOL_FEE_SCHEDULE = {
  faculty: STUDENT.faculty,
  department: STUDENT.department,
  modeOfStudy: STUDENT.modeOfStudy,
  degree: STUDENT.degree,
  studentType: 'New',
  session: CURRENT_SESSION,
  items: SCHOOL_FEE_ITEMS,
}

export const FINANCIALS: FinancialSummary = {
  totalFees: SCHOOL_FEE_TOTAL,
  amountPaid: 180_000,
  outstanding: SCHOOL_FEE_TOTAL - 180_000,
  session: CURRENT_SESSION,
  paidPercent: Math.round(180_000 / SCHOOL_FEE_TOTAL * 100),
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
      { id: 'generate-invoice', label: 'Pay School Fees', icon: CreditCard },
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
      { id: 'register-courses', label: 'Register Courses', icon: BookOpen },
      { id: 'print-course-form', label: 'Print Course Form', icon: Printer },
      { id: 'lock-up', label: 'Lock Up', icon: Lock, action: 'lock-info' },
    ],
  },
  {
    id: 'medicals',
    title: 'Medicals / Passport',
    note: 'Health record and personal details',
    services: [
      { id: 'edit-medical', label: 'Medical Record', icon: HeartPulse },
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
