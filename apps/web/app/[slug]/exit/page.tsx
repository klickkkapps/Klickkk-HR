import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { ExitClient } from './exit-client'

export const metadata = { title: 'Exit Management' }

const DEFAULT_CLEARANCE_DEPTS = ['IT', 'Finance', 'HR', 'Admin', 'Manager']

export default async function ExitPage() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const [exitRequests, employees] = await Promise.all([
    prisma.exitRequest.findMany({
      where: { tenantId },
      include: {
        employee: {
          select: {
            id: true, firstName: true, lastName: true, employeeCode: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
        clearanceItems: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.employee.findMany({
      where: {
        tenantId,
        status: { in: ['ACTIVE', 'ON_NOTICE'] },
        exitRequest: null,
      },
      select: { id: true, firstName: true, lastName: true, employeeCode: true },
      orderBy: { firstName: 'asc' },
    }),
  ])

  const serialized = exitRequests.map((r) => ({
    ...r,
    resignationDate: r.resignationDate.toISOString(),
    lastWorkingDay:  r.lastWorkingDay.toISOString(),
    createdAt:       r.createdAt.toISOString(),
    updatedAt:       r.updatedAt.toISOString(),
    clearanceItems: r.clearanceItems.map((c) => ({
      ...c,
      clearedAt: c.clearedAt?.toISOString() ?? null,
    })),
  }))

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Exit Management</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage employee resignations and clearance workflows</p>
      </div>
      <ExitClient exitRequests={serialized} employees={employees} defaultDepts={DEFAULT_CLEARANCE_DEPTS} />
    </div>
  )
}
