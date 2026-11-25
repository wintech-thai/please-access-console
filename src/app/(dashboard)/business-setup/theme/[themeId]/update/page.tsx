'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { portalPageThemeApi } from '@/lib/api/portal-page-theme.api'
import type { PortalPageThemeItem, PortalPageThemeVariable } from '@/lib/api/types'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import { useLang } from '@/context/LanguageContext'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import LeaveConfirmModal from '@/components/LeaveConfirmModal'
import PortalPageThemeFormBody from '@/components/PortalPageThemeFormBody'
import { openThemePreview } from '@/lib/theme-render'

export default function ThemeUpdatePage() {
  const { t } = useLang()
  const tt = t.portalPageTheme
  const router = useRouter()
  const params = useParams()
  const themeId = params.themeId as string

  const [original, setOriginal] = useState<PortalPageThemeItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [themeName, setThemeName] = useState('')
  const [description, setDescription] = useState('')
  const [authType, setAuthType] = useState('Native')
  const [language, setLanguage] = useState('Thai')
  const [variables, setVariables] = useState<PortalPageThemeVariable[]>([])
  const [htmlTemplate, setHtmlTemplate] = useState('')
  const [nameError, setNameError] = useState('')
  const [htmlError, setHtmlError] = useState('')
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await portalPageThemeApi.getPortalPageThemeById(themeId)
      const theme = res.data?.portalPageTheme
      setOriginal(theme ?? null)
      setThemeName(theme?.themeName ?? '')
      setDescription(theme?.description ?? '')
      setAuthType(theme?.authType ?? 'Native')
      setLanguage(theme?.language ?? 'Thai')
      setVariables(theme?.variables ?? [])
      setHtmlTemplate(theme?.htmlTemplate ?? '')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tt.failedToLoadTheme)
    } finally {
      setLoading(false)
    }
  }, [themeId, tt.failedToLoadTheme])

  useEffect(() => { loadData() }, [loadData])

  const isDirty = useMemo(() => {
    if (!original) return false
    return themeName !== (original.themeName ?? '') ||
      description !== (original.description ?? '') ||
      language !== (original.language ?? 'Thai') ||
      htmlTemplate !== (original.htmlTemplate ?? '') ||
      JSON.stringify(variables) !== JSON.stringify(original.variables ?? [])
  }, [original, themeName, description, language, htmlTemplate, variables])

  const { showConfirm, guardNavigation, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty)

  const goBack = () => guardNavigation(() => router.push('/business-setup/theme'))

  const handlePreview = () => openThemePreview(htmlTemplate, variables)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameError('')
    setHtmlError('')
    const trimmedName = themeName.trim()
    if (!trimmedName) { setNameError(tt.nameRequired); return }
    if (!htmlTemplate.trim()) { setHtmlError(tt.htmlRequired); return }
    //ไม่มีอะไรเปลี่ยนจริง ไม่ต้องยิง API หรือขึ้น toast กลับไปหน้า list เฉยๆ
    if (!isDirty || !original) { router.push('/business-setup/theme'); return }

    setSaving(true)
    try {
      const res = await portalPageThemeApi.updatePortalPageThemeById(themeId, {
        ThemeName: trimmedName,
        Description: description || undefined,
        Language: language,
        Variables: variables.filter(v => v.name),
        HtmlTemplate: htmlTemplate,
      })
      toast.success(tt.updateSuccess)
      sessionStorage.setItem('access_portal_page_themes_highlight', themeId)
      router.push('/business-setup/theme')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tt.failedToUpdate)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
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
      {showConfirm && <LeaveConfirmModal onConfirm={confirmLeave} onCancel={cancelLeave} />}

      <div className="flex-none flex items-center gap-3 mb-6">
        <button onClick={goBack} className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tt.editTitle}</h1>
          <p className="text-base text-gray-500 mt-0.5">{tt.editSubtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-2 custom-scrollbar">
          <PortalPageThemeFormBody
            themeName={themeName} setThemeName={setThemeName} nameError={nameError}
            description={description} setDescription={setDescription}
            authType={authType}
            language={language} setLanguage={setLanguage}
            variables={variables} setVariables={setVariables}
            htmlTemplate={htmlTemplate} setHtmlTemplate={setHtmlTemplate} htmlError={htmlError}
            onPreview={handlePreview}
          />
        </div>

        <div className="flex-none -mx-3 sm:-mx-6 px-4 sm:px-8 py-4 flex items-center justify-end gap-3 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <button type="button" onClick={goBack} className={cancelBtnCls}>{t.admin.cancel}</button>
          <button type="submit" disabled={saving} className={primaryBtnCls}>
            {saving ? <><Spinner />{t.admin.saving}</> : t.admin.save}
          </button>
        </div>
      </form>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin inline mr-2" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

const cancelBtnCls = 'px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
const primaryBtnCls = 'flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-60 transition-colors'
