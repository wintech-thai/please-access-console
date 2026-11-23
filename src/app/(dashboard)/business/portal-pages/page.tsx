'use client'

import { useTenant } from '@/context/TenantContext'
import TenantPortalPagesTable from '@/components/TenantPortalPagesTable'

export default function TenantPortalPagesPage() {
  const { selectedOrg } = useTenant()
  const orgId = selectedOrg?.orgCustomId || selectedOrg?.orgId || ''
  if (!orgId) return null
  return <TenantPortalPagesTable key={orgId} orgId={orgId} />
}
