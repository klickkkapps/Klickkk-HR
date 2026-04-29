import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { AnnouncementsClient } from './announcements-client'

export const metadata = { title: 'Announcements' }

export default async function AnnouncementsPage() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const announcements = await prisma.announcement.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Announcements</h1>
        <p className="text-slate-400 text-sm mt-0.5">Company-wide notices and updates</p>
      </div>
      <AnnouncementsClient announcements={announcements} />
    </div>
  )
}
