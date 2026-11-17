import { client } from '@/lib/axios'
import type { PortalPageItem, GetPortalPagesPayload, AddPortalPagePayload, UpdatePortalPagePayload } from './types'
import type { ApiKeyItem } from './types'

const BASE = '/api/PortalPage/org'

export const portalPageApi = {
  getPortalPages: (orgId: string, payload: GetPortalPagesPayload = {}) =>
    client.post<PortalPageItem[]>(`${BASE}/${orgId}/action/GetPortalPages`, payload),

  getPortalPageCount: (orgId: string, payload: GetPortalPagesPayload = {}) =>
    client.post<number>(`${BASE}/${orgId}/action/GetPortalPageCount`, payload),

  getPortalPageById: (orgId: string, portalPageId: string) =>
    client.get<{ status?: string; portalPage?: PortalPageItem }>(`${BASE}/${orgId}/action/GetPortalPageById/${portalPageId}`),

  addPortalPage: (orgId: string, payload: AddPortalPagePayload) =>
    client.post<{ status?: string; description?: string; portalPage?: PortalPageItem }>(`${BASE}/${orgId}/action/AddPortalPage`, payload),

  updatePortalPageById: (orgId: string, portalPageId: string, payload: UpdatePortalPagePayload) =>
    client.post<{ status?: string; description?: string; portalPage?: PortalPageItem }>(`${BASE}/${orgId}/action/UpdatePortalPageById/${portalPageId}`, payload),

  deletePortalPageById: (orgId: string, portalPageId: string) =>
    client.delete(`${BASE}/${orgId}/action/DeletePortalPageById/${portalPageId}`),

  enablePortalPageById: (orgId: string, portalPageId: string) =>
    client.post(`${BASE}/${orgId}/action/EnablePortalPageById/${portalPageId}`, {}),

  disablePortalPageById: (orgId: string, portalPageId: string) =>
    client.post(`${BASE}/${orgId}/action/DisablePortalPageById/${portalPageId}`, {}),

  setDefaultPortalPageById: (orgId: string, portalPageId: string) =>
    client.post(`${BASE}/${orgId}/action/SetDefaultPortalPageById/${portalPageId}`, {}),

  createPortalPageApiKey: (orgId: string, portalPageId: string, keyName?: string, keyDescription?: string) =>
    client.post<{ status?: string; description?: string; apiKey?: ApiKeyItem }>(`${BASE}/${orgId}/action/CreatePortalPageApiKey/${portalPageId}`, { KeyName: keyName, KeyDescription: keyDescription }),
}
