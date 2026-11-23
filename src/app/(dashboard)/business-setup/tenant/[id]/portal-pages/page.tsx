'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { tenantApi } from '@/lib/api/tenant.api'
import { portalPageApi } from '@/lib/api/portal-page.api'
import type { TenantItem, PortalPageItem } from '@/lib/api/types'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Plus, Copy, Check, Ban, CheckCircle, Link2, Star, X, ExternalLink } from 'lucide-react'
import clsx from 'clsx'
import { useLang } from '@/context/LanguageContext'
import RowActionsMenu from '@/components/RowActionsMenu'

function tenantDomain(): string {
  if (typeof window === 'undefined') return ''
  //ใช้ host (รวม port) แทน hostname เผื่อรัน local dev ที่ไม่มี admin/tenant prefix จริง
  return window.location.host.replace(/^admin/, 'tenant')
}

function ConfirmDialog({ title, desc, onConfirm, onCancel, cancelLabel, confirmLabel }: {
  title: string; desc?: string; onConfirm: () => void; onCancel: () => void
  cancelLabel: string; confirmLabel: string
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
          <button onClick={onConfirm} className="flex-1 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors uppercase">{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

function PortalUrlModal({ link, loading, onClose }: { link?: string; loading?: boolean; onClose: () => void }) {
  const { t } = useLang()
  const tp = t.portalPage
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">{tp.portalUrlTitle}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{tp.portalUrlSubtitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">{tp.generatingUrl}</span>
            </div>
          ) : link ? (
            <>
              <div className="flex items-center gap-2 p-3 bg-primary-50 rounded-xl border border-primary-100">
                <span className="flex-1 text-sm text-primary-800 break-all line-clamp-3 font-mono">{link}</span>
                <button
                  onClick={handleCopy}
                  className={clsx('flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors', copied ? 'bg-green-100 text-green-700' : 'bg-white border border-primary-200 text-primary-600 hover:bg-primary-100')}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-primary-600 hover:text-primary-700">
                <ExternalLink className="w-3.5 h-3.5" />{tp.openInNewTab}
              </a>
              <p className="text-xs text-gray-400 mt-3">{tp.portalUrlExpiry}</p>
            </>
          ) : null}
        </div>
        <div className="flex justify-end px-6 pb-5">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">{t.users.close}</button>
        </div>
      </div>
    </div>
  )
}

function PortalPagesContent() {
  const { t } = useLang()
  const tp = t.portalPage
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [tenant, setTenant] = useState<TenantItem | null>(null)
  const [pages, setPages] = useState<PortalPageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const SS_KEY = `access_portal_pages_highlight_${id}`
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [urlModal, setUrlModal] = useState<{ open: boolean; link?: string; loading?: boolean }>({ open: false })
  const [confirm, setConfirm] = useState<{ title: string; desc?: string; onConfirm: () => void } | null>(null)

  const selectRow = (rowId: string) => {
    setSelectedRowId(rowId)
    sessionStorage.setItem(SS_KEY, rowId)
  }

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(paginated.map(p => p.portalPageId))
    else setSelectedIds([])
  }

  const toggleOne = (portalPageId: string) =>
    setSelectedIds(prev => prev.includes(portalPageId) ? prev.filter(i => i !== portalPageId) : [...prev, portalPageId])

  useEffect(() => {
    const saved = sessionStorage.getItem(SS_KEY)
    if (saved) setSelectedRowId(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const tenantRes = await tenantApi.getTenantById(id)
      setTenant(tenantRes.data)
      const orgCustomId = tenantRes.data.orgCustomId
      if (orgCustomId) {
        const pagesRes = await portalPageApi.getPortalPages(orgCustomId, { FullTextSearch: appliedSearch || undefined })
        setPages(Array.isArray(pagesRes.data) ? pagesRes.data : [])
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tp.failedToLoad)
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [id, appliedSearch])

  useEffect(() => { loadData() }, [loadData])

  const handleSearch = () => { setAppliedSearch(searchTerm); setPage(1) }

  const handleToggle = (page: PortalPageItem) => {
    if (!tenant?.orgCustomId) return
    const isActive = page.isEnabled === true
    setConfirm({
      title: isActive ? tp.disableConfirmTitle : tp.enableConfirmTitle,
      desc: isActive ? tp.disableConfirmDesc : tp.enableConfirmDesc,
      onConfirm: async () => {
        setConfirm(null)
        try {
          if (isActive) await portalPageApi.disablePortalPageById(tenant.orgCustomId, page.portalPageId)
          else await portalPageApi.enablePortalPageById(tenant.orgCustomId, page.portalPageId)
          toast.success(isActive ? tp.disableSuccess : tp.enableSuccess)
          loadData()
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : tp.failedToToggle)
        }
      },
    })
  }

  const handleSetDefault = async (page: PortalPageItem) => {
    if (!tenant?.orgCustomId) return
    try {
      await portalPageApi.setDefaultPortalPageById(tenant.orgCustomId, page.portalPageId)
      toast.success(tp.setDefaultSuccess)
      loadData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tp.failedToSetDefault)
    }
  }

  const handleBulkDelete = () => {
    if (!tenant?.orgCustomId || selectedIds.length === 0) return
    const count = selectedIds.length
    setConfirm({
      title: count === 1 ? tp.deleteTitle : tp.deleteBulkTitle.replace('{count}', String(count)),
      desc: count === 1 ? tp.deleteDesc : tp.deleteBulkDesc.replace('{count}', String(count)),
      onConfirm: async () => {
        setConfirm(null)
        try {
          for (const portalPageId of selectedIds) await portalPageApi.deletePortalPageById(tenant.orgCustomId, portalPageId)
          toast.success(count === 1 ? tp.deleteSuccess : tp.deletedBulk.replace('{count}', String(count)))
          setSelectedIds([])
          loadData()
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : tp.failedToDelete)
        }
      },
    })
  }

  const handleGetPortalUrl = async (page: PortalPageItem) => {
    if (!tenant?.orgCustomId) return
    setUrlModal({ open: true, loading: true })
    try {
      const res = await portalPageApi.getPortalPageApiKey(tenant.orgCustomId, page.portalPageId)
      const rawKey = res.data?.apiKey?.apiKey
      if (!rawKey) throw new Error(tp.failedToGetUrl)
      const domain = tenantDomain()
      const tenantId = tenant.orgId || tenant.orgCustomId
      const url = `${window.location.protocol}//${domain}/login-portal/${tenant.orgCustomId}/${tenantId}?key=${encodeURIComponent(rawKey)}&code=${encodeURIComponent(page.code ?? '')}`
      setUrlModal({ open: true, link: url })
      loadData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tp.failedToGetUrl)
      setUrlModal({ open: false })
    }
  }

  const formatDate = (d?: string | null) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
    catch { return d }
  }

  const filtered = pages.filter(p => !appliedSearch || (p.code ?? '').toLowerCase().includes(appliedSearch.toLowerCase()))
  const startRow = filtered.length === 0 ? 0 : (page - 1) * itemsPerPage + 1
  const endRow = Math.min(page * itemsPerPage, filtered.length)
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  if (initialLoading) {
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
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          desc={confirm.desc}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
          cancelLabel={t.admin.cancel}
          confirmLabel={t.admin.yes}
        />
      )}

      {urlModal.open && (
        <PortalUrlModal link={urlModal.link} loading={urlModal.loading} onClose={() => setUrlModal({ open: false })} />
      )}

      <div className="flex-none flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/business-setup/tenant')} className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tp.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tenant ? `${tenant.orgName || tenant.orgCustomId}` : id}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col flex-1 min-h-0">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center px-6 py-4 border-b border-gray-200">
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={tp.searchPlaceholder}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:min-w-[220px]"
            />
            <button onClick={handleSearch} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors">
              {t.admin.search}
            </button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Link
              href={`/business-setup/tenant/${id}/portal-pages/create`}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />{tp.addPortalPage}
            </Link>
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.length === 0}
              className="px-5 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors uppercase disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.admin.delete}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="w-full text-sm border-separate border-spacing-0 min-w-[800px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="w-12 px-4 py-3 rounded-tl-xl border-b border-gray-200">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selectedIds.length === paginated.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                  />
                </th>
                {[tp.colCode, tp.colAuthMethod, tp.colRealmName, tp.colTheme, tp.colDefault, tp.colStatus, tp.colApiKey, tp.colCreated, tp.colAction].map((col, i, arr) => (
                  <th key={col} className={clsx('px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap', i === arr.length - 1 ? 'w-14 text-center' : 'text-left')}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center">
                    <p className="text-sm font-semibold text-gray-500">{tp.noPortalPagesFound}</p>
                    <p className="text-xs text-gray-400 mt-1">{tp.noPortalPagesSubtitle}</p>
                  </td>
                </tr>
              ) : paginated.map((row) => {
                    const isActive = row.isEnabled === true
                    const isDefault = row.isDefault === true
                    const isSelected = selectedRowId === row.portalPageId
                    return (
                      <tr
                        key={row.portalPageId}
                        onClick={() => selectRow(row.portalPageId)}
                        className={clsx(
                          'border-l-[3px] transition-all cursor-pointer',
                          isSelected ? '!bg-primary-100 border-l-primary-500' : 'border-l-transparent hover:bg-gray-50'
                        )}
                      >
                        <td className="px-4 py-3 border-b border-gray-100" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.portalPageId)}
                            onChange={() => toggleOne(row.portalPageId)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                          />
                        </td>
                        <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm" onClick={e => e.stopPropagation()}>
                          <Link
                            href={`/business-setup/tenant/${id}/portal-pages/${row.portalPageId}/update`}
                            className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                          >
                            {row.code ?? '—'}
                          </Link>
                        </td>
                        <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-600">{row.authMethod ?? '—'}</td>
                        <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-600">{row.realmName ?? '—'}</td>
                        <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-600">{row.theme ?? '—'}</td>
                        <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap">
                          {isDefault ? <Check className="w-4 h-4 text-emerald-600" /> : <span className="text-sm text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap">
                          <span className={clsx('text-sm font-medium', isActive ? 'text-emerald-600' : 'text-gray-400')}>
                            {isActive ? tp.filterActive : tp.filterDisabled}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-500">{row.apiCode || tp.noApiKey}</td>
                        <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-500">{formatDate(row.createdDate)}</td>
                        <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                          <RowActionsMenu items={[
                            {
                              label: tp.getPortalUrl,
                              icon: <Link2 className="w-4 h-4" />,
                              onClick: () => handleGetPortalUrl(row),
                            },
                            {
                              label: tp.setDefault,
                              icon: <Star className="w-4 h-4" />,
                              hidden: isDefault,
                              onClick: () => handleSetDefault(row),
                            },
                            {
                              label: isActive ? tp.disablePortalPage : tp.enablePortalPage,
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

        <div className="flex items-center justify-end px-6 py-3 border-t border-gray-200 gap-4 sm:gap-6">
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
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || filtered.length === 0 || loading}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PortalPagesPage() {
  return (
    <Suspense>
      <PortalPagesContent />
    </Suspense>
  )
}
