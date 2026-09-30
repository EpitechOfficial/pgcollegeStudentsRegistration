import { Mail, Phone } from 'lucide-react'
import { COLLEGE } from '../data/portal'

export default function PortalFooter() {
  return (
    <footer className="mt-auto px-3 pb-4 sm:px-5 sm:pb-5">
      {/* Box treatment mirrors PortalHeader (navy card, rounded-2xl, white/10 border, deep shadow) in a darker shade */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#071D36] shadow-lg shadow-[#071D36]/25">
        <div className="flex flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
          {/* Copyright */}
          <p className="text-center text-xs text-white/70 sm:text-left">
            © {new Date().getFullYear()} {COLLEGE.shortName}, {COLLEGE.university}. All Rights Reserved.
          </p>

          {/* Help Desk Channels */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:gap-5">
            <a
              href={`mailto:${COLLEGE.email}`}
              className="inline-flex items-center gap-1.5 text-white/85 transition-colors hover:text-gold-light hover:underline"
            >
              <Mail className="h-3.5 w-3.5 text-gold-light" aria-hidden="true" />
              <span>{COLLEGE.email}</span>
            </a>
            <span className="hidden text-white/30 sm:inline" aria-hidden="true">•</span>
            <a
              href={`tel:${COLLEGE.phone.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-1.5 text-white/85 transition-colors hover:text-gold-light hover:underline"
            >
              <Phone className="h-3.5 w-3.5 text-gold-light" aria-hidden="true" />
              <span>{COLLEGE.phone} (9am - 4pm)</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
