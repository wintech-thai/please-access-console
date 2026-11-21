import { client } from '@/lib/axios'
import type { RealmItem, GetRealmsPayload, AddRealmPayload, UpdateRealmPayload, RealmUserItem, GetRealmUsersPayload, AddRealmUserPayload, ResetRealmUserPasswordPayload } from './types'

//ใช้จากโปรแกรม Admin เท่านั้น ไม่มี OrgUser token ของ tenant เลยต้องยิง /admin-api (global) แล้วส่ง orgId จริงทาง path แทน
const BASE = '/admin-api/AdminPortalRealm/org/global/action'

export const portalRealmApi = {
  getRealms: (orgId: string, payload: GetRealmsPayload = {}) =>
    client.post<RealmItem[]>(`${BASE}/GetRealms/${orgId}`, payload),

  getRealmCount: (orgId: string, payload: GetRealmsPayload = {}) =>
    client.post<number>(`${BASE}/GetRealmCount/${orgId}`, payload),

  getRealmById: (orgId: string, realmId: string) =>
    client.get<{ status?: string; realm?: RealmItem }>(`${BASE}/GetRealmById/${orgId}/${realmId}`),

  addRealm: (orgId: string, payload: AddRealmPayload) =>
    client.post<{ status?: string; description?: string; realm?: RealmItem }>(`${BASE}/AddRealm/${orgId}`, payload),

  updateRealmById: (orgId: string, realmId: string, payload: UpdateRealmPayload) =>
    client.post<{ status?: string; description?: string; realm?: RealmItem }>(`${BASE}/UpdateRealmById/${orgId}/${realmId}`, payload),

  deleteRealmById: (orgId: string, realmId: string) =>
    client.delete(`${BASE}/DeleteRealmById/${orgId}/${realmId}`),

  // ─── Realm Users (เฉพาะ realm ที่เป็น Native) ──────────────────────────────
  getRealmUsers: (orgId: string, realmId: string, payload: GetRealmUsersPayload = {}) =>
    client.post<RealmUserItem[]>(`${BASE}/GetRealmUsers/${orgId}/${realmId}`, payload),

  getRealmUserCount: (orgId: string, realmId: string, payload: GetRealmUsersPayload = {}) =>
    client.post<number>(`${BASE}/GetRealmUserCount/${orgId}/${realmId}`, payload),

  addRealmUser: (orgId: string, realmId: string, payload: AddRealmUserPayload) =>
    client.post<{ status?: string; description?: string; realmUser?: RealmUserItem }>(`${BASE}/AddRealmUser/${orgId}/${realmId}`, payload),

  resetRealmUserPasswordById: (orgId: string, realmUserId: string, payload: ResetRealmUserPasswordPayload) =>
    client.post(`${BASE}/ResetRealmUserPasswordById/${orgId}/${realmUserId}`, payload),

  enableRealmUserById: (orgId: string, realmUserId: string) =>
    client.post(`${BASE}/EnableRealmUserById/${orgId}/${realmUserId}`, {}),

  disableRealmUserById: (orgId: string, realmUserId: string) =>
    client.post(`${BASE}/DisableRealmUserById/${orgId}/${realmUserId}`, {}),

  deleteRealmUserById: (orgId: string, realmUserId: string) =>
    client.delete(`${BASE}/DeleteRealmUserById/${orgId}/${realmUserId}`),
}
