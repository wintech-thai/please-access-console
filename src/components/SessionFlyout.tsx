'use client'

import { useState, useMemo } from 'react'
import { X, FileJson, Table as TableIcon, Copy, Check } from 'lucide-react'
import clsx from 'clsx'
import { useLang } from '@/context/LanguageContext'
import type { PortalSessionItem } from '@/lib/api/types'

function flattenParameters(json?: string | null): Record<string, unknown> {
  if (!json) return {}
  try {
    const parsed = JSON.parse(json)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch { return {} }
}

const highlightJson = (json: unknown) =>
  JSON.stringify(json, null, 2).replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'text-amber-600'
      if (/^"/.test(match)) {
        if (/:$/.test(match)) cls = 'text-primary-700 font-semibold'
      } else if (/true|false/.test(match)) cls = 'text-primary-600 font-bold'
      else if (/null/.test(match)) cls = 'text-gray-400 italic'
      else if (!isNaN(Number(match))) cls = 'text-emerald-600'
      return `<span class="${cls}">${match}</span>`
    }
  )

export default function SessionFlyout({ session, showOrg, onClose }: { session: PortalSessionItem | null; showOrg?: boolean; onClose: () => void }) {
  const { t } = useLang()
  const ts = t.session
  const [tab, setTab] = useState<'table' | 'json'>('table')
  const [copiedJson, setCopiedJson] = useState(false)

  const params = useMemo(() => flattenParameters(session?.parametersJson), [session])

  if (!session) return null

  const fields: Array<[string, unknown]> = [
    ['Session ID', session.portalSessionId],
    ...(showOrg ? [['OrgId', session.orgId] as [string, unknown]] : []),
    ['PortalPageCode', session.portalPageCode],
    ['Status', session.status],
    ['StatusDesc', session.statusDesc],
    ['CreatedDate', session.createdDate],
    ['LoginDate', session.loginDate],
    ...Object.entries(params).map(([k, v]) => [`params.${k}`, v] as [string, unknown]),
  ]

  const { parametersJson: _parametersJson, ...sessionWithoutRawParams } = session
  const jsonObject = { ...sessionWithoutRawParams, parameters: params }

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonObject, null, 2))
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }

  return (
    <>
      <div className="fixed inset-0 z-[99] bg-primary-950/20" onClick={onClose} />
      <div className="fixed top-0 right-0 h-screen w-full max-w-[560px] bg-white border-l border-primary-100 shadow-[-20px_0_60px_rgba(37,99,235,0.12)] z-[100] flex flex-col">
        <div className="flex-none px-5 py-4 bg-primary-600 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">{ts.flyoutTitle}</h3>
          <button onClick={onClose} className="text-primary-200 hover:text-white p-1.5 rounded-full hover:bg-primary-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-none flex px-5 border-b border-gray-100 bg-white">
          <button
            onClick={() => setTab('table')}
            className={clsx('flex items-center gap-2 px-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 mr-6 transition-all', tab === 'table' ? 'text-primary-600 border-primary-600' : 'text-gray-400 border-transparent hover:text-gray-600')}
          >
            <TableIcon size={14} /> {ts.flyoutTable}
          </button>
          <button
            onClick={() => setTab('json')}
            className={clsx('flex items-center gap-2 px-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all', tab === 'json' ? 'text-primary-600 border-primary-600' : 'text-gray-400 border-transparent hover:text-gray-600')}
          >
            <FileJson size={14} /> {ts.flyoutJson}
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {tab === 'table' ? (
            <div className="flex flex-col h-full min-h-0">
              <div className="flex-none flex border-b border-primary-100 bg-primary-50 text-[10px] font-bold text-primary-600 uppercase tracking-widest select-none">
                <div className="w-[38%] px-4 py-2 border-r border-primary-100">{ts.flyoutField}</div>
                <div className="w-[62%] px-4 py-2">{ts.flyoutValue}</div>
              </div>
              <div className="flex-1 overflow-auto pb-8 custom-scrollbar">
                {fields.map(([k, v]) => (
                  <div key={k} className="flex border-b border-gray-50 hover:bg-primary-50/60 transition-colors">
                    <div className="w-[38%] px-4 py-2.5 border-r border-gray-100 font-semibold text-primary-700 text-xs truncate" title={k}>{k}</div>
                    <div className="w-[62%] px-4 py-2.5 text-xs text-gray-700 break-all">{v === null || v === undefined || v === '' ? '—' : String(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-0">
              <div className="flex-none p-4 border-b border-gray-100">
                <button onClick={handleCopyJson} className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-500 hover:text-primary-700 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 transition-all hover:border-primary-300 hover:bg-primary-50">
                  {copiedJson ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  {copiedJson ? ts.flyoutCopied : ts.flyoutCopyJson}
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 bg-gray-50 custom-scrollbar">
                <pre
                  className="text-xs font-mono leading-relaxed whitespace-pre-wrap select-text text-gray-800"
                  dangerouslySetInnerHTML={{ __html: highlightJson(jsonObject) }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
