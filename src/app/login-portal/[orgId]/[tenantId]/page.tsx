'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Wifi, AlertCircle, Loader2, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'

interface PortalInfo {
  code?: string | null
  theme?: string | null
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
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    //key auth ผ่าน Basic auth header แทน ไม่ส่งเป็น query param แล้ว (เลี่ยงไม่ให้ key หลุดไปอยู่ใน audit log ของ session)
    //ส่วน query param อื่นๆ ที่ Mikrotik ส่งมา (mac/ip/link-orig ฯลฯ) ยัง forward ต่อไปเหมือนเดิม
    const params = new URLSearchParams(searchParams.toString())
    const key = params.get('key')
    params.delete('key')
    const query = params.toString()
    const url = `/api/proxy/api/PortalSession/org/${encodeURIComponent(orgId)}/action/AddPortalSession/${encodeURIComponent(tenantId)}${query ? `?${query}` : ''}`

    fetch(url, {
      method: 'GET',
      credentials: 'omit',
      headers: key ? { Authorization: `Basic ${btoa(`portal-page:${key}`)}` } : {},
    })
      .then(async res => {
        const data = await res.json().catch(() => null)
        const session = data?.portalSession
        if (session?.status === 'Authorized' || session?.status === 'Pending') {
          setPortalPage(data?.portalPage ?? null)
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
              WiFi Portal
            </div>
            <h1 className="text-lg font-bold text-white break-all">
              {orgId.split(/(hubs)/i).map((part, i) =>
                part.toLowerCase() === 'hubs' ? <span key={i} className="text-blue-400">{part}</span> : part
              )}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Sign in to continue to the internet</p>
          </div>

          <div className="px-8 pb-8 pt-6">
            {loading ? (
              <div className="flex flex-col items-center py-8 text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin mb-3 text-blue-400" />
                <p className="text-sm">Connecting...</p>
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
                      {showErrorDetail ? 'Hide details' : 'Show details'}
                    </button>
                    {showErrorDetail && (
                      <pre className="mt-2 w-full max-h-40 overflow-auto text-left text-[10px] leading-relaxed text-slate-400 bg-slate-900/80 border border-slate-700/60 rounded-lg p-3 whitespace-pre-wrap break-all">
                        {errorDetail}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Username</label>
                  <input type="text" placeholder="Enter your username" disabled className="w-full px-3 py-2.5 text-sm border border-slate-700 rounded-lg bg-slate-900/60 text-slate-500 placeholder-slate-600 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" disabled className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-700 rounded-lg bg-slate-900/60 text-slate-500 placeholder-slate-600 cursor-not-allowed" />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled className="w-full py-3 text-sm font-semibold text-slate-400 bg-slate-700/60 rounded-xl cursor-not-allowed">
                  Sign In
                </button>
                <p className="text-xs text-slate-500 text-center">Login is coming soon for this portal{portalPage?.code ? ` (${portalPage.code})` : ''}.</p>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Powered by <span className="text-slate-300 font-semibold">Dev<span className="text-blue-400"> Hub</span></span>
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
