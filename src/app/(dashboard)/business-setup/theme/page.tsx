'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { portalPageThemeApi } from '@/lib/api/portal-page-theme.api'
import type { PortalPageThemeItem } from '@/lib/api/types'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Eye } from 'lucide-react'
import clsx from 'clsx'
import { useLang } from '@/context/LanguageContext'
import RowActionsMenu from '@/components/RowActionsMenu'
import { openThemePreview } from '@/lib/theme-render'

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
          <button onClick={onConfirm} className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors uppercase">{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

function AuthTypeBadge({ authType }: { authType?: string | null }) {
  const isGoogle = authType?.toLowerCase() === 'google'
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full ring-1', isGoogle ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-sky-50 text-sky-700 ring-sky-200')}>
      {authType ?? '—'}
    </span>
  )
}

function AddThemeDropdown({ label, nativeLabel, googleLabel }: { label: string; nativeLabel: string; googleLabel: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />{label}<ChevronDown className="w-3.5 h-3.5 opacity-80" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 overflow-hidden">
          <button
            onClick={() => { setOpen(false); router.push('/business-setup/theme/create?authType=Native') }}
            className="w-full flex items-center justify-between px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {nativeLabel}
          </button>
          <button
            onClick={() => { setOpen(false); router.push('/business-setup/theme/create?authType=Google') }}
            className="w-full flex items-center justify-between px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {googleLabel}
          </button>
        </div>
      )}
    </div>
  )
}

export default function PortalPageThemesPage() {
  const { t } = useLang()
  const tt = t.portalPageTheme
  const router = useRouter()

  const [themes, setThemes] = useState<PortalPageThemeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const SS_KEY = 'access_portal_page_themes_highlight'
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirm, setConfirm] = useState<{ title: string; desc?: string; onConfirm: () => void } | null>(null)

  useEffect(() => {
    const saved = sessionStorage.getItem(SS_KEY)
    if (saved) setSelectedRowId(saved)
  }, [])

  const selectRow = (rowId: string) => {
    setSelectedRowId(rowId)
    sessionStorage.setItem(SS_KEY, rowId)
  }

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(paginated.map(r => r.themeId))
    else setSelectedIds([])
  }

  const toggleOne = (themeId: string) =>
    setSelectedIds(prev => prev.includes(themeId) ? prev.filter(i => i !== themeId) : [...prev, themeId])

  const loadData = useCallback(async (searchOverride?: string) => {
    setLoading(true)
    try {
      const res = await portalPageThemeApi.getPortalPageThemes({ FullTextSearch: (searchOverride ?? appliedSearch) || undefined })
      setThemes(Array.isArray(res.data) ? res.data : [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tt.failedToLoad)
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, tt.failedToLoad])

  useEffect(() => { loadData() }, [loadData])

  const handleSearch = () => { setAppliedSearch(searchTerm); setPage(1); loadData(searchTerm) }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    const count = selectedIds.length
    setConfirm({
      title: count === 1 ? tt.deleteTitle : tt.deleteBulkTitle.replace('{count}', String(count)),
      desc: count === 1 ? tt.deleteDesc : tt.deleteBulkDesc.replace('{count}', String(count)),
      onConfirm: async () => {
        setConfirm(null)
        try {
          for (const themeId of selectedIds) await portalPageThemeApi.deletePortalPageThemeById(themeId)
          toast.success(count === 1 ? tt.deleteSuccess : tt.deletedBulk.replace('{count}', String(count)))
          setSelectedIds([])
          loadData()
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : tt.failedToDelete)
        }
      },
    })
  }

  const handlePreview = async (themeId: string) => {
    try {
      const res = await portalPageThemeApi.getPortalPageThemeById(themeId)
      const theme = res.data?.portalPageTheme
      if (!theme) { toast.error(tt.failedToLoadTheme); return }
      openThemePreview(theme.htmlTemplate ?? '', theme.variables ?? [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tt.failedToLoadTheme)
    }
  }

  const formatDate = (d?: string | null) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
    catch { return d }
  }

  const startRow = themes.length === 0 ? 0 : (page - 1) * itemsPerPage + 1
  const endRow = Math.min(page * itemsPerPage, themes.length)
  const totalPages = Math.max(1, Math.ceil(themes.length / itemsPerPage))
  const paginated = themes.slice((page - 1) * itemsPerPage, page * itemsPerPage)

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

      <div className="flex-none mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{tt.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{tt.subtitle}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col flex-1 min-h-0">
        <div className="flex-none flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center px-6 py-4 border-b border-gray-200">
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={tt.searchPlaceholder}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:min-w-[220px]"
            />
            <button onClick={handleSearch} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors">
              {t.admin.search}
            </button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <AddThemeDropdown label={tt.addTheme} nativeLabel={tt.authTypeNative} googleLabel={tt.authTypeGoogle} />
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
                {[tt.colName, tt.colDescription, tt.colAuthType, tt.colLanguage, tt.colCreated, tt.colUseCount, tt.colAction].map((col, i, arr) => (
                  <th key={col} className={clsx('px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap', i === arr.length - 1 ? 'w-14 text-center' : (i === 5) ? 'text-center' : 'text-left')}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-sm text-gray-400">{t.admin.loading}</td></tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <p className="text-sm font-semibold text-gray-500">{tt.noThemesFound}</p>
                    <p className="text-xs text-gray-400 mt-1">{tt.noThemesSubtitle}</p>
                  </td>
                </tr>
              ) : paginated.map(row => {
                const isSelected = selectedRowId === row.themeId
                return (
                  <tr
                    key={row.themeId}
                    onClick={() => selectRow(row.themeId)}
                    className={clsx(
                      'border-l-[3px] transition-all cursor-pointer',
                      isSelected ? '!bg-primary-100 border-l-primary-500' : 'border-l-transparent hover:bg-gray-50'
                    )}
                  >
                    <td className="px-4 py-3 border-b border-gray-100" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.themeId)}
                        onChange={() => toggleOne(row.themeId)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm" onClick={e => e.stopPropagation()}>
                      <Link href={`/business-setup/theme/${row.themeId}/update`} className="font-semibold text-primary-600 hover:text-primary-700 hover:underline">
                        {row.themeName ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-600 max-w-[260px] truncate">{row.description || '—'}</td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap"><AuthTypeBadge authType={row.authType} /></td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-600">{row.language ?? '—'}</td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-500">{formatDate(row.createdDate)}</td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-sm text-gray-600 text-center">{row.useCount ?? 0}</td>
                    <td className="px-4 py-3 border-b border-gray-100 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                      <RowActionsMenu items={[
                        { label: tt.preview, icon: <Eye className="w-4 h-4" />, onClick: () => handlePreview(row.themeId) },
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
            <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setPage(1) }} className="bg-transparent border-none text-gray-700 focus:ring-0 cursor-pointer font-medium outline-none text-sm">
              {[25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">{themes.length === 0 ? '0-0' : `${startRow}-${endRow}`} of {themes.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || themes.length === 0 || loading} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
