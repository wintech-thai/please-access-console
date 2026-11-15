'use client'

import { useLang } from '@/context/LanguageContext'
import { Lang } from '@/lib/translations'
import { useBrand } from '@/context/BrandContext'

export default function NavbarClean() {
  const { lang, setLang } = useLang()
  const { logoUrl, brandName } = useBrand()

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16 shadow-lg"
        style={{ background: 'linear-gradient(135deg, rgb(var(--color-primary-800)) 0%, rgb(var(--color-primary-700)) 40%, rgb(var(--color-primary-500)) 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="h-8 w-auto object-contain flex-shrink-0" />
            ) : (
              <AccessLogoIcon className="w-8 h-8 flex-shrink-0" />
            )}
            <div>
              <p className="font-bold text-white text-sm tracking-wide leading-none">{brandName || 'PLEASE ACCESS'}</p>
              <p className="text-primary-200 text-xs leading-none mt-0.5">WiFi Access Management</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
            {(['th', 'en'] as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${lang === l ? 'bg-white/30 text-white' : 'text-primary-200 hover:text-white'}`}
              >
                {l === 'th' ? 'TH' : 'EN'}
              </button>
            ))}
          </div>
        </div>
      </nav>
      <div className="h-16 w-full shrink-0" />
    </>
  )
}

function AccessLogoIcon({ className = '' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10.5" fill="rgba(255,255,255,0.15)" />
      <path d="M8.5 10.5a5 5 0 017 0M6.5 8.3a8 8 0 0111 0M12 14a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}
