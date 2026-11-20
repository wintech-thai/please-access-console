'use client'

import { LanguageProvider } from '@/context/LanguageContext'
import { IsAdminProvider } from '@/context/IsAdminContext'
import { TenantProvider } from '@/context/TenantContext'
import Navbar from '@/components/Navbar'
import NavbarTenant from '@/components/NavbarTenant'

function DashboardShell({ isTenantMode, children }: { isTenantMode: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {isTenantMode ? <NavbarTenant /> : <Navbar />}
      <main className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6">{children}</main>
    </div>
  )
}

export default function DashboardLayoutClient({
  isTenantMode,
  children,
}: {
  isTenantMode: boolean
  children: React.ReactNode
}) {
  return (
    <IsAdminProvider isAdmin={!isTenantMode}>
      <LanguageProvider>
        {isTenantMode ? (
          <TenantProvider>
            <DashboardShell isTenantMode={isTenantMode}>{children}</DashboardShell>
          </TenantProvider>
        ) : (
          <DashboardShell isTenantMode={isTenantMode}>{children}</DashboardShell>
        )}
      </LanguageProvider>
    </IsAdminProvider>
  )
}
