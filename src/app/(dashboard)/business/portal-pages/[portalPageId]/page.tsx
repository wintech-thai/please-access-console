'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { portalPageApi } from '@/lib/api/portal-page.api'
import { useTenant } from '@/context/TenantContext'
import type { PortalPageItem } from '@/lib/api/types'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import clsx from 'clsx'
import { useLang } from '@/context/LanguageContext'

export default function TenantPortalPageDetailPage() {
  const { t } = useLang()
  const tp = t.portalPage
  const router = useRouter()
  const params = useParams()
  const portalPageId = params.portalPageId as string
  const { selectedOrg } = useTenant()
  const orgId = selectedOrg?.orgCustomId || selectedOrg?.orgId || ''

  const [page, setPage] = useState<PortalPageItem | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    try {
      const res = await portalPageApi.getPortalPageById(orgId, portalPageId)
      setPage(res.data?.portalPage ?? null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tp.failedToLoad)
    } finally {
      setLoading(false)
    }
  }, [orgId, portalPageId, tp.failedToLoad])

  useEffect(() => { loadData() }, [loadData])

  const goBack = () => router.push('/business/portal-pages')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <svg className="w-6 h-6 animate-spin mr-2 text-primary-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {t.admin.loading}
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden h-[calc(100dvh-5rem)] sm:h-[calc(100dvh-6.5rem)]">
      <div className="flex-none flex items-center gap-3 mb-6">
        <button onClick={goBack} className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tp.viewTitle}</h1>
          <p className="text-base text-gray-500 mt-0.5">{tp.viewSubtitle}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-2 custom-scrollbar">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-7 py-6 flex flex-col gap-4">
          <FormField label={tp.fieldCode}>
            <input value={page?.code ?? ''} disabled className={inputCls} />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label={tp.fieldAuthMethod}>
              <select value={page?.authMethod ?? 'Native'} disabled className={inputCls}>
                <option value="Native">Native</option>
                <option value="Google">Google</option>
              </select>
            </FormField>
            <FormField label={tp.fieldTheme}>
              <select value={page?.theme ?? 'Default'} disabled className={inputCls}>
                <option value="Default">Default</option>
              </select>
            </FormField>
            <FormField label={tp.fieldRealm}>
              <select value={page?.realmId ?? ''} disabled className={inputCls}>
                <option value={page?.realmId ?? ''}>{page?.realmName || tp.noRealmOption}</option>
              </select>
            </FormField>
          </div>

          <FormField label={tp.fieldRedirectUrl}>
            <div className="flex flex-col sm:flex-row gap-2">
              <select value={page?.redirectUrlMode ?? 'Direct'} disabled className={clsx(inputCls, 'sm:w-56 flex-none')}>
                <option value="Direct">{tp.redirectModeDirect}</option>
                <option value="Parameter">{tp.redirectModeParameter}</option>
              </select>
              <input value={page?.redirectUrlValue ?? ''} disabled className={clsx(inputCls, 'flex-1')} />
            </div>
            <p className="text-xs text-gray-400 mt-1">{page?.redirectUrlMode === 'Parameter' ? tp.redirectUrlHintParameter : tp.redirectUrlHintDirect}</p>
          </FormField>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={page?.isDefault === true} disabled className="rounded border-gray-300 text-primary-600 w-4 h-4" />
            {tp.fieldIsDefault}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={page?.isEnabled === true} disabled className="rounded border-gray-300 text-primary-600 w-4 h-4" />
            {tp.fieldIsEnabled}
          </label>

          <FormField label={tp.fieldLanguage}>
            <div className="flex gap-3">
              <LanguageOption label={tp.languageThai} checked={(page?.language ?? 'Thai') === 'Thai'} />
              <LanguageOption label={tp.languageEnglish} checked={page?.language === 'English'} />
            </div>
          </FormField>
        </div>
      </div>

      <div className="flex-none -mx-3 sm:-mx-6 px-4 sm:px-8 py-4 flex items-center justify-end gap-3 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <span className="invisible px-5 py-2.5 text-sm font-medium border border-transparent">{t.admin.cancel}</span>
      </div>
    </div>
  )
}

function LanguageOption({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className={clsx(
      'px-4 py-2 text-sm font-medium rounded-lg border',
      checked ? 'bg-primary-50 border-primary-400 text-primary-700' : 'bg-white border-gray-200 text-gray-400'
    )}>
      {label}
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed'
