import type { PortalPageThemeVariable } from './api/types'

export interface StarterTemplate {
  html: string
  variables: PortalPageThemeVariable[]
}

const CARD_WRAP_OPEN = `<div style="min-height:100vh;width:100%;display:flex;align-items:center;justify-content:center;background:#0f172a;font-family:'Prompt',-apple-system,'Segoe UI',Roboto,sans-serif;padding:24px;box-sizing:border-box;">
  <div style="width:100%;max-width:360px;background:#1e293b;border:1px solid #334155;border-radius:16px;box-shadow:0 20px 40px rgba(0,0,0,0.35);overflow:hidden;">
    <div style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #334155;">
      \${LOGO}
      <h1 style="margin:12px 0 4px;font-size:18px;font-weight:700;color:#fff;">\${TITLE}</h1>
      <p style="margin:0;font-size:13px;color:#94a3b8;">\${SUBTITLE}</p>
    </div>`
const CARD_WRAP_CLOSE = `
  </div>
</div>`

const NATIVE_FORM = `
    <form onsubmit="$SYSTEM_CODE_GEN1" style="padding:24px 32px 32px;display:flex;flex-direction:column;gap:16px;">
      <div>
        <label style="display:block;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.03em;margin-bottom:6px;">Username</label>
        <input name="username" type="text" required autocomplete="username" style="width:100%;box-sizing:border-box;padding:10px 12px;font-size:14px;border:1px solid #475569;border-radius:8px;background:#0f172a;color:#fff;outline:none;" />
      </div>
      <div>
        <label style="display:block;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.03em;margin-bottom:6px;">Password</label>
        <input name="password" type="password" required autocomplete="current-password" style="width:100%;box-sizing:border-box;padding:10px 12px;font-size:14px;border:1px solid #475569;border-radius:8px;background:#0f172a;color:#fff;outline:none;" />
      </div>
      <button type="submit" style="width:100%;padding:12px;font-size:14px;font-weight:600;color:#fff;background:#2563eb;border:none;border-radius:10px;cursor:pointer;">\${BUTTON_LABEL}</button>
    </form>`

const GOOGLE_BUTTON = `
    <div style="padding:24px 32px 32px;">
      <button onclick="$SYSTEM_CODE_GEN2" type="button" style="width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:12px;font-size:14px;font-weight:600;color:#1f2937;background:#fff;border:1px solid #d1d5db;border-radius:10px;cursor:pointer;">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C33.9 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C33.9 6.1 29.2 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.1 0 9.8-2 13.3-5.2l-6.1-5.2C29.2 35.5 26.7 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.6l6.1 5.2C40.9 36.3 44 30.7 44 24c0-1.3-.1-2.7-.4-3.5z"/></svg>
        \${BUTTON_LABEL}
      </button>
    </div>`

const SHARED_VARIABLES: PortalPageThemeVariable[] = [
  { name: 'LOGO', value: '<div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#3b82f6,#06b6d4);display:inline-flex;align-items:center;justify-content:center;font-size:22px;">\u{1F4F6}</div>' },
  { name: 'TITLE', value: 'Hello world' },
  { name: 'SUBTITLE', value: 'Sign in to continue to the internet' },
]

export function getStarterTemplate(authType: string): StarterTemplate {
  if (authType === 'Google') {
    return {
      html: CARD_WRAP_OPEN + GOOGLE_BUTTON + CARD_WRAP_CLOSE,
      variables: [...SHARED_VARIABLES, { name: 'BUTTON_LABEL', value: 'Sign in with Google' }],
    }
  }
  return {
    html: CARD_WRAP_OPEN + NATIVE_FORM + CARD_WRAP_CLOSE,
    variables: [...SHARED_VARIABLES, { name: 'BUTTON_LABEL', value: 'Sign In' }],
  }
}
