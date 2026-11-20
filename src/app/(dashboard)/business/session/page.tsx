'use client'

import { useTenant } from '@/context/TenantContext'
import SessionTable from '@/components/SessionTable'

export default function TenantSessionPage() {
  const { selectedOrg } = useTenant()
  const orgId = selectedOrg?.orgCustomId || selectedOrg?.orgId || ''
  if (!orgId) return null
  return <SessionTable key={orgId} orgId={orgId} />
}
