import { client } from '@/lib/axios'
import type { CompanyProfile, UpdateCompanyProfilePayload } from './types'

function getOrgId() {
  return typeof window !== 'undefined' ? localStorage.getItem('orgId') || '' : ''
}

const BASE = () => `/api/Organization/org/${getOrgId()}/action`

export const organizationApi = {
  getCompanyProfile: () =>
    client.get<CompanyProfile>(`${BASE()}/GetCompanyProfile`),

  updateCompanyProfile: (payload: UpdateCompanyProfilePayload) =>
    client.post(`${BASE()}/UpdateCompanyProfile`, payload),
}
