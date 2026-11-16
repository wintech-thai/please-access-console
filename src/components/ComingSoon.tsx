'use client'

import { Clock } from 'lucide-react'
import { useLang } from '@/context/LanguageContext'

export default function ComingSoon({ title }: { title: string }) {
  const { t } = useLang()

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 mx-auto mb-4">
          <Clock className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">{title}</h1>
        <p className="text-gray-500">{t.overview.comingSoonDesc}</p>
      </div>
    </div>
  )
}
