'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import clsx from 'clsx'
import { portalPageThemeApi } from '@/lib/api/portal-page-theme.api'
import type { PortalPageThemeItem } from '@/lib/api/types'
import { useLang } from '@/context/LanguageContext'

interface Props {
  value: string
  onChange: (themeId: string) => void
  authMethod: string
  language: string
  className?: string
}

//Custom theme ผูกกับ authType+language เสมอ ต้อง filter ตามของ portal page นี้เท่านั้น (ตามสเปค)
//list อาจจะยาวได้ เลยทำเป็น searchable dropdown แทน select ธรรมดา
export default function CustomThemeSelect({ value, onChange, authMethod, language, className }: Props) {
  const { t } = useLang()
  const tp = t.portalPage
  const [options, setOptions] = useState<PortalPageThemeItem[]>([])
  const [open, setOpen] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  //เปิด dropdown แล้วพื้นที่ด้านล่างไม่พอ (ชนขอบล่างจอ/container) ให้เปิดขึ้นด้านบนแทน ผู้ใช้จะได้ไม่ต้องเลื่อนตาม
  const PANEL_HEIGHT_ESTIMATE = 280
  const toggleOpen = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setOpenUpward(window.innerHeight - rect.bottom < PANEL_HEIGHT_ESTIMATE)
    }
    setOpen(v => !v)
  }

  const loadOptions = useCallback(() => {
    if (!authMethod || !language) { setOptions([]); return }
    portalPageThemeApi.getPortalPageThemesForSelection(authMethod, language)
      .then(res => setOptions(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOptions([]))
  }, [authMethod, language])

  useEffect(() => { loadOptions() }, [loadOptions])

  //auth method/language เปลี่ยนแล้ว theme เดิมที่เลือกไว้อาจไม่ตรงกันแล้ว ต้องเคลียร์ทิ้ง
  useEffect(() => {
    if (value && options.length > 0 && !options.some(o => o.themeId === value)) onChange('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authMethod, language, options])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = options.find(o => o.themeId === value)
  const filtered = options.filter(o => !search || (o.themeName ?? '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={clsx('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <span className={clsx('truncate', !selected && 'text-gray-400')}>{selected ? selected.themeName : tp.selectCustomThemePlaceholder}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60 flex-none" />
      </button>
      {open && (
        <div className={clsx('absolute left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden', openUpward ? 'bottom-full mb-1' : 'top-full mt-1')}>
          <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-gray-100">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-none" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tp.searchThemePlaceholder}
              className="w-full text-sm outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); setSearch('') }}
              className={clsx('w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors', !value ? 'text-primary-700 font-semibold bg-primary-50' : 'text-gray-400')}
            >
              {tp.selectCustomThemePlaceholder}
            </button>
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400">{tp.noCustomThemesForAuthLang}</p>
            ) : filtered.map(o => (
              <button
                key={o.themeId}
                type="button"
                onClick={() => { onChange(o.themeId); setOpen(false); setSearch('') }}
                className={clsx('w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors truncate', o.themeId === value ? 'text-primary-700 font-semibold bg-primary-50' : 'text-gray-700')}
              >
                {o.themeName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
