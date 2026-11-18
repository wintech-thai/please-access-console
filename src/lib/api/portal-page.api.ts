import { client } from '@/lib/axios'
import type { PortalPageItem, GetPortalPagesPayload, AddPortalPagePayload, UpdatePortalPagePayload } from './types'
import type { ApiKeyItem } from './types'

//ใช้จากโปรแกรม Admin เท่านั้น ไม่มี OrgUser token ของ tenant เลยต้องยิง /admin-api (global) แล้วส่ง orgId จริงทาง path แทน
const BASE = '/admin-api/AdminPortalPage/org/global/action'

export const portalPageApi = {
  getPortalPages: (orgId: string, payload: GetPortalPagesPayload = {}) =>
    client.post<PortalPageItem[]>(`${BASE}/GetPortalPages/${orgId}`, payload),

  getPortalPageCount: (orgId: string, payload: GetPortalPagesPayload = {}) =>
    client.post<number>(`${BASE}/GetPortalPageCount/${orgId}`, payload),

  getPortalPageById: (orgId: string, portalPageId: string) =>
    client.get<{ status?: string; portalPage?: PortalPageItem }>(`${BASE}/GetPortalPageById/${orgId}/${portalPageId}`),

  addPortalPage: (orgId: string, payload: AddPortalPagePayload) =>
    client.post<{ status?: string; description?: string; portalPage?: PortalPageItem }>(`${BASE}/AddPortalPage/${orgId}`, payload),

  updatePortalPageById: (orgId: string, portalPageId: string, payload: UpdatePortalPagePayload) =>
    client.post<{ status?: string; description?: string; portalPage?: PortalPageItem }>(`${BASE}/UpdatePortalPageById/${orgId}/${portalPageId}`, payload),

  deletePortalPageById: (orgId: string, portalPageId: string) =>
    client.delete(`${BASE}/DeletePortalPageById/${orgId}/${portalPageId}`),

  enablePortalPageById: (orgId: string, portalPageId: string) =>
    client.post(`${BASE}/EnablePortalPageById/${orgId}/${portalPageId}`, {}),

  disablePortalPageById: (orgId: string, portalPageId: string) =>
    client.post(`${BASE}/DisablePortalPageById/${orgId}/${portalPageId}`, {}),

  setDefaultPortalPageById: (orgId: string, portalPageId: string) =>
    client.post(`${BASE}/SetDefaultPortalPageById/${orgId}/${portalPageId}`, {}),

  createPortalPageApiKey: (orgId: string, portalPageId: string, keyName?: string, keyDescription?: string) =>
    client.post<{ status?: string; description?: string; apiKey?: ApiKeyItem }>(`${BASE}/CreatePortalPageApiKey/${orgId}/${portalPageId}`, { KeyName: keyName, KeyDescription: keyDescription }),

  //คืน api key เดิมถ้ามีอยู่แล้ว สร้างใหม่เฉพาะตอนยังไม่เคยมี (ไม่ทำลิงก์เดิมพัง)
  getPortalPageApiKey: (orgId: string, portalPageId: string, keyName?: string, keyDescription?: string) =>
    client.post<{ status?: string; description?: string; apiKey?: ApiKeyItem }>(`${BASE}/GetPortalPageApiKey/${orgId}/${portalPageId}`, { KeyName: keyName, KeyDescription: keyDescription }),
}
