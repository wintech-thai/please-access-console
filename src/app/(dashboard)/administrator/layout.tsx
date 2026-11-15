import AdminSidebar from '@/components/AdminSidebar'

export default function AdministratorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 overflow-hidden -m-4 sm:-m-6">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        {children}
      </div>
    </div>
  )
}
