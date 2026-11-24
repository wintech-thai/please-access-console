import { client } from '@/lib/axios'
import { isAdmin } from '@/lib/web-role'
import type { RealmItem, GetRealmsPayload, AddRealmPayload, UpdateRealmPayload, RealmUserItem, GetRealmUsersPayload, AddRealmUserPayload, UpdateRealmUserPayload, ResetRealmUserPasswordPayload } from './types'

//Admin ไม่มี OrgUser token ของ tenant เลยต้องยิง /admin-api (global) แล้วส่ง orgId จริงทาง path แทน
//Tenant มี OrgUser token ของตัวเองอยู่แล้ว ยิง /api ตรงๆ โดยไม่ต้องส่ง orgId ซ้ำในแต่ละ action
function buildPath(orgId: string, action: string, rest: string[] = []): string {
  if (isAdmin) {
    return ['/admin-api/AdminPortalRealm/org/global/action', action, orgId, ...rest].join('/')
  }
  return [`/api/PortalRealm/org/${orgId}/action`, action, ...rest].join('/')
}

export const portalRealmApi = {
  getRealms: (orgId: string, payload: GetRealmsPayload = {}) =>
    client.post<RealmItem[]>(buildPath(orgId, 'GetRealms'), payload),

  getRealmCount: (orgId: string, payload: GetRealmsPayload = {}) =>
    client.post<number>(buildPath(orgId, 'GetRealmCount'), payload),

  getRealmById: (orgId: string, realmId: string) =>
    client.get<{ status?: string; realm?: RealmItem }>(buildPath(orgId, 'GetRealmById', [realmId])),

  //Admin เท่านั้น - Tenant สร้าง/แก้/ลบ Realm เองไม่ได้ ตามสเปค
  addRealm: (orgId: string, payload: AddRealmPayload) =>
    client.post<{ status?: string; description?: string; realm?: RealmItem }>(buildPath(orgId, 'AddRealm'), payload),

  updateRealmById: (orgId: string, realmId: string, payload: UpdateRealmPayload) =>
    client.post<{ status?: string; description?: string; realm?: RealmItem }>(buildPath(orgId, 'UpdateRealmById', [realmId]), payload),

  deleteRealmById: (orgId: string, realmId: string) =>
    client.delete(buildPath(orgId, 'DeleteRealmById', [realmId])),

  // ─── Realm Users (เฉพาะ realm ที่เป็น Native) ──────────────────────────────
  getRealmUsers: (orgId: string, realmId: string, payload: GetRealmUsersPayload = {}) =>
    client.post<RealmUserItem[]>(buildPath(orgId, 'GetRealmUsers', [realmId]), payload),

  getRealmUserCount: (orgId: string, realmId: string, payload: GetRealmUsersPayload = {}) =>
    client.post<number>(buildPath(orgId, 'GetRealmUserCount', [realmId]), payload),

  getRealmUserById: (orgId: string, realmUserId: string) =>
    client.get<{ status?: string; realmUser?: RealmUserItem }>(buildPath(orgId, 'GetRealmUserById', [realmUserId])),

  addRealmUser: (orgId: string, realmId: string, payload: AddRealmUserPayload) =>
    client.post<{ status?: string; description?: string; realmUser?: RealmUserItem }>(buildPath(orgId, 'AddRealmUser', [realmId]), payload),

  updateRealmUserById: (orgId: string, realmUserId: string, payload: UpdateRealmUserPayload) =>
    client.post<{ status?: string; description?: string; realmUser?: RealmUserItem }>(buildPath(orgId, 'UpdateRealmUserById', [realmUserId]), payload),

  resetRealmUserPasswordById: (orgId: string, realmUserId: string, payload: ResetRealmUserPasswordPayload) =>
    client.post(buildPath(orgId, 'ResetRealmUserPasswordById', [realmUserId]), payload),

  enableRealmUserById: (orgId: string, realmUserId: string) =>
    client.post(buildPath(orgId, 'EnableRealmUserById', [realmUserId]), {}),

  disableRealmUserById: (orgId: string, realmUserId: string) =>
    client.post(buildPath(orgId, 'DisableRealmUserById', [realmUserId]), {}),

  deleteRealmUserById: (orgId: string, realmUserId: string) =>
    client.delete(buildPath(orgId, 'DeleteRealmUserById', [realmUserId])),
}
