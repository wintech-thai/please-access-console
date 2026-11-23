'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { portalRealmApi } from '@/lib/api/portal-realm.api'
import type { RealmItem } from '@/lib/api/types'
import { toast } from 'sonner'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { useLang } from '@/context/LanguageContext'

function AuthTypeBadge({ authType }: { authType?: string | null }) {
  const isGoogle = authType?.toLowerCase() === 'google'
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full ring-1', isGoogle ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-sky-50 text-sky-700 ring-sky-200')}>
      {authType ?? '—'}
    </span>
  )
}

export default function RealmsTable({ orgId }: { orgId: string }) {
  const { t } = useLang()
  const tr = t.realm
  const router = useRouter()

  const [realms, setRealms] = useState<RealmItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const SS_KEY = `access_tenant_realms_highlight_${orgId}`
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
      const res = await portalRealmApi.getRealms(orgId, { FullTextSearch: (searchOverride ?? appliedSearch) || undefined })
      setRealms(Array.isArray(res.data) ? res.data : [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tr.failedToLoad)
    } finally {
      setLoading(false)
    }
  }, [orgId, appliedSearch, tr.failedToLoad])

  useEffect(() => { loadData() }, [loadData])

  const handleSearch = () => { setAppliedSearch(searchTerm); setPage(1); loadData(searchTerm) }

  const formatDate = (d?: string | null) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
    catch { return d }
  }

  const startRow = realms.length === 0 ? 0 : (page - 1) * itemsPerPage + 1
  const endRow = Math.min(page * itemsPerPage, realms.length)
  const totalPages = Math.max(1, Math.ceil(realms.length / itemsPerPage))
  const paginated = realms.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return (
    <div className="flex flex-col overflow-hidden h-[calc(100dvh-5rem)] sm:h-[calc(100dvh-6.5rem)]">
      <div className="flex-none mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{tr.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{tr.subtitle}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col flex-1 min-h-0">
        <div className="flex-none flex gap-2 px-6 py-4 border-b border-gray-200">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={tr.searchPlaceholder}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:min-w-[220px]"
          />
          <button onClick={handleSearch} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5">
            <Search className="w-4 h-4" />{t.admin.search}
          </button>
        </div>

        <div className="overflow-auto flex-1 min-h-0">
          <table className="w-full text-sm border-separate border-spacing-0 min-w-[600px] table-fixed">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="border-b border-gray-100">
                {[
                  { label: tr.colName, width: '' },
                  { label: tr.colAuthType, width: 'w-[13%]' },
                  { label: tr.colPortalPages, width: 'w-[16%]' },
                  { label: tr.colRealmUsers, width: 'w-[13%]' },
                  { label: tr.colCreated, width: 'w-[14%]' },
                ].map(({ label, width }, i, arr) => (
                  <th key={label} className={clsx('px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap', width, (i === 2 || i === 3) ? 'text-center' : 'text-left', i === 0 && 'rounded-tl-xl', i === arr.length - 1 && 'rounded-tr-xl')}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-16 text-center text-sm text-gray-400">{t.admin.loading}</td></tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <p className="text-sm font-semibold text-gray-500">{tr.noRealmsFound}</p>
                  </td>
                </tr>
              ) : paginated.map(row => {
                const isNative = (row.authType ?? '').toLowerCase() === 'native'
                const isSelected = selectedRowId === row.realmId
                return (
                  <tr
                    key={row.realmId}
                    onClick={() => selectRow(row.realmId)}
                    className={clsx(
                      'cursor-pointer border-l-[3px] transition-all',
                      isSelected ? '!bg-primary-100 border-l-primary-500' : 'border-l-transparent hover:bg-gray-50'
                    )}
                  >
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm font-semibold text-gray-900 truncate">{row.realmName ?? '—'}</td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap"><AuthTypeBadge authType={row.authType} /></td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-600 text-center">{row.portalPageCount ?? 0}</td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-center" onClick={e => e.stopPropagation()}>
                      {isNative ? (
                        <span
                          onClick={() => router.push(`/business/realms/${row.realmId}/users`)}
                          className="font-semibold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer"
                        >
                          {row.realmUserCount ?? 0}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-500">{formatDate(row.createdDate)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex-none flex items-center justify-end px-6 py-3 border-t border-gray-200 gap-4 sm:gap-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{t.admin.rowsPerPage}</span>
            <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setPage(1) }} className="bg-transparent border-none text-gray-700 focus:ring-0 cursor-pointer font-medium outline-none text-sm">
              {[25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">{realms.length === 0 ? '0-0' : `${startRow}-${endRow}`} of {realms.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || realms.length === 0 || loading} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
