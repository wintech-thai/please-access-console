'use client'

import ComingSoon from '@/components/ComingSoon'
import { useLang } from '@/context/LanguageContext'
import { isAdmin } from '@/lib/web-role'

export default function SupportSettingPage() {
  const { t } = useLang()
  return <ComingSoon title={isAdmin ? t.nav.supportSetting : t.nav.supportCase} />
}
