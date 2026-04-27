import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { hasPermission } from '@/lib/utils'
import PerformanceClient from './performance-client'
import { format } from 'date-fns'

export default async function PerformancePage() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const canReview = hasPermission(session.user.permissions, 'performance', 'review')

  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true, firstName: true, lastName: true },
  })

  const goals = employee
    ? await prisma.goal.findMany({
        where: { tenantId, employeeId: employee.id },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const myReviews = employee
    ? await prisma.performanceReview.findMany({
        where: { tenantId, employeeId: employee.id },
        include: { reviewer: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const activeEmployees = canReview
    ? await prisma.employee.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      })
    : []

  return (
    <PerformanceClient
      data={{
        employee: employee ? { id: employee.id, name: `${employee.firstName} ${employee.lastName}` } : null,
        canReview,
        goals: goals.map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          dueDate: g.dueDate ? format(g.dueDate, 'dd MMM yyyy') : null,
          progress: g.progress,
          status: g.status,
        })),
        myReviews: myReviews.map((r) => ({
          id: r.id,
          period: r.period,
          rating: r.rating,
          feedback: r.feedback,
          reviewerName: `${r.reviewer.firstName} ${r.reviewer.lastName}`,
          reviewDate: r.reviewDate ? format(r.reviewDate, 'dd MMM yyyy') : null,
        })),
        reviewableEmployees: activeEmployees.map((e) => ({
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
          code: e.employeeCode,
          department: e.department?.name ?? null,
        })),
      }}
    />
  )
}
