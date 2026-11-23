'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Wifi, AlertCircle, Loader2, Eye, EyeOff, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'

interface PortalInfo {
  code?: string | null
  theme?: string | null
  authMethod?: string | null
  language?: string | null
}

type Lang = 'Thai' | 'English'

const COPY: Record<Lang, Record<string, string>> = {
  Thai: {
    wifiPortalBadge: 'WiFi Portal',
    signInSubtitle: 'เข้าสู่ระบบเพื่อใช้งานอินเทอร์เน็ต',
    connecting: 'กำลังเชื่อมต่อ...',
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
  },
  English: {
    wifiPortalBadge: 'WiFi Portal',
    signInSubtitle: 'Sign in to continue to the internet',
    connecting: 'Connecting...',
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
  },
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

function LoginPortalContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orgId = params.orgId as string
  const tenantId = params.tenantId as string

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [errorDetail, setErrorDetail] = useState('')
  const [showErrorDetail, setShowErrorDetail] = useState(false)
  const [portalPage, setPortalPage] = useState<PortalInfo | null>(null)
  const [portalSessionId, setPortalSessionId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  const lang: Lang = portalPage?.language === 'English' ? 'English' : 'Thai'
  const c = COPY[lang]

  useEffect(() => {
    //key auth ผ่าน Basic auth header แทน ไม่ส่งเป็น query param แล้ว (เลี่ยงไม่ให้ key หลุดไปอยู่ใน audit log ของ session)
    //ส่วน query param อื่นๆ ที่ Mikrotik ส่งมา (mac/ip/link-orig ฯลฯ) ยัง forward ต่อไปเหมือนเดิม
    const params = new URLSearchParams(searchParams.toString())
    const key = params.get('key')
    params.delete('key')
    const query = params.toString()
    const url = `/api/proxy/api/PortalSession/org/${encodeURIComponent(orgId)}/action/AddPortalSession/${encodeURIComponent(tenantId)}${query ? `?${query}` : ''}`

    if (key) setApiKey(key)

    fetch(url, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store', //เป็น GET เดิมซ้ำ querystring เดิมได้บ่อย (ผู้ใช้กดลิงก์เดิมซ้ำ) กัน browser cache ตอบ response เก่าไม่ยอมยิง request ใหม่ไปเช็คสถานะล่าสุดจริง
      headers: key ? { Authorization: `Basic ${btoa(`portal-page:${key}`)}` } : {},
    })
      .then(async res => {
        const data = await res.json().catch(() => null)
        const session = data?.portalSession
        if (session?.status === 'Authorized' || session?.status === 'Pending') {
          setPortalPage(data?.portalPage ?? null)
          setPortalSessionId(session?.portalSessionId ?? '')
        } else {
          setErrorMsg(session?.statusDesc || data?.description || 'This WiFi login link is not valid.')
          setErrorDetail(JSON.stringify({ httpStatus: res.status, httpStatusMeaning: describeHttpStatus(res.status), ...data }, null, 2))
        }
      })
      .catch((err: unknown) => {
        setErrorMsg('Unable to connect. Please try again.')
        setErrorDetail(err instanceof Error ? err.message : String(err))
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, tenantId])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    if (!username.trim() || !password) { setLoginError(c.usernameRequired); return }
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
        body: JSON.stringify({ UserName: username.trim(), Password: password }),
      })
      const data = await res.json().catch(() => null)
      if (data?.status === 'OK') {
        setRedirecting(true)
        const redirectUrl = data?.redirectUrl
        setTimeout(() => {
          if (redirectUrl) window.location.href = redirectUrl
        }, 1500)
      } else {
        setLoginError(data?.description || c.invalidLink)
      }
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : c.unableToConnect)
    } finally {
      setSigningIn(false)
    }
  }

  const isNative = (portalPage?.authMethod ?? '').toLowerCase() === 'native'

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
            {loading ? (
              <div className="flex flex-col items-center py-8 text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin mb-3 text-blue-400" />
                <p className="text-sm">{c.connecting}</p>
              </div>
            ) : errorMsg ? (
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
                      <pre className="mt-2 w-full max-h-40 overflow-auto text-left text-[10px] leading-relaxed text-slate-400 bg-slate-900/80 border border-slate-700/60 rounded-lg p-3 whitespace-pre-wrap break-all">
                        {errorDetail}
                      </pre>
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

export default function LoginPortalPage() {
  return (
    <Suspense>
      <LoginPortalContent />
    </Suspense>
  )
}
