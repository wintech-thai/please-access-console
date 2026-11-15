'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { useLang } from '@/context/LanguageContext'
import { organizationApi } from '@/lib/api/organization.api'
import type { CompanyProfile } from '@/lib/api/types'
import clsx from 'clsx'

const MAX_FILE_SIZE = 1 * 1024 * 1024
const MAX_DIMENSION = 512

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })
}

type FormState = {
  orgNameTh: string; orgNameEn: string
  contactNameTh: string; contactNameEn: string
  addressTh: string; addressEn: string
  phone: string; email: string; taxId: string; website: string
  logoImageBase64: string | null
}

function toFormState(data: CompanyProfile): FormState {
  return {
    orgNameTh: data.orgNameTh ?? '', orgNameEn: data.orgNameEn ?? '',
    contactNameTh: data.contactNameTh ?? '', contactNameEn: data.contactNameEn ?? '',
    addressTh: data.addressTh ?? '', addressEn: data.addressEn ?? '',
    phone: data.phone ?? '', email: data.email ?? '', taxId: data.taxId ?? '', website: data.website ?? '',
    logoImageBase64: data.logoImageBase64 ?? null,
  }
}

export default function CompanyProfilePage() {
  const { t } = useLang()
  const cp = t.companyProfile

  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showLogoDeleteConfirm, setShowLogoDeleteConfirm] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [saved, setSaved] = useState<FormState>({ orgNameTh: '', orgNameEn: '', contactNameTh: '', contactNameEn: '', addressTh: '', addressEn: '', phone: '', email: '', taxId: '', website: '', logoImageBase64: null })
  const [form, setForm] = useState<FormState>({ ...saved })

  useEffect(() => {
    organizationApi.getCompanyProfile()
      .then(res => { const s = toFormState(res.data); setSaved(s); setForm(s) })
      .catch(() => toast.error(cp.loadError))
      .finally(() => setLoading(false))
  }, [])

  const handleEdit = () => setEditing(true)
  const handleCancelClick = () => setShowCancelConfirm(true)
  const handleCancelConfirm = () => { setForm({ ...saved }); setEditing(false); setShowCancelConfirm(false) }

  const handleSave = async () => {
    setSaving(true)
    try {
      await organizationApi.updateCompanyProfile({
        OrgNameTh: form.orgNameTh || undefined, OrgNameEn: form.orgNameEn || undefined,
        ContactNameTh: form.contactNameTh || undefined, ContactNameEn: form.contactNameEn || undefined,
        AddressTh: form.addressTh || undefined, AddressEn: form.addressEn || undefined,
        Phone: form.phone || undefined, Email: form.email || undefined, TaxId: form.taxId || undefined, Website: form.website || undefined,
        LogoImageBase64: form.logoImageBase64,
      })
      setSaved({ ...form }); setEditing(false); toast.success(cp.saveSuccess)
    } catch { toast.error(cp.saveError) }
    finally { setSaving(false) }
  }

  const field = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const processLogoFile = useCallback(async (file: File) => {
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) { toast.error(cp.logoErrType); return }
    if (file.size > MAX_FILE_SIZE) { toast.error(cp.logoErrSize); return }
    const dataUrl = await readFileAsBase64(file)
    const { width, height } = await getImageDimensions(dataUrl)
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) { toast.error(cp.logoErrDimension); return }
    setForm(prev => ({ ...prev, logoImageBase64: dataUrl }))
  }, [cp])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processLogoFile(file)
    e.target.value = ''
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    if (!editing) return
    const file = e.dataTransfer.files?.[0]
    if (file) processLogoFile(file)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        <span className="text-sm">{t.admin.loading}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full gap-5">
      <div className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.07] pointer-events-none" />
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/[0.05] animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
        <div className="absolute right-20 -bottom-12 w-44 h-44 rounded-full bg-white/[0.07] animate-pulse pointer-events-none" style={{ animationDuration: '6s', animationDelay: '2s' }} />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 px-6 py-5">
          <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-inner ring-2 ring-white/10">
            {form.logoImageBase64 ? (
              <img src={form.logoImageBase64} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <svg className="w-6 h-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{cp.title}</p>
            <h2 className="text-white text-lg font-bold leading-snug mt-0.5 truncate">
              {form.orgNameTh || form.orgNameEn
                ? <>{form.orgNameTh}{form.orgNameTh && form.orgNameEn ? ' · ' : ''}{form.orgNameEn}</>
                : <span className="text-white/30 italic font-normal text-base">—</span>}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1.5">
              {form.phone && <span className="flex items-center gap-1 text-white/60 text-xs">{form.phone}</span>}
              {form.email && <span className="flex items-center gap-1 text-white/60 text-xs">{form.email}</span>}
              {form.website && <span className="flex items-center gap-1 text-white/60 text-xs">{form.website}</span>}
            </div>
          </div>
          <div className="flex gap-2 sm:flex-shrink-0">
            {!editing ? (
              <button onClick={handleEdit} className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium rounded-lg transition-all">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                {cp.editBtn}
              </button>
            ) : (
              <>
                <button onClick={handleCancelClick} disabled={saving} className="px-4 py-2 text-sm font-medium text-white/80 bg-transparent border border-white/30 rounded-lg hover:bg-white/10 transition-all disabled:opacity-50">{cp.cancelBtn}</button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-white text-primary-700 text-sm font-semibold rounded-lg transition-all hover:bg-white/90 disabled:opacity-60 shadow-sm">
                  {saving && <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  {saving ? t.admin.saving : cp.saveBtn}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={clsx('rounded-2xl overflow-hidden transition-all duration-500 bg-white', editing ? 'shadow-xl shadow-primary-900/10 border border-primary-300 ring-1 ring-primary-100' : 'shadow-sm border border-gray-200')}>
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 divide-y divide-gray-100">
            <div>
              <div className="px-6 py-3.5 bg-gray-50 border-b border-gray-100">
                <SectionHeader title={cp.generalInfoSection} />
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldRow label={cp.fieldCompanyNameTh} editing={editing} value={form.orgNameTh}><input type="text" value={form.orgNameTh} onChange={field('orgNameTh')} className={inputCls()} placeholder={cp.fieldCompanyNameTh} /></FieldRow>
                  <FieldRow label={cp.fieldCompanyNameEn} editing={editing} value={form.orgNameEn}><input type="text" value={form.orgNameEn} onChange={field('orgNameEn')} className={inputCls()} placeholder={cp.fieldCompanyNameEn} /></FieldRow>
                  <FieldRow label={cp.fieldContactNameTh} editing={editing} value={form.contactNameTh}><input type="text" value={form.contactNameTh} onChange={field('contactNameTh')} className={inputCls()} placeholder={cp.fieldContactNameTh} /></FieldRow>
                  <FieldRow label={cp.fieldContactNameEn} editing={editing} value={form.contactNameEn}><input type="text" value={form.contactNameEn} onChange={field('contactNameEn')} className={inputCls()} placeholder={cp.fieldContactNameEn} /></FieldRow>
                </div>
              </div>
            </div>
            <div>
              <div className="px-6 py-3.5 bg-gray-50 border-b border-gray-100">
                <SectionHeader title={cp.addressSection} />
              </div>
              <div className="px-6 py-5 space-y-4">
                <FieldRow label={cp.fieldAddressTh} editing={editing} value={form.addressTh}><textarea value={form.addressTh} onChange={field('addressTh')} rows={2} className={inputCls()} placeholder={cp.fieldAddressTh} /></FieldRow>
                <FieldRow label={cp.fieldAddressEn} editing={editing} value={form.addressEn}><textarea value={form.addressEn} onChange={field('addressEn')} rows={2} className={inputCls()} placeholder={cp.fieldAddressEn} /></FieldRow>
              </div>
            </div>
            <div>
              <div className="px-6 py-3.5 bg-gray-50 border-b border-gray-100">
                <SectionHeader title={cp.contactSection} />
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FieldRow label={cp.fieldPhone} editing={editing} value={form.phone}><input type="text" value={form.phone} onChange={field('phone')} className={inputCls()} placeholder={cp.fieldPhone} /></FieldRow>
                  <FieldRow label={cp.fieldEmail} editing={editing} value={form.email}><input type="email" value={form.email} onChange={field('email')} className={inputCls()} placeholder={cp.fieldEmail} /></FieldRow>
                  <FieldRow label={cp.fieldTaxId} editing={editing} value={form.taxId}><input type="text" value={form.taxId} onChange={field('taxId')} className={inputCls()} placeholder={cp.fieldTaxId} /></FieldRow>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-64 xl:w-72 bg-gray-50/60 border-t lg:border-t-0 lg:border-l border-gray-100">
            <div className="px-6 py-3.5 bg-gray-50 border-b border-gray-100">
              <SectionHeader title={cp.logoSection} />
            </div>
            <div className="p-6">
              {form.logoImageBase64 ? (
                <div className="space-y-3">
                  <div className="aspect-square rounded-xl border border-gray-200 overflow-hidden bg-white flex items-center justify-center">
                    <img src={form.logoImageBase64} alt="Logo" className="max-w-full max-h-full object-contain p-3" />
                  </div>
                  {editing && (
                    <div className="flex gap-2">
                      <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">{cp.logoUpload}</button>
                      <button onClick={() => setShowLogoDeleteConfirm(true)} className="flex-1 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">{cp.logoDelete}</button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); if (editing) setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => editing && fileInputRef.current?.click()}
                  className={clsx('aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all',
                    editing ? (dragOver ? 'border-primary-400 bg-primary-50 cursor-pointer' : 'border-gray-300 bg-white hover:border-primary-300 hover:bg-primary-50 cursor-pointer') : 'border-gray-200 bg-gray-50 cursor-default')}
                >
                  <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                  {editing && (<><p className="text-xs text-gray-400 text-center px-4">{cp.logoDragDrop}</p><span className="text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">{cp.logoChoose}</span></>)}
                </div>
              )}
            </div>
            {editing && <p className="text-[10px] text-gray-400 px-6 pb-5 leading-relaxed">{cp.logoHint}</p>}
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleFileChange} />
          </div>
        </div>
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)}>
          <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-5 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
              <h3 className="text-base font-bold text-gray-900 mb-1">{cp.cancelConfirmTitle}</h3>
              <p className="text-sm text-gray-500">{cp.cancelConfirmDesc}</p>
            </div>
            <div className="flex gap-2 px-6 pb-5">
              <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">{t.admin.cancel}</button>
              <button onClick={handleCancelConfirm} className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">{t.admin.yes}</button>
            </div>
          </div>
        </div>
      )}
      {showLogoDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoDeleteConfirm(false)}>
          <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-5 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>
              <h3 className="text-base font-bold text-gray-900 mb-1">{cp.logoConfirmDelete}</h3>
              <p className="text-sm text-gray-500">{cp.logoConfirmDeleteDesc}</p>
            </div>
            <div className="flex gap-2 px-6 pb-5">
              <button onClick={() => setShowLogoDeleteConfirm(false)} className="flex-1 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">{t.admin.cancel}</button>
              <button onClick={() => { setForm(prev => ({ ...prev, logoImageBase64: null })); setShowLogoDeleteConfirm(false) }} className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">{t.admin.delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function inputCls() {
  return 'w-full text-sm rounded-xl px-3 py-2 outline-none transition-all resize-none border border-gray-300 bg-white text-gray-900 placeholder-gray-400 hover:border-gray-400 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500'
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 border border-primary-200 shadow-sm flex items-center justify-center flex-shrink-0" />
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
    </div>
  )
}

function FieldRow({ label, children, editing, value }: { label: string; children: React.ReactNode; editing: boolean; value?: string }) {
  return (
    <div className={!editing ? 'group' : undefined}>
      <label className="block text-[10px] font-bold text-primary-600 uppercase tracking-widest mb-1.5">{label}</label>
      {editing ? children : (
        <div className="relative -mx-2 px-2 py-1.5 rounded-lg transition-all duration-200 group-hover:bg-primary-50 overflow-hidden">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line min-h-[1.5rem] pr-5">{value || <span className="text-gray-300">—</span>}</p>
        </div>
      )}
    </div>
  )
}
