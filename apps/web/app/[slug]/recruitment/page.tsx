import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { format } from 'date-fns'
import RecruitmentClient from './recruitment-client'

export default async function RecruitmentPage() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const [jobs, departments, locations] = await Promise.all([
    prisma.jobPosting.findMany({
      where: { tenantId },
      include: {
        department: { select: { name: true } },
        location: { select: { name: true } },
        applications: {
          select: { id: true, candidateName: true, email: true, phone: true, status: true, appliedAt: true, notes: true },
          orderBy: { appliedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.department.findMany({ where: { tenantId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.location.findMany({ where: { tenantId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  return (
    <RecruitmentClient
      data={{
        jobs: jobs.map((j) => ({
          id: j.id,
          title: j.title,
          department: j.department?.name ?? null,
          location: j.location?.name ?? null,
          employmentType: j.employmentType,
          openings: j.openings,
          status: j.status,
          closingDate: j.closingDate ? format(j.closingDate, 'dd MMM yyyy') : null,
          createdAt: format(j.createdAt, 'dd MMM yyyy'),
          applications: j.applications.map((a) => ({
            id: a.id,
            candidateName: a.candidateName,
            email: a.email,
            phone: a.phone,
            status: a.status,
            appliedAt: format(a.appliedAt, 'dd MMM yyyy'),
            notes: a.notes,
          })),
        })),
        departments,
        locations,
      }}
    />
  )
}
