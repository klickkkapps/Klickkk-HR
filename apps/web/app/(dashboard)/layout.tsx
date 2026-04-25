import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { redirect } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth()

  if (!session.user.tenantId) {
    redirect('/onboarding')
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { name: true, logoUrl: true, status: true },
  })

  if (!tenant || tenant.status === 'CANCELLED') {
    redirect('/login?error=tenant-suspended')
  }

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar tenantName={tenant.name} />
        <div className="flex-1 flex flex-col ml-64 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  )
}
