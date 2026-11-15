'use client'

import { LanguageProvider } from '@/context/LanguageContext'
import { IsAdminProvider } from '@/context/IsAdminContext'
import Navbar from '@/components/Navbar'
import NavbarTenant from '@/components/NavbarTenant'

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
        <div className="flex flex-col min-h-screen bg-gray-50">
          {isTenantMode ? <NavbarTenant /> : <Navbar />}
          <main className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6">{children}</main>
        </div>
      </LanguageProvider>
    </IsAdminProvider>
  )
}
