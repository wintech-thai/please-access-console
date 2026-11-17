'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'
import { portalSessionApi } from '@/lib/api/portal-session.api'
import type { PortalSessionItem } from '@/lib/api/types'
import { useLang } from '@/context/LanguageContext'
import SessionFlyout from '@/components/SessionFlyout'

function StatusBadge({ status }: { status?: string | null }) {
  const lower = status?.toLowerCase()
  const cfg = lower === 'authorized'
    ? { bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' }
    : lower === 'failed'
      ? { bg: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' }
      : { bg: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-400' }
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1', cfg.bg)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
      {status ?? '—'}
    </span>
  )
}

export default function SessionTable({ orgId, showOrgColumn }: { orgId: string; showOrgColumn?: boolean }) {
  const { t } = useLang()
  const ts = t.session

  const [sessions, setSessions] = useState<PortalSessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<PortalSessionItem | null>(null)
  const SS_KEY = `access_session_highlight_${orgId}`
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  const selectRow = (rowId: string) => {
    setSelectedRowId(rowId)
    sessionStorage.setItem(SS_KEY, rowId)
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(SS_KEY)
    if (saved) setSelectedRowId(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSessions = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    try {
      const payload = {
        Offset: (page - 1) * itemsPerPage,
        Limit: itemsPerPage,
        FullTextSearch: appliedSearch || undefined,
        Status: statusFilter || undefined,
      }
      const [listRes, countRes] = await Promise.all([
        portalSessionApi.getPortalSessions(orgId, payload),
        portalSessionApi.getPortalSessionCount(orgId, payload),
      ])
      const list = listRes.data?.portalSessions ?? []
      setSessions(Array.isArray(list) ? list : [])
      const count = countRes.data
      setTotal(typeof count === 'number' ? count : 0)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : ts.failedToLoad)
    } finally {
      setLoading(false)
    }
  }, [orgId, page, itemsPerPage, appliedSearch, statusFilter])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const handleSearch = () => { setAppliedSearch(searchTerm); setPage(1) }

  const formatDate = (d?: string | null) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
    catch { return d }
  }

  const totalPages = Math.ceil(total / itemsPerPage)
  const startRow = total === 0 ? 0 : (page - 1) * itemsPerPage + 1
  const endRow = Math.min(page * itemsPerPage, total)

  const cols = [ts.colId, ...(showOrgColumn ? [ts.colOrg] : []), ts.colPortalPageCode, ts.colStatus, ts.colCreated, ts.colAction]

  return (
    <div className="flex flex-col overflow-hidden h-[calc(100dvh-5rem)] sm:h-[calc(100dvh-6.5rem)]">
      <div className="flex-none mb-5">
        <h1 className="text-2xl font-bold text-gray-900">{ts.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{ts.subtitle}</p>
      </div>

      <div className="flex-none flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-56 max-w-xs bg-white border border-gray-300 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder={ts.searchPlaceholder} className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">{ts.filterAllStatus}</option>
          <option value="Pending">{ts.statusPending}</option>
          <option value="Failed">{ts.statusFailed}</option>
          <option value="Authorized">{ts.statusAuthorized}</option>
        </select>
        <button onClick={handleSearch} className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors">{t.admin.search}</button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50">
                {cols.map((col, i) => (
                  <th key={col} className={clsx('px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap text-left', i === 0 && 'rounded-tl-xl', i === cols.length - 1 && 'rounded-tr-xl text-center')}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={cols.length} className="px-4 py-16 text-center text-sm text-gray-400">{t.admin.loading}</td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={cols.length} className="px-4 py-16 text-center text-sm text-gray-400">{ts.noSessionsFound}</td></tr>
              ) : (
                sessions.map((s) => {
                  const isSelected = selectedRowId === s.portalSessionId
                  return (
                  <tr
                    key={s.portalSessionId}
                    onClick={() => selectRow(s.portalSessionId)}
                    className={clsx(
                      'cursor-pointer border-l-[3px] transition-all',
                      isSelected ? '!bg-primary-100 border-l-primary-500' : 'border-l-transparent hover:bg-gray-50'
                    )}
                  >
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-500">{s.portalSessionId}</td>
                    {showOrgColumn && <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-600">{s.orgId ?? '—'}</td>}
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm font-semibold text-gray-900">{s.portalPageCode ?? '—'}</td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-500">{formatDate(s.createdDate)}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-center" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setSelected(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-gray-100 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex-none flex items-center justify-end px-6 py-3 border-t border-gray-100 gap-4 sm:gap-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{t.admin.rowsPerPage}</span>
            <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setPage(1) }} className="bg-transparent border-none text-gray-700 focus:ring-0 cursor-pointer font-medium outline-none text-sm">
              {[25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">{total === 0 ? '0-0' : `${startRow}-${endRow}`} of {total}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || total === 0 || loading} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <SessionFlyout session={selected} showOrg={showOrgColumn} onClose={() => setSelected(null)} />
    </div>
  )
}
