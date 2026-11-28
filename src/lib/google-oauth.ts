// Central place for the Google OAuth callback URL (x006-google-authen spec item 2.d/3.e.1.d).
// สเปคอยากให้ frontend ส่งแค่ domain แล้วให้ onix API เป็นคนต่อ path เอง (ดู
// PortalSessionService.BuildGoogleCallbackUrl) - ที่นี่จึงมีแค่ตัวดึง domain กับตัวต่อ URL
// เอาไว้โชว์ที่หน้า realm (read-only) เท่านั้น ต้องใช้ template เดียวกับฝั่ง backend เป๊ะ
export function getApiDomain(): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
  return apiBase.replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

export function buildGoogleRedirectUri(orgId: string): string {
  return `https://${getApiDomain()}/api/OAuthCallback/org/${encodeURIComponent(orgId)}/action/GoogleCallback`
}
