'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { portalRealmApi } from '@/lib/api/portal-realm.api'
import type { RealmItem } from '@/lib/api/types'
import { toast } from 'sonner'
import { ChevronLeft, Code2, Copy, Check } from 'lucide-react'
import clsx from 'clsx'
import { useLang } from '@/context/LanguageContext'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import LeaveConfirmModal from '@/components/LeaveConfirmModal'
import JsonViewModal from '@/components/JsonViewModal'
import { buildGoogleRedirectUri } from '@/lib/google-oauth'

export default function RealmUpdatePage() {
  const { t } = useLang()
  const tr = t.realm
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const realmId = params.realmId as string

  const [realmName, setRealmName] = useState('')
  const [originalName, setOriginalName] = useState('')
  const [authType, setAuthType] = useState('')
  const [description, setDescription] = useState('')
  const [originalDescription, setOriginalDescription] = useState('')
  const [googleClientId, setGoogleClientId] = useState('')
  const [originalGoogleClientId, setOriginalGoogleClientId] = useState('')
  const [googleClientSecret, setGoogleClientSecret] = useState('')
  const [originalGoogleClientSecret, setOriginalGoogleClientSecret] = useState('')
  const [clientIdError, setClientIdError] = useState('')
  const [clientSecretError, setClientSecretError] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [realm, setRealm] = useState<RealmItem | null>(null)
  const [jsonViewOpen, setJsonViewOpen] = useState(false)

  const isGoogle = authType === 'Google'
  const callbackUrl = useMemo(() => buildGoogleRedirectUri(id), [id])

  const copyCallbackUrl = () => {
    navigator.clipboard.writeText(callbackUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await portalRealmApi.getRealmById(id, realmId)
      const realm = res.data?.realm
      setRealm(realm ?? null)
      setRealmName(realm?.realmName ?? '')
      setOriginalName(realm?.realmName ?? '')
      setAuthType(realm?.authType ?? '')
      setDescription(realm?.description ?? '')
      setOriginalDescription(realm?.description ?? '')
      setGoogleClientId(realm?.googleClientId ?? '')
      setOriginalGoogleClientId(realm?.googleClientId ?? '')
      setGoogleClientSecret(realm?.googleClientSecret ?? '')
      setOriginalGoogleClientSecret(realm?.googleClientSecret ?? '')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tr.failedToLoadRealm)
    } finally {
      setLoading(false)
    }
  }, [id, realmId, tr.failedToLoadRealm])

  useEffect(() => { loadData() }, [loadData])

  const isDirty = useMemo(
    () => realmName !== originalName || description !== originalDescription || googleClientId !== originalGoogleClientId || googleClientSecret !== originalGoogleClientSecret,
    [realmName, originalName, description, originalDescription, googleClientId, originalGoogleClientId, googleClientSecret, originalGoogleClientSecret]
  )
  const { showConfirm, guardNavigation, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty)

  const goBack = () => guardNavigation(() => router.push(`/business-setup/tenant/${id}/realms`))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = realmName.trim()
    if (!trimmed) { setError(tr.nameRequired); return }
    if (!isDirty) { router.push(`/business-setup/tenant/${id}/realms`); return }
    if (isGoogle) {
      const idTrimmed = googleClientId.trim()
      const secretTrimmed = googleClientSecret.trim()
      setClientIdError(idTrimmed ? '' : tr.clientIdRequired)
      setClientSecretError(secretTrimmed ? '' : tr.clientSecretRequired)
      if (!idTrimmed || !secretTrimmed) return
    }
    setSaving(true)
    try {
      await portalRealmApi.updateRealmById(id, realmId, {
        RealmName: trimmed,
        Description: description.trim() || undefined,
        ...(isGoogle ? { GoogleClientId: googleClientId.trim(), GoogleClientSecret: googleClientSecret.trim() } : {}),
      })
      toast.success(tr.updateSuccess)
      sessionStorage.setItem(`access_realms_highlight_${id}`, realmId)
      router.push(`/business-setup/tenant/${id}/realms`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tr.failedToUpdate)
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
      {jsonViewOpen && realm && <JsonViewModal data={realm} onClose={() => setJsonViewOpen(false)} />}

      <div className="flex-none flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tr.editTitle}</h1>
            <p className="text-base text-gray-500 mt-0.5">{tr.editSubtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setJsonViewOpen(true)}
          title={tr.viewJson}
          className="p-2 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <Code2 className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-2 custom-scrollbar">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-7 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={tr.fieldName} required>
                <input
                  value={realmName}
                  onChange={e => { setRealmName(e.target.value); setError('') }}
                  className={clsx(inputCls, error && 'border-red-400 focus:ring-red-400')}
                  autoFocus
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </FormField>
              <FormField label={tr.fieldAuthType} hint={tr.authTypeHint}>
                <select value={authType} disabled className={clsx(inputCls, 'bg-gray-50 text-gray-500 cursor-not-allowed')}>
                  <option value={authType}>{authType}</option>
                </select>
              </FormField>
            </div>
            <div className="mt-4">
              <FormField label={tr.fieldDescription}>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={tr.fieldDescriptionPlaceholder}
                  rows={2}
                  className={clsx(inputCls, 'resize-none')}
                />
              </FormField>
            </div>
          </div>

          {isGoogle && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-7 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={tr.fieldClientId} required>
                  <input
                    value={googleClientId}
                    onChange={e => { setGoogleClientId(e.target.value); setClientIdError('') }}
                    placeholder={tr.fieldClientIdPlaceholder}
                    autoComplete="off"
                    className={clsx(inputCls, clientIdError && 'border-red-400 focus:ring-red-400')}
                  />
                  {clientIdError && <p className="text-red-500 text-xs mt-1">{clientIdError}</p>}
                </FormField>
                <FormField label={tr.fieldClientSecret} required>
                  <input
                    value={googleClientSecret}
                    onChange={e => { setGoogleClientSecret(e.target.value); setClientSecretError('') }}
                    placeholder={tr.fieldClientSecretPlaceholder}
                    type="password"
                    autoComplete="new-password"
                    className={clsx(inputCls, clientSecretError && 'border-red-400 focus:ring-red-400')}
                  />
                  {clientSecretError && <p className="text-red-500 text-xs mt-1">{clientSecretError}</p>}
                </FormField>
              </div>
              <div className="mt-4">
                <FormField label={tr.fieldCallbackUrl} hint={tr.callbackUrlHint}>
                  <div className="flex gap-2">
                    <input readOnly value={callbackUrl} className={clsx(inputCls, 'bg-gray-50 text-gray-600 font-mono text-xs')} />
                    <button type="button" onClick={copyCallbackUrl} className="flex-none flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      {copied ? tr.copiedCallbackUrl : tr.copyCallbackUrl}
                    </button>
                  </div>
                </FormField>
              </div>
            </div>
          )}
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
