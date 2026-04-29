import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { AssetsClient } from './assets-client'

export const metadata = { title: 'Asset Management' }

export default async function AssetsPage() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const [assets, employees] = await Promise.all([
    prisma.asset.findMany({
      where: { tenantId },
      include: {
        assignments: {
          where: { returnedAt: null },
          include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.employee.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, employeeCode: true },
      orderBy: { firstName: 'asc' },
    }),
  ])

  const serialized = assets.map((a) => ({
    ...a,
    purchaseDate:  a.purchaseDate?.toISOString()  ?? null,
    createdAt:     a.createdAt.toISOString(),
    updatedAt:     a.updatedAt.toISOString(),
    currentHolder: a.assignments[0]?.employee ?? null,
    assignmentId:  a.assignments[0]?.id ?? null,
  }))

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Asset Management</h1>
        <p className="text-slate-400 text-sm mt-0.5">Track company assets and their assignments</p>
      </div>
      <AssetsClient assets={serialized} employees={employees} />
    </div>
  )
}
