import { client } from '@/lib/axios'
import { isAdmin } from '@/lib/web-role'
import type { PortalPageItem, GetPortalPagesPayload, AddPortalPagePayload, UpdatePortalPagePayload } from './types'
import type { ApiKeyItem } from './types'

//Admin ไม่มี OrgUser token ของ tenant เลยต้องยิง /admin-api (global) แล้วส่ง orgId จริงทาง path แทน
//Tenant มี OrgUser token ของตัวเองอยู่แล้ว ยิง /api ตรงๆ โดยไม่ต้องส่ง orgId ซ้ำในแต่ละ action
function buildPath(orgId: string, action: string, rest: string[] = []): string {
  if (isAdmin) {
    return ['/admin-api/AdminPortalPage/org/global/action', action, orgId, ...rest].join('/')
  }
  return [`/api/PortalPage/org/${orgId}/action`, action, ...rest].join('/')
}

export const portalPageApi = {
  getPortalPages: (orgId: string, payload: GetPortalPagesPayload = {}) =>
    client.post<PortalPageItem[]>(buildPath(orgId, 'GetPortalPages'), payload),

  getPortalPageCount: (orgId: string, payload: GetPortalPagesPayload = {}) =>
    client.post<number>(buildPath(orgId, 'GetPortalPageCount'), payload),

  getPortalPageById: (orgId: string, portalPageId: string) =>
    client.get<{ status?: string; portalPage?: PortalPageItem }>(buildPath(orgId, 'GetPortalPageById', [portalPageId])),

  //Admin เท่านั้น - Tenant ดูได้อย่างเดียว สร้าง/แก้/ลบไม่ได้ ตามสเปค
  addPortalPage: (orgId: string, payload: AddPortalPagePayload) =>
    client.post<{ status?: string; description?: string; portalPage?: PortalPageItem }>(buildPath(orgId, 'AddPortalPage'), payload),

  updatePortalPageById: (orgId: string, portalPageId: string, payload: UpdatePortalPagePayload) =>
    client.post<{ status?: string; description?: string; portalPage?: PortalPageItem }>(buildPath(orgId, 'UpdatePortalPageById', [portalPageId]), payload),

  deletePortalPageById: (orgId: string, portalPageId: string) =>
    client.delete(buildPath(orgId, 'DeletePortalPageById', [portalPageId])),

  enablePortalPageById: (orgId: string, portalPageId: string) =>
    client.post(buildPath(orgId, 'EnablePortalPageById', [portalPageId]), {}),

  disablePortalPageById: (orgId: string, portalPageId: string) =>
    client.post(buildPath(orgId, 'DisablePortalPageById', [portalPageId]), {}),

  setDefaultPortalPageById: (orgId: string, portalPageId: string) =>
    client.post(buildPath(orgId, 'SetDefaultPortalPageById', [portalPageId]), {}),

  createPortalPageApiKey: (orgId: string, portalPageId: string, keyName?: string, keyDescription?: string) =>
    client.post<{ status?: string; description?: string; apiKey?: ApiKeyItem }>(buildPath(orgId, 'CreatePortalPageApiKey', [portalPageId]), { KeyName: keyName, KeyDescription: keyDescription }),

  //คืน api key เดิมถ้ามีอยู่แล้ว สร้างใหม่เฉพาะตอนยังไม่เคยมี (ไม่ทำลิงก์เดิมพัง)
  getPortalPageApiKey: (orgId: string, portalPageId: string, keyName?: string, keyDescription?: string) =>
    client.post<{ status?: string; description?: string; apiKey?: ApiKeyItem }>(buildPath(orgId, 'GetPortalPageApiKey', [portalPageId]), { KeyName: keyName, KeyDescription: keyDescription }),
}
