'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Wifi, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'

interface PortalInfo {
  code?: string | null
  theme?: string | null
}

function LoginPortalContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orgId = params.orgId as string
  const tenantId = params.tenantId as string

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [portalPage, setPortalPage] = useState<PortalInfo | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    //forward ทุก query param ที่ Mikrotik ส่งมา (mac/ip/link-orig ฯลฯ) ไม่ใช่แค่ key/code
    const query = searchParams.toString()
    const url = `/api/proxy/public-api/PublicPortal/action/AddPortalSession/${encodeURIComponent(orgId)}/${encodeURIComponent(tenantId)}${query ? `?${query}` : ''}`

    fetch(url, { method: 'GET', credentials: 'omit' })
      .then(res => res.json())
      .then(data => {
        const session = data?.portalSession
        if (session?.status === 'Authorized' || session?.status === 'Pending') {
          setPortalPage(data?.portalPage ?? null)
        } else {
          setErrorMsg(session?.statusDesc || data?.description || 'This WiFi login link is not valid.')
        }
      })
      .catch(() => setErrorMsg('Unable to connect. Please try again.'))
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
