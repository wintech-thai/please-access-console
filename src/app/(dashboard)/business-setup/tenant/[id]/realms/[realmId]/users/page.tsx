'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { portalRealmApi } from '@/lib/api/portal-realm.api'
import { tenantApi } from '@/lib/api/tenant.api'
import type { RealmUserItem, RealmItem, TenantItem } from '@/lib/api/types'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Plus, Eye, EyeOff, Ban, CheckCircle, KeyRound, X } from 'lucide-react'
import clsx from 'clsx'
import { useLang } from '@/context/LanguageContext'
import RowActionsMenu from '@/components/RowActionsMenu'

function ConfirmDialog({ title, desc, onConfirm, onCancel, cancelLabel, confirmLabel, danger }: {
  title: string; desc?: string; onConfirm: () => void; onCancel: () => void
  cancelLabel: string; confirmLabel: string; danger?: boolean
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden text-center px-8 py-8" style={{ background: 'linear-gradient(135deg, rgb(var(--color-primary-800)) 0%, rgb(var(--color-primary-900)) 100%)' }}>
        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        {desc && <p className="text-sm text-white/60 mb-7">{desc}</p>}
        <div className={clsx('flex gap-3', !desc && 'mt-7')}>
          <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-semibold text-white/80 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors uppercase">{cancelLabel}</button>
          <button onClick={onConfirm} className={clsx('flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors uppercase', danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700')}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

function ReqBullet({ isValid, text }: { isValid: boolean; text: string }) {
  return (
    <li className={clsx('flex items-start gap-2 text-xs transition-colors', isValid ? 'text-primary-600 font-medium' : 'text-gray-400')}>
      <span className="mt-0.5 text-[10px]">•</span>
      <span>{text}</span>
    </li>
  )
}

function usePasswordReqs(password: string) {
  return {
    length: password.length >= 7 && password.length <= 15,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
}

function PasswordField({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">{label} <span className="text-red-500">*</span></label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          maxLength={15}
          placeholder="••••••••"
          className={clsx('w-full px-3 py-2.5 pr-10 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent', error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-primary-500')}
        />
        <button type="button" onClick={() => setShow(v => !v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

function AddUserModal({ onClose, onSubmit, saving }: { onClose: () => void; onSubmit: (data: { UserName: string; FirstName?: string; LastName?: string; Email?: string; Password: string }) => void; saving: boolean }) {
  const { t } = useLang()
  const ru = t.realmUser
  const [userName, setUserName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const reqs = usePasswordReqs(password)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!userName.trim()) errs.userName = ru.usernameRequired
    if (!reqs.length || !reqs.upper || !reqs.lower || !reqs.special) errs.password = ru.errPasswordReq
    if (password !== confirmPassword) errs.confirmPassword = ru.errConfirmMismatch
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    onSubmit({ UserName: userName.trim(), FirstName: firstName.trim() || undefined, LastName: lastName.trim() || undefined, Email: email.trim() || undefined, Password: password })
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-none">
          <h3 className="text-base font-bold text-gray-900">{ru.addModalTitle}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">{ru.fieldUsername} <span className="text-red-500">*</span></label>
            <input value={userName} onChange={e => { setUserName(e.target.value); setErrors(p => ({ ...p, userName: '' })) }} className={clsx(inputCls, errors.userName && 'border-red-400 focus:ring-red-400')} autoFocus />
            {errors.userName && <p className="text-red-500 text-xs mt-1">{errors.userName}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">{ru.fieldFirstName}</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">{ru.fieldLastName}</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">{ru.fieldEmail}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
          </div>
          <PasswordField label={ru.fieldPassword} value={password} onChange={v => { setPassword(v); setErrors(p => ({ ...p, password: '' })) }} error={errors.password} />
          <PasswordField label={ru.fieldConfirmPassword} value={confirmPassword} onChange={v => { setConfirmPassword(v); setErrors(p => ({ ...p, confirmPassword: '' })) }} error={errors.confirmPassword} />
          <div className="bg-primary-50 border border-primary-100 rounded-lg p-4">
            <p className="text-xs font-semibold text-primary-700 mb-2">{ru.reqTitle}</p>
            <ul className="space-y-1">
              <ReqBullet isValid={reqs.length} text={ru.req1} />
              <ReqBullet isValid={reqs.upper} text={ru.req2} />
              <ReqBullet isValid={reqs.lower} text={ru.req3} />
              <ReqBullet isValid={reqs.special} text={ru.req4} />
            </ul>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">{t.admin.cancel}</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60 rounded-lg transition-colors">
              {saving && <Spinner />}{t.admin.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ResetPasswordModal({ username, onClose, onSubmit, saving }: { username: string; onClose: () => void; onSubmit: (password: string) => void; saving: boolean }) {
  const { t } = useLang()
  const ru = t.realmUser
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const reqs = usePasswordReqs(password)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!reqs.length || !reqs.upper || !reqs.lower || !reqs.special) errs.password = ru.errPasswordReq
    if (password !== confirmPassword) errs.confirmPassword = ru.errConfirmMismatch
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    onSubmit(password)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">{ru.resetPasswordTitle.replace('{username}', username)}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <PasswordField label={ru.fieldPassword} value={password} onChange={v => { setPassword(v); setErrors(p => ({ ...p, password: '' })) }} error={errors.password} />
          <PasswordField label={ru.fieldConfirmPassword} value={confirmPassword} onChange={v => { setConfirmPassword(v); setErrors(p => ({ ...p, confirmPassword: '' })) }} error={errors.confirmPassword} />
          <div className="bg-primary-50 border border-primary-100 rounded-lg p-4">
            <p className="text-xs font-semibold text-primary-700 mb-2">{ru.reqTitle}</p>
            <ul className="space-y-1">
              <ReqBullet isValid={reqs.length} text={ru.req1} />
              <ReqBullet isValid={reqs.upper} text={ru.req2} />
              <ReqBullet isValid={reqs.lower} text={ru.req3} />
              <ReqBullet isValid={reqs.special} text={ru.req4} />
            </ul>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">{t.admin.cancel}</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60 rounded-lg transition-colors">
              {saving && <Spinner />}{t.admin.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function RealmUsersContent() {
  const { t } = useLang()
  const ru = t.realmUser
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const realmId = params.realmId as string

  const [tenant, setTenant] = useState<TenantItem | null>(null)
  const [realm, setRealm] = useState<RealmItem | null>(null)
  const [users, setUsers] = useState<RealmUserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const SS_KEY = `access_realmusers_highlight_${realmId}`
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const [resetModal, setResetModal] = useState<RealmUserItem | null>(null)
  const [resetSaving, setResetSaving] = useState(false)
  const [confirm, setConfirm] = useState<{ title: string; desc?: string; danger?: boolean; onConfirm: () => void } | null>(null)

  const selectRow = (rowId: string) => {
    setSelectedRowId(rowId)
    sessionStorage.setItem(SS_KEY, rowId)
  }

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(paginated.map(u => u.realmUserId))
    else setSelectedIds([])
  }

  const toggleOne = (realmUserId: string) =>
    setSelectedIds(prev => prev.includes(realmUserId) ? prev.filter(i => i !== realmUserId) : [...prev, realmUserId])

  useEffect(() => {
    const saved = sessionStorage.getItem(SS_KEY)
    if (saved) setSelectedRowId(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  //refresh เฉพาะ users ไม่ fetch tenant ใหม่ (tenant ไม่เปลี่ยนระหว่างทำ CRUD) ลดเวลารอหลัง add/toggle/delete
  const loadUsers = useCallback(async (orgCustomId: string) => {
    setLoading(true)
    try {
      const usersRes = await portalRealmApi.getRealmUsers(orgCustomId, realmId, { FullTextSearch: appliedSearch || undefined })
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : ru.failedToLoad)
    } finally {
      setLoading(false)
    }
  }, [realmId, appliedSearch, ru.failedToLoad])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const tenantRes = await tenantApi.getTenantById(id)
      setTenant(tenantRes.data)
      const orgCustomId = tenantRes.data.orgCustomId
      if (orgCustomId) {
        const [usersRes, realmRes] = await Promise.all([
          portalRealmApi.getRealmUsers(orgCustomId, realmId, { FullTextSearch: appliedSearch || undefined }),
          portalRealmApi.getRealmById(orgCustomId, realmId),
        ])
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : [])
        setRealm(realmRes.data?.realm ?? null)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : ru.failedToLoad)
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [id, realmId, appliedSearch, ru.failedToLoad])

  useEffect(() => { loadData() }, [loadData])

  const handleSearch = () => { setAppliedSearch(searchTerm); setPage(1) }

  const handleAddUser = async (data: { UserName: string; FirstName?: string; LastName?: string; Email?: string; Password: string }) => {
    if (!tenant?.orgCustomId) return
    setAddSaving(true)
    try {
      const res = await portalRealmApi.addRealmUser(tenant.orgCustomId, realmId, data)
      const newId = res.data?.realmUser?.realmUserId
      toast.success(ru.addSuccess)
      setAddModalOpen(false)
      if (newId) selectRow(newId)
      loadUsers(tenant.orgCustomId)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : ru.failedToAdd)
    } finally {
      setAddSaving(false)
    }
  }

  const handleResetPassword = async (password: string) => {
    if (!tenant?.orgCustomId || !resetModal) return
    setResetSaving(true)
    try {
      await portalRealmApi.resetRealmUserPasswordById(tenant.orgCustomId, resetModal.realmUserId, { Password: password })
      toast.success(ru.resetPasswordSuccess)
      setResetModal(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : ru.failedToResetPassword)
    } finally {
      setResetSaving(false)
    }
  }

  const handleToggle = (user: RealmUserItem) => {
    if (!tenant?.orgCustomId) return
    const isActive = user.isEnabled === true
    setConfirm({
      title: isActive ? ru.confirmDisableUser : ru.confirmEnableUser,
      onConfirm: async () => {
        setConfirm(null)
        try {
          if (isActive) await portalRealmApi.disableRealmUserById(tenant.orgCustomId, user.realmUserId)
          else await portalRealmApi.enableRealmUserById(tenant.orgCustomId, user.realmUserId)
          toast.success(isActive ? ru.userDisabledSuccess : ru.userEnabledSuccess)
          loadUsers(tenant.orgCustomId)
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : ru.failedToToggleUser)
        }
      },
    })
  }

  const handleBulkDelete = () => {
    if (!tenant?.orgCustomId || selectedIds.length === 0) return
    const orgCustomId = tenant.orgCustomId
    const count = selectedIds.length
    setConfirm({
      title: count === 1 ? ru.deleteConfirmTitle : ru.deleteBulkTitle.replace('{count}', String(count)),
      desc: count === 1 ? ru.deleteConfirmDesc : ru.deleteBulkDesc.replace('{count}', String(count)),
      danger: true,
      onConfirm: async () => {
        setConfirm(null)
        try {
          for (const realmUserId of selectedIds) await portalRealmApi.deleteRealmUserById(orgCustomId, realmUserId)
          toast.success(count === 1 ? ru.deleteSuccess : ru.deletedBulk.replace('{count}', String(count)))
          setSelectedIds([])
          loadUsers(orgCustomId)
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : ru.failedToDelete)
        }
      },
    })
  }

  const formatDate = (d?: string | null) => {
    if (!d) return ru.never
    try { return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
    catch { return d }
  }

  const filtered = users.filter(u => !appliedSearch || [u.userName, u.email].some(v => (v ?? '').toLowerCase().includes(appliedSearch.toLowerCase())))
  const startRow = filtered.length === 0 ? 0 : (page - 1) * itemsPerPage + 1
  const endRow = Math.min(page * itemsPerPage, filtered.length)
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Spinner />
        <span className="ml-2">{t.admin.loading}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden h-[calc(100dvh-5rem)] sm:h-[calc(100dvh-6.5rem)]">
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          desc={confirm.desc}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
          cancelLabel={t.admin.cancel}
          confirmLabel={t.admin.yes}
        />
      )}
      {addModalOpen && <AddUserModal onClose={() => setAddModalOpen(false)} onSubmit={handleAddUser} saving={addSaving} />}
      {resetModal && (
        <ResetPasswordModal
          username={resetModal.userName ?? ''}
          onClose={() => setResetModal(null)}
          onSubmit={handleResetPassword}
          saving={resetSaving}
        />
      )}

      <div className="flex-none flex items-center gap-3 mb-6">
        <button onClick={() => router.push(`/business-setup/tenant/${id}/realms`)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ru.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-200">
              Realm: {realm?.realmName ?? '—'}
            </span>
            <span className="text-sm text-gray-400">{ru.underTenant}</span>
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-200">
              {tenant ? (tenant.orgName || tenant.orgCustomId) : id}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col flex-1 min-h-0">
        <div className="flex-none flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center px-6 py-4 border-b border-gray-200">
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={ru.searchPlaceholder}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:min-w-[220px]"
            />
            <button onClick={handleSearch} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors">
              {t.admin.search}
            </button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button onClick={() => setAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus className="w-4 h-4" />{ru.addUser}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.length === 0}
              className="px-5 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors uppercase disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.admin.delete}
            </button>
          </div>
        </div>

        <div className="overflow-auto flex-1 min-h-0">
          <table className="w-full text-sm border-separate border-spacing-0 min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="border-b border-gray-100">
                <th className="w-12 px-4 py-3 border-b border-gray-200">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selectedIds.length === paginated.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                  />
                </th>
                {[ru.colUsername, ru.colName, ru.colEmail, ru.colCreated, ru.colLastSeen, ru.colStatus, ru.colAction].map((col, i, arr) => (
                  <th key={col} className={clsx('px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap', i === arr.length - 1 ? 'w-14 text-center' : 'text-left')}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <p className="text-sm font-semibold text-gray-500">{ru.noUsersFound}</p>
                    <p className="text-xs text-gray-400 mt-1">{ru.noUsersSubtitle}</p>
                  </td>
                </tr>
              ) : paginated.map(row => {
                    const isActive = row.isEnabled === true
                    const fullName = [row.firstName, row.lastName].filter(Boolean).join(' ')
                    const isSelected = selectedRowId === row.realmUserId
                    return (
                      <tr
                        key={row.realmUserId}
                        onClick={() => selectRow(row.realmUserId)}
                        className={clsx(
                          'border-l-[3px] transition-all cursor-pointer',
                          isSelected ? '!bg-primary-100 border-l-primary-500' : 'border-l-transparent hover:bg-gray-50'
                        )}
                      >
                        <td className="px-4 py-3 border-b border-gray-100" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.realmUserId)}
                            onChange={() => toggleOne(row.realmUserId)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                          />
                        </td>
                        <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm" onClick={e => e.stopPropagation()}>
                          <Link
                            href={`/business-setup/tenant/${id}/realms/${realmId}/users/${row.realmUserId}/update`}
                            className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                          >
                            {row.userName ?? '—'}
                          </Link>
                        </td>
                        <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-600">{fullName || '—'}</td>
                        <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-600">{row.email ?? '—'}</td>
                        <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-500">{formatDate(row.createdDate)}</td>
                        <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-500">{formatDate(row.lastSeenDate)}</td>
                        <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap">
                          <span className={clsx('text-sm font-medium', isActive ? 'text-emerald-600' : 'text-gray-400')}>
                            {isActive ? t.portalPage.filterActive : t.portalPage.filterDisabled}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                          <RowActionsMenu items={[
                            {
                              label: ru.resetPassword,
                              icon: <KeyRound className="w-4 h-4" />,
                              onClick: () => setResetModal(row),
                            },
                            {
                              label: isActive ? ru.disableUser : ru.enableUser,
                              icon: isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />,
                              danger: isActive,
                              success: !isActive,
                              onClick: () => handleToggle(row),
                            },
                          ]} />
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>

        <div className="flex-none flex items-center justify-end px-6 py-3 border-t border-gray-200 gap-4 sm:gap-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{t.admin.rowsPerPage}</span>
            <select
              value={itemsPerPage}
              onChange={e => { setItemsPerPage(Number(e.target.value)); setPage(1) }}
              className="bg-transparent border-none text-gray-700 focus:ring-0 cursor-pointer font-medium outline-none text-sm"
            >
              {[25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">{filtered.length === 0 ? '0-0' : `${startRow}-${endRow}`} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || filtered.length === 0 || loading} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'

export default function RealmUsersPage() {
  return (
    <Suspense>
      <RealmUsersContent />
    </Suspense>
  )
}
