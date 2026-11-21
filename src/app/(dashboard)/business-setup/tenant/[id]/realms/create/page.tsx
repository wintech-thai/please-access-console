'use client'

import { useState, useMemo, Suspense } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { portalRealmApi } from '@/lib/api/portal-realm.api'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import clsx from 'clsx'
import { useLang } from '@/context/LanguageContext'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import LeaveConfirmModal from '@/components/LeaveConfirmModal'

function RealmCreateContent() {
  const { t } = useLang()
  const tr = t.realm
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string

  //auth type เลือกไว้แล้วตอนกด dropdown ที่ปุ่ม Add Realm ในหน้า list ไม่ให้แก้ไขในหน้านี้อีก (ตาม spec)
  const authType = searchParams.get('authType') === 'Google' ? 'Google' : 'Native'

  const [realmName, setRealmName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isDirty = useMemo(() => !!realmName, [realmName])
  const { showConfirm, guardNavigation, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty)

  const goBack = () => guardNavigation(() => router.push(`/business-setup/tenant/${id}/realms`))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = realmName.trim()
    if (!trimmed) { setError(tr.nameRequired); return }
    setSaving(true)
    try {
      const res = await portalRealmApi.addRealm(id, { RealmName: trimmed, AuthType: authType })
      const newId = res.data?.realm?.realmId
      toast.success(tr.createSuccess)
      if (newId) sessionStorage.setItem(`access_realms_highlight_${id}`, newId)
      router.push(`/business-setup/tenant/${id}/realms`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tr.failedToCreate)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col overflow-hidden h-[calc(100dvh-5rem)] sm:h-[calc(100dvh-6.5rem)]">
      {showConfirm && <LeaveConfirmModal onConfirm={confirmLeave} onCancel={cancelLeave} />}

      <div className="flex-none flex items-center gap-3 mb-6">
        <button onClick={goBack} className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tr.createTitle}</h1>
          <p className="text-base text-gray-500 mt-0.5">{tr.createSubtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-2 custom-scrollbar">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-7 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={tr.fieldName} required>
                <input
                  value={realmName}
                  onChange={e => { setRealmName(e.target.value); setError('') }}
                  placeholder={tr.fieldNamePlaceholder}
                  className={clsx(inputCls, error && 'border-red-400 focus:ring-red-400')}
                  autoFocus
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </FormField>
              <FormField label={tr.fieldAuthType} hint={tr.authTypeHint}>
                <div className={clsx(inputCls, 'bg-gray-50 text-gray-700 font-medium cursor-not-allowed')}>
                  {authType === 'Google' ? tr.authTypeGoogleComingSoon : tr.authTypeNative}
                </div>
              </FormField>
            </div>
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

export default function RealmCreatePage() {
  return (
    <Suspense>
      <RealmCreateContent />
    </Suspense>
  )
}

function FormField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
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

const inputCls = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white'
const cancelBtnCls = 'px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
const primaryBtnCls = 'flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-60 transition-colors'
