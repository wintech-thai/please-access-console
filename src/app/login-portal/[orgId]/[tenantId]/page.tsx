import LoginPortalClient from './LoginPortalClient'

export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || ''

interface PageProps {
  params: { orgId: string; tenantId: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

//ทำเป็น Server Component ตั้งใจ ไป fetch AddPortalSession ที่ server ก่อนส่ง HTML ไปให้ browser เลย
//กัน client ต้องรอ fetch เองแล้วเห็นสีพื้นหลังกลางๆ วาบก่อนสลับไปสีของ theme จริง (default หรือ custom) - รอบแรกที่ส่งไปก็เป็นสีที่ถูกต้องอยู่แล้ว
export default async function LoginPortalPage({ params, searchParams }: PageProps) {
  const { orgId, tenantId } = params

  //key auth ผ่าน Basic auth header แทน ไม่ส่งเป็น query param แล้ว (เลี่ยงไม่ให้ key หลุดไปอยู่ใน audit log ของ session)
  const keyParam = searchParams.key
  const apiKey = typeof keyParam === 'string' ? keyParam : ''

  //ส่วน query param อื่นๆ ที่ Mikrotik ส่งมา (mac/ip/link-orig ฯลฯ) ยัง forward ต่อไปเหมือนเดิม
  const forwardParams = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams)) {
    if (k === 'key') continue
    const value = Array.isArray(v) ? v[0] : v
    if (value !== undefined) forwardParams.set(k, value)
  }
  const query = forwardParams.toString()
  const targetUrl = `${BACKEND_URL}/api/PortalSession/org/${encodeURIComponent(orgId)}/action/AddPortalSession/${encodeURIComponent(tenantId)}${query ? `?${query}` : ''}`

  let data: unknown = null
  let httpStatus = 0
  let networkError: string | null = null

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      cache: 'no-store', //สร้าง session ใหม่ทุกครั้งที่เปิดหน้า ห้าม cache/dedupe
      headers: {
        'Content-Type': 'application/json',
        'Onix-Application-Type': 'PLEASE-ACCESS',
        ...(apiKey ? { Authorization: `Basic ${Buffer.from(`portal-page:${apiKey}`).toString('base64')}` } : {}),
      },
    })
    httpStatus = res.status
    data = await res.json().catch(() => null)
  } catch (err) {
    networkError = err instanceof Error ? err.message : String(err)
  }

  //portalPage ผูก custom theme ไว้ (item 3.a.v ของ x005-theme) - ไปดึงผ่าน API ระดับ OrgUser แยกอีกรอบตามสเปค
  //ยังทำที่ server ก่อนส่ง HTML เหมือนเดิม เลยไม่เสียเรื่องเห็นสีวาบ แค่ยอมแลก TTFB ที่ช้าขึ้นนิดหน่อยจาก round-trip ที่สอง
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = (data as any)?.portalSession
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const portalPage = (data as any)?.portalPage
  if ((session?.status === 'Authorized' || session?.status === 'Pending') && portalPage?.themeId) {
    try {
      const themeUrl = `${BACKEND_URL}/api/PortalPageTheme/org/${encodeURIComponent(orgId)}/action/GetPortalPageThemeById/${portalPage.themeId}`
      const themeRes = await fetch(themeUrl, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Onix-Application-Type': 'PLEASE-ACCESS',
          ...(apiKey ? { Authorization: `Basic ${Buffer.from(`portal-page:${apiKey}`).toString('base64')}` } : {}),
        },
      })
      const themeData = await themeRes.json().catch(() => null)
      if (themeData?.portalPageTheme) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(data as any).portalPageTheme = themeData.portalPageTheme
      }
    } catch {
      //ดึง theme ไม่ได้ก็แค่ fallback ไปแสดงฟอร์ม default แทน ไม่ทำให้ทั้งหน้า error
    }
  }

  return (
    <LoginPortalClient
      orgId={orgId}
      tenantId={tenantId}
      apiKey={apiKey}
      data={data}
      httpStatus={httpStatus}
      networkError={networkError}
    />
  )
}
