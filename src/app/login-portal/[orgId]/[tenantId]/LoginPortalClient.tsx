'use client'

import { useState, useEffect } from 'react'
import { Wifi, AlertCircle, Loader2, Eye, EyeOff, ChevronDown, ChevronUp, CheckCircle2, Copy, Check } from 'lucide-react'
import { renderPortalPageThemeHtml, type ThemeRenderVariable } from '@/lib/theme-render'
import clsx from 'clsx'

interface PortalInfo {
  code?: string | null
  theme?: string | null
  themeId?: string | null
  authMethod?: string | null
  language?: string | null
}

interface PortalPageTheme {
  htmlTemplate?: string | null
  variables?: ThemeRenderVariable[] | null
}

type Lang = 'Thai' | 'English'

const COPY: Record<Lang, Record<string, string>> = {
  Thai: {
    wifiPortalBadge: 'WiFi Portal',
    signInSubtitle: 'เข้าสู่ระบบเพื่อใช้งานอินเทอร์เน็ต',
    username: 'ชื่อผู้ใช้',
    usernamePlaceholder: 'กรอกชื่อผู้ใช้',
    password: 'รหัสผ่าน',
    signIn: 'เข้าสู่ระบบ',
    signingIn: 'กำลังเข้าสู่ระบบ...',
    redirecting: 'เข้าสู่ระบบสำเร็จ กำลังพาคุณไปต่อ...',
    comingSoon: 'การเข้าสู่ระบบยังไม่พร้อมใช้งานสำหรับ portal นี้',
    showDetails: 'แสดงรายละเอียด',
    hideDetails: 'ซ่อนรายละเอียด',
    poweredBy: 'สนับสนุนโดย',
    unableToConnect: 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่อีกครั้ง',
    invalidLink: 'ลิงก์เข้าสู่ระบบ WiFi นี้ไม่ถูกต้อง',
    usernameRequired: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน',
    errInvalidCredentials: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    errUserDisabled: 'บัญชีผู้ใช้นี้ถูกปิดใช้งาน',
    errNoRealmConfigured: 'Portal page นี้ยังไม่ได้ตั้งค่า Realm สำหรับเข้าสู่ระบบ',
    errPortalPageNotFound: 'ไม่พบ Portal Page นี้',
    errPortalPageDisabled: 'Portal Page นี้ถูกปิดใช้งานอยู่',
    errApiKeyMismatch: 'API key ไม่ตรงกับ Portal Page นี้',
    errMissingMac: 'ไม่พบข้อมูล MAC address จากอุปกรณ์',
    copyJson: 'คัดลอก',
    copied: 'คัดลอกแล้ว',
  },
  English: {
    wifiPortalBadge: 'WiFi Portal',
    signInSubtitle: 'Sign in to continue to the internet',
    username: 'Username',
    usernamePlaceholder: 'Enter your username',
    password: 'Password',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    redirecting: 'Signed in successfully. Redirecting...',
    comingSoon: 'Login is coming soon for this portal',
    showDetails: 'Show details',
    hideDetails: 'Hide details',
    poweredBy: 'Powered by',
    unableToConnect: 'Unable to connect. Please try again.',
    invalidLink: 'This WiFi login link is not valid.',
    usernameRequired: 'Please enter your username and password',
    errInvalidCredentials: 'Username or password is incorrect',
    errUserDisabled: 'This user is disabled',
    errNoRealmConfigured: 'Portal page or realm not configured for this session',
    errPortalPageNotFound: 'This Portal Page could not be found',
    errPortalPageDisabled: 'This Portal Page is currently disabled',
    errApiKeyMismatch: 'API key does not match this Portal Page',
    errMissingMac: 'No MAC address was received from the device',
    copyJson: 'Copy',
    copied: 'Copied',
  },
}

//map error status code จาก backend -> key ของ COPY เอาไว้แปลตามภาษาของ portal page เอง backend ส่งมาเป็น description ภาษาอังกฤษตายตัว
const LOGIN_ERROR_COPY_KEY: Record<string, keyof typeof COPY.Thai> = {
  INVALID_CREDENTIALS: 'errInvalidCredentials',
  USER_DISABLED: 'errUserDisabled',
  ERROR_NO_REALM_CONFIGURED: 'errNoRealmConfigured',
}

//map error code จาก statusDesc ของ AddPortalSession (รูปแบบ "CODE - ข้อความ") -> key ของ COPY เพื่อแปลตามภาษาของ portal page
const SESSION_ERROR_COPY_KEY: Record<string, keyof typeof COPY.Thai> = {
  ERROR_PORTAL_PAGE_NOT_FOUND: 'errPortalPageNotFound',
  ERROR_PORTAL_PAGE_DISABLED: 'errPortalPageDisabled',
  ERROR_API_KEY_NOT_OWN_BY_PORTAL_PAGE: 'errApiKeyMismatch',
  ERROR_MISSING_MAC: 'errMissingMac',
}

function translateSessionError(statusDesc: string | undefined | null, fallback: string, lang: Lang): string {
  const copy = COPY[lang]
  const code = statusDesc?.match(/^([A-Z_]+) - /)?.[1]
  const copyKey = code ? SESSION_ERROR_COPY_KEY[code] : undefined
  return copyKey ? copy[copyKey] : (statusDesc || fallback)
}

//คำอธิบาย HTTP status สั้นๆ แปะไว้ใน error detail กันคนลืมว่า status นี้คืออะไร
function describeHttpStatus(status: number): string {
  const map: Record<number, string> = {
    400: 'Bad Request – the request was malformed or missing required data',
    401: 'Unauthorized – authentication failed or is missing',
    403: 'Forbidden – authenticated but not permitted to call this API',
    404: 'Not Found – the resource (portal page / session) does not exist',
    409: 'Conflict – the request conflicts with the current state',
    429: 'Too Many Requests – rate limited',
    500: 'Internal Server Error – unhandled exception on the server',
    502: 'Bad Gateway – upstream server returned an invalid response',
    503: 'Service Unavailable – server is temporarily overloaded or down',
    504: 'Gateway Timeout – upstream server took too long to respond',
  }
  return map[status] ?? 'Unknown status'
}

interface InitialState {
  portalPage: PortalInfo | null
  portalSessionId: string
  customThemeHtml: string | null
  errorMsg: string
  errorDetail: string
}

//ประมวลผล response ของ AddPortalSession ที่ server component ไป fetch มาให้แล้วตรงๆ ตั้งแต่ render รอบแรกเลย
//ไม่ต้องรอ client fetch ใน useEffect อีกต่อไป - หน้าแรกที่ส่งมาจาก server ก็เป็นสีของ theme จริงอยู่แล้ว ไม่มีจังหวะวาบสีกลางๆ ให้เห็นเลย
function deriveInitialState(data: unknown, httpStatus: number, networkError: string | null): InitialState {
  if (networkError) {
    return {
      portalPage: null,
      portalSessionId: '',
      customThemeHtml: null,
      errorMsg: COPY.Thai.unableToConnect,
      errorDetail: networkError,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any
  const session = d?.portalSession

  if (session?.status === 'Authorized' || session?.status === 'Pending') {
    const portalPage: PortalInfo | null = d?.portalPage ?? null
    const theme: PortalPageTheme | undefined = d?.portalPageTheme
    const customThemeHtml = theme?.htmlTemplate
      ? renderPortalPageThemeHtml(theme.htmlTemplate, theme.variables, {
          SYSTEM_CODE_GEN1: 'return window.__papSubmit(event)',
          SYSTEM_CODE_GEN2: 'window.__papGoogleLogin(); return false;',
        })
      : null

    return { portalPage, portalSessionId: session?.portalSessionId ?? '', customThemeHtml, errorMsg: '', errorDetail: '' }
  }

  const portalPage: PortalInfo | null = d?.portalPage ?? null
  const errLang: Lang = portalPage?.language === 'English' ? 'English' : 'Thai'
  return {
    portalPage,
    portalSessionId: '',
    customThemeHtml: null,
    errorMsg: translateSessionError(session?.statusDesc, d?.description || COPY[errLang].invalidLink, errLang),
    errorDetail: JSON.stringify({ httpStatus, httpStatusMeaning: describeHttpStatus(httpStatus), ...d }, null, 2),
  }
}

interface Props {
  orgId: string
  tenantId: string
  apiKey: string
  data: unknown
  httpStatus: number
  networkError: string | null
}

export default function LoginPortalClient({ orgId, tenantId, apiKey, data, httpStatus, networkError }: Props) {
  const [initial] = useState(() => deriveInitialState(data, httpStatus, networkError))
  const { portalPage, portalSessionId, customThemeHtml, errorMsg, errorDetail } = initial

  const [showErrorDetail, setShowErrorDetail] = useState(false)
  const [copiedDetail, setCopiedDetail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  const lang: Lang = portalPage?.language === 'English' ? 'English' : 'Thai'
  const c = COPY[lang]

  const performNativeLogin = async (nativeUsername: string, nativePassword: string) => {
    setLoginError('')
    if (!nativeUsername.trim() || !nativePassword) { setLoginError(c.usernameRequired); return }
    setSigningIn(true)
    try {
      const url = `/api/proxy/api/PortalSession/org/${encodeURIComponent(orgId)}/action/VerifyNativeLogin/${encodeURIComponent(portalSessionId)}`
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Basic ${btoa(`portal-page:${apiKey}`)}` } : {}),
        },
        body: JSON.stringify({ UserName: nativeUsername.trim(), Password: nativePassword }),
      })
      const data = await res.json().catch(() => null)
      if (data?.status === 'OK') {
        setRedirecting(true)
        const redirectUrl = data?.redirectUrl
        setTimeout(() => {
          if (redirectUrl) window.location.href = redirectUrl
        }, 1500)
      } else {
        const copyKey = data?.status ? LOGIN_ERROR_COPY_KEY[data.status] : undefined
        setLoginError(copyKey ? c[copyKey] : (data?.description || c.invalidLink))
      }
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : c.unableToConnect)
    } finally {
      setSigningIn(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    await performNativeLogin(username, password)
  }

  //เปิดให้ custom theme html (ที่ render ผ่าน dangerouslySetInnerHTML) เรียกกลับเข้ามาที่ login flow จริงได้ ผ่าน $SYSTEM_CODE_GEN1/$SYSTEM_CODE_GEN2 ใน template
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__papSubmit = (e: Event) => {
      e.preventDefault()
      const form = e.target as HTMLFormElement
      const u = (form.elements.namedItem('username') as HTMLInputElement | null)?.value ?? ''
      const p = (form.elements.namedItem('password') as HTMLInputElement | null)?.value ?? ''
      performNativeLogin(u, p)
      return false
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__papGoogleLogin = () => {
      setLoginError(c.comingSoon)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, portalSessionId, apiKey])

  const isNative = (portalPage?.authMethod ?? '').toLowerCase() === 'native'

  //custom theme เป็นหน้า login เต็มหน้าในตัวเองอยู่แล้ว (ออกแบบมาให้ครอบคลุมทั้งหน้า) เลย render แทนที่ chrome ปกติทั้งหมด ไม่ซ้อนการ์ดเข้าไปข้างใน
  //ไม่ครอบ error/redirecting เพราะ state พวกนั้นไม่เกี่ยวกับ theme เลย
  if (!errorMsg && !redirecting && customThemeHtml) {
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: customThemeHtml }} />
        {(signingIn || loginError) && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-700/60 rounded-lg px-4 py-2 shadow-lg z-50">
            <p className={clsx('text-xs text-center', loginError ? 'text-rose-400' : 'text-slate-300')}>{signingIn ? c.signingIn : loginError}</p>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background blobs + dot mesh, matching dev-hubs.com */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 left-4 sm:left-16 w-72 h-72 bg-blue-600 rounded-full blur-3xl opacity-15 animate-pulse" />
        <div className="absolute bottom-10 right-4 sm:right-16 w-72 h-72 bg-cyan-500 rounded-full blur-3xl opacity-10 animate-pulse [animation-delay:2s]" />
        <div
          className="absolute inset-0 opacity-25"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.12) 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
      </div>

      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            Please<span className="text-blue-400"> Access</span>
          </span>
        </div>

        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl shadow-slate-950/60 overflow-hidden">
          <div className="px-8 pt-8 pb-6 text-center border-b border-slate-700/50">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[11px] font-semibold px-3 py-1 rounded-full mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              {c.wifiPortalBadge}
            </div>
            <h1 className="text-lg font-bold text-white break-all">
              {orgId.split(/(hubs)/i).map((part, i) =>
                part.toLowerCase() === 'hubs' ? <span key={i} className="text-blue-400">{part}</span> : part
              )}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">{c.signInSubtitle}</p>
          </div>

          <div className="px-8 pb-8 pt-6">
            {errorMsg ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-3">
                  <AlertCircle className="w-6 h-6 text-rose-400" />
                </div>
                <p className="text-rose-300 font-medium text-sm">{errorMsg}</p>
                {errorDetail && (
                  <div className="w-full mt-4">
                    <button
                      type="button"
                      onClick={() => setShowErrorDetail(v => !v)}
                      className="flex items-center gap-1 mx-auto text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showErrorDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {showErrorDetail ? c.hideDetails : c.showDetails}
                    </button>
                    {showErrorDetail && (
                      <div className="mt-2">
                        <div className="flex justify-end mb-1">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(errorDetail)
                              setCopiedDetail(true)
                              setTimeout(() => setCopiedDetail(false), 2000)
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md bg-slate-800/90 border border-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            {copiedDetail ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copiedDetail ? c.copied : c.copyJson}
                          </button>
                        </div>
                        <pre className="w-full max-h-40 overflow-auto text-left text-[10px] leading-relaxed text-slate-400 bg-slate-900/80 border border-slate-700/60 rounded-lg p-3 whitespace-pre-wrap break-all">
                          {errorDetail}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : redirecting ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-emerald-300 font-medium text-sm mb-3">{c.redirecting}</p>
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              </div>
            ) : isNative ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{c.username}</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setLoginError('') }}
                    placeholder={c.usernamePlaceholder}
                    disabled={signingIn}
                    autoFocus
                    className="w-full px-3 py-2.5 text-sm border border-slate-700 rounded-lg bg-slate-900/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{c.password}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setLoginError('') }}
                      placeholder="••••••••"
                      disabled={signingIn}
                      className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-700 rounded-lg bg-slate-900/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {loginError && <p className="text-rose-400 text-xs text-center">{loginError}</p>}
                <button
                  type="submit"
                  disabled={signingIn}
                  className="w-full py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {signingIn && <Loader2 className="w-4 h-4 animate-spin" />}
                  {signingIn ? c.signingIn : c.signIn}
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <p className="text-xs text-slate-500">{c.comingSoon}{portalPage?.code ? ` (${portalPage.code})` : ''}</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          {c.poweredBy} <span className="text-slate-300 font-semibold">Dev<span className="text-blue-400"> Hub</span></span>
        </p>
      </div>
    </div>
  )
}
