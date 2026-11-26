'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { renderPortalPageThemeHtml, type ThemeRenderVariable } from '@/lib/theme-render'

interface PreviewPayload {
  htmlTemplate: string
  variables: ThemeRenderVariable[]
}

function ThemePreviewContent() {
  const searchParams = useSearchParams()
  const storageKey = searchParams.get('key') ?? ''
  const [html, setHtml] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    //preview mode ไม่มี session จริง กดแล้วแค่เตือนว่าเป็น preview ไม่ได้ login จริง
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__papSubmit = (e: Event) => { e.preventDefault(); window.alert('Preview mode - login is disabled'); return false }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__papGoogleLogin = () => { window.alert('Preview mode - login is disabled') }

    if (!storageKey) { setNotFound(true); return }
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) { setNotFound(true); return }
      const payload: PreviewPayload = JSON.parse(raw)
      setHtml(renderPortalPageThemeHtml(payload.htmlTemplate, payload.variables, { SYSTEM_CODE_GEN1: 'return window.__papSubmit(event)', SYSTEM_CODE_GEN2: 'window.__papGoogleLogin(); return false;' }))
      //ไม่ลบ key ทิ้งทันทีหลังอ่าน เพราะ React dev mode (StrictMode) เรียก effect นี้ซ้ำสองรอบ
      //รอบสองจะหา key ไม่เจอ (ถูกลบไปจากรอบแรก) แล้วทำให้ขึ้น "not found" ทับผลลัพธ์ที่โหลดสำเร็จไปแล้วอย่างผิดๆ
    } catch {
      setNotFound(true)
    }
  }, [storageKey])

  if (notFound) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#888' }}>Preview data not found. Please try again from the Theme page.</div>
  }

  if (html == null) return null

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

export default function ThemePreviewPage() {
  return (
    <Suspense>
      <ThemePreviewContent />
    </Suspense>
  )
}
