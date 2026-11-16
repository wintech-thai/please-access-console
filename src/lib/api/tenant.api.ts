import { client } from '@/lib/axios'
import type { TenantItem, GetTenantsPayload, AddTenantPayload, UpdateTenantPayload, MVOrganization, OrgUserItem, InviteOrgUserPayload } from './types'

const ORG_BASE = '/admin-api/AdminOrganization/org/global/action'
const ORG_TYPE = 'PLEASE-ACCESS'

export const tenantApi = {
  getTenants: (payload: GetTenantsPayload = {}) =>
    client.post<TenantItem[]>(`${ORG_BASE}/GetOrganizations`, { ...payload, OrgType: ORG_TYPE }),

  getTenantCount: (payload: GetTenantsPayload = {}) =>
    client.post<number>(`${ORG_BASE}/GetOrganizationCount`, { ...payload, OrgType: ORG_TYPE }),

  getTenantById: (orgCustomId: string) =>
    client.get<TenantItem>(`${ORG_BASE}/GetOrganizationById/${orgCustomId}`),

  updateTenantById: (orgCustomId: string, payload: UpdateTenantPayload) =>
    client.post<MVOrganization>(`${ORG_BASE}/UpdateOrganizationById/${orgCustomId}`, payload),

  enableTenantById: (orgCustomId: string) =>
    client.post<MVOrganization>(`${ORG_BASE}/EnableOrganizationById/${orgCustomId}`, {}),

  disableTenantById: (orgCustomId: string) =>
    client.post<MVOrganization>(`${ORG_BASE}/DisableOrganizationById/${orgCustomId}`, {}),

  addTenant: (payload: AddTenantPayload) =>
    client.post<MVOrganization>(`${ORG_BASE}/AddOrganization`, { ...payload, OrgType: ORG_TYPE }),

  getOrgUsers: (orgCustomId: string) =>
    client.get<{ users: OrgUserItem[] }>(`${ORG_BASE}/GetOrgUsers/${orgCustomId}`),

  inviteOrgUser: (orgCustomId: string, payload: InviteOrgUserPayload) =>
    client.post(`${ORG_BASE}/InviteOrganizationUser/${orgCustomId}`, payload),

  enableOrgUser: (orgCustomId: string, orgUserId: string) =>
    client.post(`${ORG_BASE}/EnableOrgUserById/${orgCustomId}/${orgUserId}`, null),

  disableOrgUser: (orgCustomId: string, orgUserId: string) =>
    client.post(`${ORG_BASE}/DisableOrgUserById/${orgCustomId}/${orgUserId}`, null),

  deleteOrgUser: (orgCustomId: string, orgUserId: string) =>
    client.delete(`${ORG_BASE}/DeleteOrgUserById/${orgCustomId}/${orgUserId}`),

  getOrgUserForgotPasswordLink: (orgCustomId: string, orgUserId: string) =>
    client.get<{ forgotPasswordUrl?: string }>(`${ORG_BASE}/GetOrgUserForgotPasswordLink/${orgCustomId}/${orgUserId}`),

  getOrgUserInviteLink: (orgCustomId: string, orgUserId: string) =>
    client.get<{ registrationUrl?: string }>(`${ORG_BASE}/GetOrgUserInviteLink/${orgCustomId}/${orgUserId}`),
}
