import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { hasPermission } from '@/lib/utils'
import LearningClient from './learning-client'

export default async function LearningPage() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const canManage = hasPermission(session.user.permissions, 'learning', 'manage')

  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true, firstName: true, lastName: true },
  })

  const courses = await prisma.course.findMany({
    where: { tenantId, status: 'PUBLISHED' },
    include: {
      enrollments: employee
        ? { where: { employeeId: employee.id }, select: { progress: true, completedAt: true, enrolledAt: true } }
        : { select: { progress: true, completedAt: true, enrolledAt: true }, take: 0 },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <LearningClient
      data={{
        employee: employee ? { id: employee.id, name: `${employee.firstName} ${employee.lastName}` } : null,
        canManage,
        courses: courses.map((c) => {
          const enrollment = c.enrollments[0] ?? null
          return {
            id: c.id,
            title: c.title,
            description: c.description,
            category: c.category,
            durationHrs: c.durationHrs,
            contentUrl: c.contentUrl,
            enrollmentCount: c._count.enrollments,
            enrollment: enrollment
              ? {
                  progress: enrollment.progress,
                  completedAt: enrollment.completedAt?.toISOString() ?? null,
                }
              : null,
          }
        }),
      }}
    />
  )
}
