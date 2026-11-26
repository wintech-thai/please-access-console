import { client } from '@/lib/axios'
import type {
  PortalPageThemeItem,
  GetPortalPageThemesPayload,
  AddPortalPageThemePayload,
  UpdatePortalPageThemePayload,
} from './types'

//Theme เป็น global object จัดการได้จาก Admin เท่านั้น เลยยิง /admin-api ตรงๆ เสมอ ไม่ต้อง branch ตาม isAdmin เหมือน portal-page.api
const BASE = '/admin-api/AdminPortalPageTheme/org/global/action'

export const portalPageThemeApi = {
  getPortalPageThemes: (payload: GetPortalPageThemesPayload = {}) =>
    client.post<PortalPageThemeItem[]>(`${BASE}/GetPortalPageThemes`, payload),

  getPortalPageThemeCount: (payload: GetPortalPageThemesPayload = {}) =>
    client.post<number>(`${BASE}/GetPortalPageThemeCount`, payload),

  getPortalPageThemeById: (themeId: string) =>
    client.get<{ status?: string; description?: string; portalPageTheme?: PortalPageThemeItem }>(`${BASE}/GetPortalPageThemeById/${themeId}`),

  //สำหรับ dropdown เลือก custom theme ตอนตั้งค่า portal page - filter ด้วย authType+language ของ portal page นั้น
  getPortalPageThemesForSelection: (authType: string, language: string) =>
    client.get<PortalPageThemeItem[]>(`${BASE}/GetPortalPageThemesForSelection/${encodeURIComponent(authType)}/${encodeURIComponent(language)}`),

  addPortalPageTheme: (payload: AddPortalPageThemePayload) =>
    client.post<{ status?: string; description?: string; portalPageTheme?: PortalPageThemeItem }>(`${BASE}/AddPortalPageTheme`, payload),

  updatePortalPageThemeById: (themeId: string, payload: UpdatePortalPageThemePayload) =>
    client.post<{ status?: string; description?: string; portalPageTheme?: PortalPageThemeItem }>(`${BASE}/UpdatePortalPageThemeById/${themeId}`, payload),

  deletePortalPageThemeById: (themeId: string) =>
    client.delete(`${BASE}/DeletePortalPageThemeById/${themeId}`),
}
