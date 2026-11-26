'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { portalPageApi } from '@/lib/api/portal-page.api'
import { useTenant } from '@/context/TenantContext'
import type { PortalPageItem } from '@/lib/api/types'
import { toast } from 'sonner'
import { Search, ChevronLeft, ChevronRight, Check, Copy, Link2, X, ExternalLink } from 'lucide-react'
import clsx from 'clsx'
import { useLang } from '@/context/LanguageContext'
import RowActionsMenu from '@/components/RowActionsMenu'

function tenantDomain(): string {
  if (typeof window === 'undefined') return ''
  //ใช้ host (รวม port) แทน hostname เผื่อรัน local dev ที่ไม่มี admin/tenant prefix จริง
  return window.location.host.replace(/^admin/, 'tenant')
}

//สุ่ม MAC address ใส่ไปในลิงก์ ให้มีข้อมูลตัวอย่างสำหรับทดสอบ ตัวแรกเป็น "XX" ตายตัวเพื่อให้รู้ว่าเป็นตัวที่สร้างขึ้นมาเอง ไม่ใช่ MAC จริงจาก Mikrotik
function generateFakeMac(): string {
  const bytes = Array.from({ length: 5 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase())
  return ['XX', ...bytes].join(':')
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

export default function TenantPortalPagesTable({ orgId }: { orgId: string }) {
  const { t } = useLang()
  const tp = t.portalPage
  const { selectedOrg } = useTenant()

  const [pages, setPages] = useState<PortalPageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [urlModal, setUrlModal] = useState<{ open: boolean; link?: string; loading?: boolean }>({ open: false })
  const SS_KEY = `access_tenant_portalpages_highlight_${orgId}`
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  useEffect(() => {
    const saved = sessionStorage.getItem(SS_KEY)
    if (saved) setSelectedRowId(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectRow = (rowId: string) => {
    setSelectedRowId(rowId)
    sessionStorage.setItem(SS_KEY, rowId)
  }

  const loadData = useCallback(async (searchOverride?: string) => {
    if (!orgId) return
    setLoading(true)
    try {
      const res = await portalPageApi.getPortalPages(orgId, { FullTextSearch: (searchOverride ?? appliedSearch) || undefined })
      setPages(Array.isArray(res.data) ? res.data : [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tp.failedToLoad)
    } finally {
      setLoading(false)
    }
  }, [orgId, appliedSearch, tp.failedToLoad])

  useEffect(() => { loadData() }, [loadData])

  const handleSearch = () => { setAppliedSearch(searchTerm); setPage(1); loadData(searchTerm) }

  const handleGetPortalUrl = async (row: PortalPageItem) => {
    setUrlModal({ open: true, loading: true })
    try {
      const res = await portalPageApi.getPortalPageApiKey(orgId, row.portalPageId)
      const rawKey = res.data?.apiKey?.apiKey
      if (!rawKey) throw new Error(tp.failedToGetUrl)
      const domain = tenantDomain()
      const tenantId = selectedOrg?.orgId || orgId
      const url = `${window.location.protocol}//${domain}/login-portal/${orgId}/${tenantId}?key=${encodeURIComponent(rawKey)}&code=${encodeURIComponent(row.code ?? '')}&mac=${encodeURIComponent(generateFakeMac())}`
      setUrlModal({ open: true, link: url })
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

  return (
    <div className="flex flex-col overflow-hidden h-[calc(100dvh-5rem)] sm:h-[calc(100dvh-6.5rem)]">
      {urlModal.open && (
        <PortalUrlModal link={urlModal.link} loading={urlModal.loading} onClose={() => setUrlModal({ open: false })} />
      )}

      <div className="flex-none mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{tp.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{tp.subtitle}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col flex-1 min-h-0">
        <div className="flex-none flex gap-2 px-6 py-4 border-b border-gray-200">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={tp.searchPlaceholder}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:min-w-[220px]"
          />
          <button onClick={handleSearch} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5">
            <Search className="w-4 h-4" />{t.admin.search}
          </button>
        </div>

        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="w-full text-sm border-separate border-spacing-0 min-w-[800px]">
            <thead>
              <tr className="bg-gray-50">
                {[tp.colCode, tp.colAuthMethod, tp.colRealmName, tp.colTheme, tp.colDefault, tp.colStatus, tp.colCreated, tp.colAction].map((col, i, arr) => (
                  <th key={col} className={clsx('px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap', i === arr.length - 1 ? 'w-14 text-center' : 'text-left', i === 0 && 'rounded-tl-xl', i === arr.length - 1 && 'rounded-tr-xl')}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-sm text-gray-400">{t.admin.loading}</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <p className="text-sm font-semibold text-gray-500">{tp.noPortalPagesFound}</p>
                  </td>
                </tr>
              ) : paginated.map(row => {
                const isActive = row.isEnabled === true
                const isDefault = row.isDefault === true
                const isSelected = selectedRowId === row.portalPageId
                return (
                  <tr
                    key={row.portalPageId}
                    onClick={() => selectRow(row.portalPageId)}
                    className={clsx(
                      'cursor-pointer border-l-[3px] transition-all',
                      isSelected ? '!bg-primary-100 border-l-primary-500' : 'border-l-transparent hover:bg-gray-50'
                    )}
                  >
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm" onClick={e => e.stopPropagation()}>
                      <Link href={`/business/portal-pages/${row.portalPageId}`} className="font-semibold text-primary-600 hover:text-primary-700 hover:underline">
                        {row.code ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-600">{row.authMethod ?? '—'}</td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-600">{row.realmName ?? '—'}</td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-600">{row.themeId ? (row.themeName ?? '—') : (row.theme ?? '—')}</td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap">
                      {isDefault ? <Check className="w-4 h-4 text-emerald-600" /> : <span className="text-sm text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap">
                      <span className={clsx('text-sm font-medium', isActive ? 'text-emerald-600' : 'text-gray-400')}>
                        {isActive ? tp.filterActive : tp.filterDisabled}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-500">{formatDate(row.createdDate)}</td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                      <RowActionsMenu items={[
                        {
                          label: tp.getPortalUrl,
                          icon: <Link2 className="w-4 h-4" />,
                          onClick: () => handleGetPortalUrl(row),
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
