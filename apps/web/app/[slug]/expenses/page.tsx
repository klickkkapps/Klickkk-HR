import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { hasPermission } from '@/lib/utils'
import ExpensesClient from './expenses-client'
import { format } from 'date-fns'

export default async function ExpensesPage() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const canApprove = hasPermission(session.user.permissions, 'expenses', 'approve')

  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true, firstName: true, lastName: true },
  })

  const categories = await prisma.expenseCategory.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  })

  const myClaims = employee
    ? await prisma.expenseClaim.findMany({
        where: { tenantId, employeeId: employee.id },
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const pendingClaims = canApprove
    ? await prisma.expenseClaim.findMany({
        where: { tenantId, status: 'SUBMITTED' },
        include: {
          category: { select: { name: true } },
          employee: {
            select: { firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      })
    : []

  return (
    <ExpensesClient
      data={{
        employee: employee ? { id: employee.id, name: `${employee.firstName} ${employee.lastName}` } : null,
        categories: categories.map((c) => ({ id: c.id, name: c.name })),
        canApprove,
        myClaims: myClaims.map((c) => ({
          id: c.id,
          categoryName: c.category.name,
          amount: c.amount,
          date: format(c.date, 'dd MMM yyyy'),
          description: c.description,
          status: c.status,
          createdAt: format(c.createdAt, 'dd MMM yyyy'),
        })),
        pendingClaims: pendingClaims.map((c) => ({
          id: c.id,
          categoryName: c.category.name,
          amount: c.amount,
          date: format(c.date, 'dd MMM yyyy'),
          description: c.description,
          employeeName: `${c.employee.firstName} ${c.employee.lastName}`,
          employeeCode: c.employee.employeeCode,
          department: c.employee.department?.name ?? '—',
        })),
      }}
    />
  )
}
