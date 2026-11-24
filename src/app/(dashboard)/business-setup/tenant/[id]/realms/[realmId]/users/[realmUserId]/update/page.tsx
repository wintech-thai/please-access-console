'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { portalRealmApi } from '@/lib/api/portal-realm.api'
import type { RealmUserItem } from '@/lib/api/types'
import { toast } from 'sonner'
import { ChevronLeft, Code2, History } from 'lucide-react'
import clsx from 'clsx'
import { useLang } from '@/context/LanguageContext'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import LeaveConfirmModal from '@/components/LeaveConfirmModal'
import JsonViewModal from '@/components/JsonViewModal'
import AuditTrailDrawer from '@/components/AuditTrailDrawer'

export default function RealmUserUpdatePage() {
  const { t } = useLang()
  const ru = t.realmUser
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const realmId = params.realmId as string
  const realmUserId = params.realmUserId as string

  const [original, setOriginal] = useState<RealmUserItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [jsonViewOpen, setJsonViewOpen] = useState(false)
  const [auditTrailOpen, setAuditTrailOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await portalRealmApi.getRealmUserById(id, realmUserId)
      const user = res.data?.realmUser
      setOriginal(user ?? null)
      setFirstName(user?.firstName ?? '')
      setLastName(user?.lastName ?? '')
      setEmail(user?.email ?? '')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : ru.failedToLoad)
    } finally {
      setLoading(false)
    }
  }, [id, realmUserId, ru.failedToLoad])

  useEffect(() => { loadData() }, [loadData])

  const isDirty = useMemo(() => {
    if (!original) return false
    return firstName !== (original.firstName ?? '') ||
      lastName !== (original.lastName ?? '') ||
      email !== (original.email ?? '')
  }, [original, firstName, lastName, email])

  const { showConfirm, guardNavigation, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty)

  const goBack = () => guardNavigation(() => router.push(`/business-setup/tenant/${id}/realms/${realmId}/users`))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    //ไม่มีอะไรเปลี่ยนจริง ไม่ต้องยิง API หรือขึ้น toast กลับไปหน้า list เฉยๆ
    if (!isDirty || !original) { router.push(`/business-setup/tenant/${id}/realms/${realmId}/users`); return }
    setSaving(true)
    try {
      await portalRealmApi.updateRealmUserById(id, realmUserId, {
        FirstName: firstName.trim() || undefined,
        LastName: lastName.trim() || undefined,
        Email: email.trim() || undefined,
      })
      toast.success(ru.editSuccess)
      sessionStorage.setItem(`access_realmusers_highlight_${realmId}`, realmUserId)
      router.push(`/business-setup/tenant/${id}/realms/${realmId}/users`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : ru.failedToEdit)
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
      {jsonViewOpen && original && <JsonViewModal data={original} onClose={() => setJsonViewOpen(false)} />}
      {auditTrailOpen && <AuditTrailDrawer rowId={realmUserId} onClose={() => setAuditTrailOpen(false)} />}

      <div className="flex-none flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ru.editModalTitle}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAuditTrailOpen(true)}
            title={ru.auditTrail}
            className="p-2 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setJsonViewOpen(true)}
            title={ru.viewJson}
            className="p-2 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <Code2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-2 custom-scrollbar">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-7 py-6 flex flex-col gap-4">
            <FormField label={ru.fieldUsername}>
              <div className={clsx(inputCls, 'bg-gray-50 text-gray-500 cursor-not-allowed')}>{original?.userName}</div>
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={ru.fieldFirstName}>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} autoFocus />
              </FormField>
              <FormField label={ru.fieldLastName}>
                <input value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} />
              </FormField>
            </div>

            <FormField label={ru.fieldEmail}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
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

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">{label}</label>
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
