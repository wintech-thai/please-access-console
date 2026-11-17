import { client } from '@/lib/axios'
import type { PortalSessionItem, GetPortalSessionsPayload } from './types'

//orgId "global" ต้องไปทาง AdminPortalSession (/admin-api) เพราะ /api/PortalSession resolve org จาก URL ตรงๆ ไม่รู้จัก "global"
function getBase(orgId: string) {
  if (orgId === 'global') return '/admin-api/AdminPortalSession/org/global/action'
  return `/api/PortalSession/org/${orgId}/action`
}

export const portalSessionApi = {
  getPortalSessions: (orgId: string, payload: GetPortalSessionsPayload = {}) =>
    client.post<{ status?: string; portalSessions?: PortalSessionItem[] }>(`${getBase(orgId)}/GetPortalSessions`, payload),

  getPortalSessionCount: (orgId: string, payload: GetPortalSessionsPayload = {}) =>
    client.post<number>(`${getBase(orgId)}/GetPortalSessionCount`, payload),

  getPortalSessionById: (orgId: string, portalSessionId: string) =>
    client.get<{ status?: string; portalSession?: PortalSessionItem }>(`${getBase(orgId)}/GetPortalSessionById/${portalSessionId}`),
}
