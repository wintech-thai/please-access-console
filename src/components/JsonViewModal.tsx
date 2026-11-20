'use client'

import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'

const MAX_STRING_LEN = 120

//ค่ายาวมาก (เช่น base64 รูปภาพ) ตัดให้สั้นลงตอนแสดงผลเฉยๆ ไม่กระทบ Copy JSON ที่ยังได้ค่าเต็ม
const highlightJson = (json: unknown) =>
  JSON.stringify(json, null, 2).replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        const isKey = /:$/.test(match)
        let display = match
        if (!isKey && match.length > MAX_STRING_LEN + 2) {
          const inner = match.slice(1, -1)
          display = `"${inner.slice(0, MAX_STRING_LEN)}… (${inner.length} chars, truncated)"`
        }
        if (isKey) return `<span style="color:#6366f1;font-weight:600">${display}</span>`
        return `<span style="color:#059669">${display}</span>`
      }
      if (/true|false/.test(match)) return `<span style="color:#d97706">${match}</span>`
      if (/null/.test(match)) return `<span style="color:#9ca3af">${match}</span>`
      return `<span style="color:#0284c7">${match}</span>`
    }
  )

export default function JsonViewModal({ data, onClose, copyLabel = 'Copy', copiedLabel = 'Copied!' }: {
  data: unknown
  onClose: () => void
  copyLabel?: string
  copiedLabel?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-none">
          <span className="text-sm font-semibold text-gray-700 font-mono">Raw JSON</span>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? copiedLabel : copyLabel}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <pre
          className="overflow-auto p-5 text-xs font-mono leading-relaxed whitespace-pre-wrap break-all bg-gray-50"
          dangerouslySetInnerHTML={{ __html: highlightJson(data) }}
        />
      </div>
    </div>
  )
}
