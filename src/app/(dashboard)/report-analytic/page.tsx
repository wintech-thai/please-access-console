'use client'

import ComingSoon from '@/components/ComingSoon'
import { useLang } from '@/context/LanguageContext'

export default function ReportAnalyticPage() {
  const { t } = useLang()
  return <ComingSoon title={t.nav.reportAnalytic} />
}
