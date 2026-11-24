'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { portalPageApi } from '@/lib/api/portal-page.api'
import { portalRealmApi } from '@/lib/api/portal-realm.api'
import type { RealmItem, PortalPageItem } from '@/lib/api/types'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import clsx from 'clsx'
import { useLang } from '@/context/LanguageContext'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import LeaveConfirmModal from '@/components/LeaveConfirmModal'

export default function PortalPageUpdatePage() {
  const { t } = useLang()
  const tp = t.portalPage
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const portalPageId = params.portalPageId as string

  const [original, setOriginal] = useState<PortalPageItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [authMethod, setAuthMethod] = useState('Native')
  const [theme, setTheme] = useState('Default')
  const [realmId, setRealmId] = useState('')
  const [language, setLanguage] = useState('Thai')
  const [redirectUrlMode, setRedirectUrlMode] = useState('Direct')
  const [redirectUrlValue, setRedirectUrlValue] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [realms, setRealms] = useState<RealmItem[]>([])
  const [realmsLoaded, setRealmsLoaded] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await portalPageApi.getPortalPageById(id, portalPageId)
      const page = res.data?.portalPage
      setOriginal(page ?? null)
      setCode(page?.code ?? '')
      setAuthMethod(page?.authMethod ?? 'Native')
      setTheme(page?.theme ?? 'Default')
      setRealmId(page?.realmId ?? '')
      setLanguage(page?.language ?? 'Thai')
      setRedirectUrlMode(page?.redirectUrlMode ?? 'Direct')
      setRedirectUrlValue(page?.redirectUrlValue ?? '')
      setIsDefault(page?.isDefault ?? false)
      setIsEnabled(page?.isEnabled ?? true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tp.failedToLoad)
    } finally {
      setLoading(false)
    }
  }, [id, portalPageId, tp.failedToLoad])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    portalRealmApi.getRealms(id, {}).then(res => {
      setRealms(Array.isArray(res.data) ? res.data : [])
    }).catch(() => setRealms([]))
      .finally(() => setRealmsLoaded(true))
  }, [id])

  const matchingRealms = realms.filter(r => (r.authType ?? '').toLowerCase() === authMethod.toLowerCase())

  //เปลี่ยน auth method แล้ว realm เดิมที่เลือกไว้ auth type ไม่ตรงกันแล้ว ต้องเคลียร์ทิ้ง
  //รอ realmsLoaded ก่อน ไม่งั้น realms ที่ยังโหลดไม่เสร็จ (เป็น [] ชั่วคราว) จะทำให้เคลียร์ realmId เดิมทิ้งผิดๆ ตอนเปิดหน้า edit
  useEffect(() => {
    if (!realmsLoaded) return
    if (realmId && !matchingRealms.some(r => r.realmId === realmId)) setRealmId('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authMethod, realms, realmsLoaded])

  const isDirty = useMemo(() => {
    if (!original) return false
    return code !== (original.code ?? '') ||
      authMethod !== (original.authMethod ?? 'Native') ||
      theme !== (original.theme ?? 'Default') ||
      realmId !== (original.realmId ?? '') ||
      language !== (original.language ?? 'Thai') ||
      redirectUrlMode !== (original.redirectUrlMode ?? 'Direct') ||
      redirectUrlValue !== (original.redirectUrlValue ?? '') ||
      isDefault !== (original.isDefault ?? false) ||
      isEnabled !== (original.isEnabled ?? true)
  }, [original, code, authMethod, theme, realmId, language, redirectUrlMode, redirectUrlValue, isDefault, isEnabled])

  const { showConfirm, guardNavigation, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty)

  const goBack = () => guardNavigation(() => router.push(`/business-setup/tenant/${id}/portal-pages`))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) { setError(tp.codeRequired); return }
    if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) { setError(tp.codeInvalid); return }
    //ไม่มีอะไรเปลี่ยนจริง ไม่ต้องยิง API หรือขึ้น toast กลับไปหน้า list เฉยๆ
    if (!isDirty || !original) { router.push(`/business-setup/tenant/${id}/portal-pages`); return }
    setSaving(true)
    try {
      await portalPageApi.updatePortalPageById(id, portalPageId, {
        Code: trimmed,
        AuthMethod: authMethod,
        Theme: theme,
        RealmId: realmId || null,
        Language: language,
        RedirectUrlMode: redirectUrlValue ? redirectUrlMode : null,
        RedirectUrlValue: redirectUrlValue || null,
      })
      if (isDefault && !original.isDefault) await portalPageApi.setDefaultPortalPageById(id, portalPageId)
      if (isEnabled !== original.isEnabled) {
        if (isEnabled) await portalPageApi.enablePortalPageById(id, portalPageId)
        else await portalPageApi.disablePortalPageById(id, portalPageId)
      }
      toast.success(tp.updateSuccess)
      sessionStorage.setItem(`access_portal_pages_highlight_${id}`, portalPageId)
      router.push(`/business-setup/tenant/${id}/portal-pages`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tp.failedToUpdate)
    } finally {
      setSaving(false)
    }
  }

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
      {showConfirm && <LeaveConfirmModal onConfirm={confirmLeave} onCancel={cancelLeave} />}

      <div className="flex-none flex items-center gap-3 mb-6">
        <button onClick={goBack} className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tp.editTitle}</h1>
          <p className="text-base text-gray-500 mt-0.5">{tp.editSubtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-2 custom-scrollbar">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-7 py-6 flex flex-col gap-4">
            <FormField label={tp.fieldCode} required>
              <input
                value={code}
                onChange={e => { setCode(e.target.value); setError('') }}
                placeholder={tp.fieldCodePlaceholder}
                className={clsx(inputCls, error && 'border-red-400 focus:ring-red-400')}
                autoFocus
              />
              {error ? <p className="text-red-500 text-xs mt-1">{error}</p> : <p className="text-xs text-gray-400 mt-1">{tp.fieldCodeHint}</p>}
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label={tp.fieldAuthMethod}>
                <select value={authMethod} onChange={e => setAuthMethod(e.target.value)} className={inputCls}>
                  <option value="Native">Native</option>
                  <option value="Google">Google</option>
                </select>
              </FormField>
              <FormField label={tp.fieldTheme}>
                <select value={theme} onChange={e => setTheme(e.target.value)} className={inputCls}>
                  <option value="Default">Default</option>
                </select>
              </FormField>
              <FormField label={tp.fieldRealm}>
                <select value={realmId} onChange={e => setRealmId(e.target.value)} className={inputCls}>
                  <option value="">{tp.noRealmOption}</option>
                  {!realmsLoaded && realmId && original?.realmName ? (
                    //ยังโหลด realms ไม่เสร็จ แสดงชื่อ realm เดิมที่ผูกไว้ก่อน กัน select โชว์ตัวเลือกผิดวูบแรกก่อนข้อมูลจริงมาถึง
                    <option value={realmId}>{original.realmName}</option>
                  ) : (
                    matchingRealms.map(r => <option key={r.realmId} value={r.realmId}>{r.realmName}</option>)
                  )}
                </select>
                {realmsLoaded && matchingRealms.length === 0 && <p className="text-xs text-gray-400 mt-1">{tp.noRealmMatchAuthType}</p>}
              </FormField>
            </div>

            <FormField label={tp.fieldRedirectUrl}>
              <div className="flex flex-col sm:flex-row gap-2">
                <select value={redirectUrlMode} onChange={e => setRedirectUrlMode(e.target.value)} className={clsx(inputCls, 'sm:w-56 flex-none')}>
                  <option value="Direct">{tp.redirectModeDirect}</option>
                  <option value="Parameter">{tp.redirectModeParameter}</option>
                </select>
                <input
                  value={redirectUrlValue}
                  onChange={e => setRedirectUrlValue(e.target.value)}
                  placeholder={redirectUrlMode === 'Direct' ? tp.redirectUrlPlaceholderDirect : tp.redirectUrlPlaceholderParameter}
                  className={clsx(inputCls, 'flex-1')}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{redirectUrlMode === 'Direct' ? tp.redirectUrlHintDirect : tp.redirectUrlHintParameter}</p>
            </FormField>

            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4" />
              {tp.fieldIsDefault}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={isEnabled} onChange={e => setIsEnabled(e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4" />
              {tp.fieldIsEnabled}
            </label>

            <FormField label={tp.fieldLanguage} required>
              <div className="flex gap-3">
                <LanguageOption label={tp.languageThai} checked={language === 'Thai'} onClick={() => setLanguage('Thai')} />
                <LanguageOption label={tp.languageEnglish} checked={language === 'English'} onClick={() => setLanguage('English')} />
              </div>
            </FormField>
          </div>
        </div>

        <div className="flex-none -mx-3 sm:-mx-6 px-4 sm:px-8 py-4 flex items-center justify-end gap-3 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <button type="button" onClick={goBack} className={cancelBtnCls}>{t.admin.cancel}</button>
          <button type="submit" disabled={saving} className={primaryBtnCls}>
            {saving ? <><Spinner />{t.admin.saving}</> : t.admin.save}
          </button>
        </div>
      </form>
    </div>
  )
}

function LanguageOption({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
        checked ? 'bg-primary-50 border-primary-400 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
      )}
    >
      {label}
    </button>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin inline mr-2" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white'
const cancelBtnCls = 'px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
const primaryBtnCls = 'flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-60 transition-colors'
