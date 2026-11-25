'use client'

import { useRef } from 'react'
import { Plus, Trash2, Eye, Sparkles, Upload } from 'lucide-react'
import clsx from 'clsx'
import type { PortalPageThemeVariable } from '@/lib/api/types'
import { useLang } from '@/context/LanguageContext'
import { getStarterTemplate } from '@/lib/theme-starter-templates'
import { toast } from 'sonner'
import CodeMirror from '@uiw/react-codemirror'
import { html } from '@codemirror/lang-html'

function FormField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function LanguageOption({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
        checked ? 'bg-primary-50 border-primary-400 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
      )}
    >
      {label}
    </button>
  )
}

export const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white'

interface Props {
  themeName: string
  setThemeName: (v: string) => void
  nameError?: string
  description: string
  setDescription: (v: string) => void
  authType: string
  language: string
  setLanguage: (v: string) => void
  variables: PortalPageThemeVariable[]
  setVariables: (v: PortalPageThemeVariable[]) => void
  htmlTemplate: string
  setHtmlTemplate: (v: string) => void
  htmlError?: string
  onPreview: () => void
}

export default function PortalPageThemeFormBody({
  themeName, setThemeName, nameError,
  description, setDescription,
  authType,
  language, setLanguage,
  variables, setVariables,
  htmlTemplate, setHtmlTemplate, htmlError,
  onPreview,
}: Props) {
  const { t } = useLang()
  const tt = t.portalPageTheme
  const fileInputRef = useRef<HTMLInputElement>(null)

  const confirmOverwrite = () => !htmlTemplate.trim() || window.confirm(tt.confirmOverwriteTemplate)

  const handleLoadExample = () => {
    if (!confirmOverwrite()) return
    const starter = getStarterTemplate(authType)
    setHtmlTemplate(starter.html)
    setVariables(starter.variables)
  }

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/\.html?$/i.test(file.name)) { toast.error(tt.invalidFileType); return }
    if (!confirmOverwrite()) return
    const reader = new FileReader()
    reader.onload = () => setHtmlTemplate(String(reader.result ?? ''))
    reader.onerror = () => toast.error(tt.failedToReadFile)
    reader.readAsText(file)
  }

  const duplicateNames = new Set<string>()
  const seen = new Set<string>()
  for (const v of variables) {
    const key = (v.name ?? '').trim().toLowerCase()
    if (!key) continue
    if (seen.has(key)) duplicateNames.add(key)
    seen.add(key)
  }

  const updateVariable = (idx: number, field: 'name' | 'value', value: string) => {
    const next = variables.slice()
    next[idx] = { ...next[idx], [field]: value }
    setVariables(next)
  }

  const removeVariable = (idx: number) => setVariables(variables.filter((_, i) => i !== idx))
  const addVariable = () => setVariables([...variables, { name: '', value: '' }])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-7 py-6 flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label={tt.fieldName} required>
          <input
            value={themeName}
            onChange={e => setThemeName(e.target.value)}
            placeholder={tt.fieldNamePlaceholder}
            className={clsx(inputCls, nameError && 'border-red-400 focus:ring-red-400')}
            autoFocus
          />
          {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
        </FormField>
        <FormField label={tt.fieldAuthType} hint={tt.authTypeHint}>
          <div className={clsx(inputCls, 'bg-gray-50 text-gray-700 font-medium cursor-not-allowed')}>
            {authType === 'Google' ? tt.authTypeGoogle : tt.authTypeNative}
          </div>
        </FormField>
      </div>

      <FormField label={tt.fieldDescription}>
        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={tt.fieldDescriptionPlaceholder}
          className={inputCls}
        />
      </FormField>

      <FormField label={tt.fieldLanguage} required>
        <div className="flex gap-3">
          <LanguageOption label={tt.languageThai} checked={language === 'Thai'} onClick={() => setLanguage('Thai')} />
          <LanguageOption label={tt.languageEnglish} checked={language === 'English'} onClick={() => setLanguage('English')} />
        </div>
      </FormField>

      <FormField label={tt.fieldVariables} hint={tt.variablesHint}>
        <div className="flex flex-col gap-2">
          {variables.map((v, i) => {
            const isDup = !!(v.name && duplicateNames.has(v.name.trim().toLowerCase()))
            return (
              <div key={i} className="flex gap-2 items-start">
                <input
                  value={v.name ?? ''}
                  onChange={e => updateVariable(i, 'name', e.target.value)}
                  placeholder={tt.varNamePlaceholder}
                  className={clsx(inputCls, 'sm:w-48 flex-none', isDup && 'border-red-400 focus:ring-red-400')}
                />
                <input
                  value={v.value ?? ''}
                  onChange={e => updateVariable(i, 'value', e.target.value)}
                  placeholder={tt.varValuePlaceholder}
                  className={clsx(inputCls, 'flex-1')}
                />
                <button type="button" onClick={() => removeVariable(i)} title={tt.removeVariable} className="flex-none p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
          {duplicateNames.size > 0 && <p className="text-red-500 text-xs">{tt.variableNameDuplicate}</p>}
          <button type="button" onClick={addVariable} className="self-start flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" />{tt.addVariable}
          </button>
        </div>
      </FormField>

      <FormField label={tt.fieldHtmlTemplate} required hint={tt.htmlTemplateHint}>
        <div className={clsx('border rounded-lg overflow-hidden text-xs', htmlError ? 'border-red-400' : 'border-gray-200')}>
          <CodeMirror
            value={htmlTemplate}
            onChange={value => setHtmlTemplate(value)}
            placeholder={tt.htmlTemplatePlaceholder}
            extensions={[html()]}
            height="320px"
            basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}
          />
        </div>
        {htmlError && <p className="text-red-500 text-xs mt-1">{htmlError}</p>}
        <p className="text-xs text-gray-400 mt-1">{tt.htmlTemplateSystemHint}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleLoadExample}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />{tt.loadExample}
          </button>
          <button
            type="button"
            onClick={handleUploadClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />{tt.uploadHtml}
          </button>
          <input ref={fileInputRef} type="file" accept=".html,.htm,text/html" onChange={handleFileSelected} className="hidden" />
          <button
            type="button"
            onClick={onPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />{tt.previewButton}
          </button>
        </div>
      </FormField>
    </div>
  )
}
