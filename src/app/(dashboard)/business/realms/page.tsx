'use client'

import { useTenant } from '@/context/TenantContext'
import RealmsTable from '@/components/RealmsTable'

export default function TenantRealmsPage() {
  const { selectedOrg } = useTenant()
  const orgId = selectedOrg?.orgCustomId || selectedOrg?.orgId || ''
  if (!orgId) return null
  return <RealmsTable key={orgId} orgId={orgId} />
}
