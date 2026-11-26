export interface ThemeRenderVariable {
  name?: string | null
  value?: string | null
}

//ระบบเราเองเป็นคน inject ค่าพวกนี้ตอน render จริง (ไม่ใช่ค่าที่ user กรอก) ใช้แปะใน attribute เช่น onsubmit/onclick ใน template
export interface ThemeSystemValues {
  SYSTEM_CODE_GEN1?: string
  SYSTEM_CODE_GEN2?: string
}

//รองรับทั้ง ${NAME} และ $NAME ตามสเปค - แทน ${NAME} ก่อนเสมอ กัน $NAME ไปแทนที่ซ้อนในตัวมันเอง
function replaceToken(html: string, name: string, value: string): string {
  if (!name) return html
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let result = html.replace(new RegExp(`\\$\\{${escaped}\\}`, 'g'), value)
  result = result.replace(new RegExp(`\\$${escaped}\\b`, 'g'), value)
  return result
}

const PREVIEW_KEY_PREFIX = 'theme_preview_'

//เปิด preview ใน tab ใหม่ผ่าน localStorage (sessionStorage ไม่ชัวร์ว่า tab ใหม่จะอ่านได้เสมอ)
//กวาด key ของ preview เก่าทิ้งก่อนเขียนใหม่ กัน localStorage พอกพูนจากการกด preview ซ้ำๆ หลายรอบ
export function openThemePreview(htmlTemplate: string, variables: ThemeRenderVariable[] | null | undefined): void {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i)
    if (k?.startsWith(PREVIEW_KEY_PREFIX)) localStorage.removeItem(k)
  }

  const key = `${PREVIEW_KEY_PREFIX}${Date.now()}`
  localStorage.setItem(key, JSON.stringify({ htmlTemplate, variables: variables ?? [] }))
  window.open(`/theme-preview?key=${key}`, '_blank')
}

export function renderPortalPageThemeHtml(
  htmlTemplate: string,
  variables: ThemeRenderVariable[] | null | undefined,
  systemValues: ThemeSystemValues = {}
): string {
  let html = htmlTemplate ?? ''

  for (const v of variables ?? []) {
    if (!v.name) continue
    html = replaceToken(html, v.name, v.value ?? '')
  }

  html = replaceToken(html, 'SYSTEM_CODE_GEN1', systemValues.SYSTEM_CODE_GEN1 ?? '')
  html = replaceToken(html, 'SYSTEM_CODE_GEN2', systemValues.SYSTEM_CODE_GEN2 ?? '')

  return html
}
