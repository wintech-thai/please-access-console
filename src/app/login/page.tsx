'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LanguageProvider, useLang } from '@/context/LanguageContext'
import { useBrand } from '@/context/BrandContext'

function LoginForm() {
  const { t } = useLang()
  const { brandName, logoUrl } = useBrand()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) { toast.error(t.login.invalidCredentials); return }
      const data = await res.json()
      localStorage.setItem('accessToken', data.accessToken || '')
      localStorage.setItem('refreshToken', data.refreshToken || '')
      localStorage.setItem('username', data.username || username)
      localStorage.setItem('orgId', data.orgId || 'global')
      try {
        const payload = JSON.parse(atob((data.accessToken || '').split('.')[1]))
        localStorage.setItem('userId', String(payload.sub || payload.userId || payload.id || ''))
      } catch { localStorage.setItem('userId', '') }
      toast.success(t.login.success, { duration: 1500 })
      await new Promise((r) => setTimeout(r, 1000))
      router.push('/overview')
    } catch { toast.error(t.login.serverError) }
    finally { setLoading(false) }
  }

  const displayName = brandName || 'PLEASE ACCESS'

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgb(var(--color-primary-900)) 0%, rgb(var(--color-primary-800)) 40%, rgb(var(--color-primary-600)) 100%)' }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-cyan-500 rounded-full opacity-10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-blue-500 rounded-full opacity-10 blur-3xl animate-pulse" />

        <div className="relative z-10 flex items-center gap-3">
          {logoUrl
            ? <img src={logoUrl} alt={displayName} className="w-11 h-11 object-contain flex-shrink-0" />
            : <AccessLogoIcon className="w-11 h-11 flex-shrink-0" />
          }
          <div>
            <p className="text-white font-bold text-sm tracking-wide">{displayName}</p>
            <p className="text-primary-200 text-xs">WiFi Access Management</p>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">{displayName}<br />Dashboard</h1>
          <p className="text-primary-200 text-base mb-10">{t.appSubtitle}</p>
          <ul className="space-y-4">
            {[t.login.features.f1, t.login.features.f2, t.login.features.f3].map((label, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-white">
                  {i === 0 ? <WifiIcon /> : i === 1 ? <UsersGroupIcon /> : <ToggleIcon />}
                </span>
                <span className="text-primary-100 text-sm font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-primary-300 text-xs">Secure &bull; Reliable &bull; Efficient</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-200/40 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl shadow-primary-900/5 p-8 sm:p-10">
          <div className="flex lg:hidden items-center gap-2 mb-6">
            <AccessLogoIcon className="w-8 h-8" style={{ color: 'rgb(var(--color-primary-500))' }} />
            <span className="font-bold text-gray-900 text-sm">{displayName}</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">{t.login.welcome}</h2>
          <p className="text-gray-500 text-sm mb-8">{t.login.subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1.5">{t.login.username}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <UserIcon />
                </span>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t.login.usernamePlaceholder} required autoComplete="username" className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder-gray-400 transition-colors duration-200" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1.5">{t.login.password}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <LockIcon />
                </span>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.login.passwordPlaceholder} required autoComplete="current-password" className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder-gray-400 transition-colors duration-200" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors">
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <><SpinIcon />{t.login.loggingIn}</>
              ) : (
                <>{t.login.submit}<ArrowIcon /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">{t.login.footer}</p>
          <p className="text-center text-xs text-gray-400">Powered by <a href="https://dev-hubs.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Dev Hub</a></p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <LanguageProvider><LoginForm /></LanguageProvider>
}

// ─── Icons ───────────────────────────────────────────────────────────────────
function AccessLogoIcon({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" className={className} style={style}>
      <defs>
        <linearGradient id="accessGrad" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="rgb(var(--color-primary-400))" />
          <stop offset="60%" stopColor="rgb(var(--color-primary-600))" />
          <stop offset="100%" stopColor="rgb(var(--color-primary-800))" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" fill="url(#accessGrad)" />
      <path d="M38 52a22 22 0 0144 0M30 40a34 34 0 0160 0" stroke="white" strokeOpacity="0.9" strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="60" cy="74" r="7" fill="white" />
    </svg>
  )
}
function UserIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> }
function LockIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> }
function EyeIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> }
function EyeOffIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> }
function SpinIcon() { return <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> }
function ArrowIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg> }
function WifiIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M5 12.859a9.5 9.5 0 0114 0M2 9.5a13.5 13.5 0 0120 0M12 20h.01" /></svg> }
function UsersGroupIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-3.13a4 4 0 100-8 4 4 0 000 8zm8 3a4 4 0 10-5.13-5.13M3 7.13A4 4 0 018.13 2" /></svg> }
function ToggleIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8m-8 0a4 4 0 100-8H8m8 8a4 4 0 100 8H8" /></svg> }
