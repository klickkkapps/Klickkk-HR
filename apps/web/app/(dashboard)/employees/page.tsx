import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import Link from 'next/link'
import { UserPlus, Search } from 'lucide-react'
import { EmployeeTable } from '@/components/employees/employee-table'

export const metadata = { title: 'Employees' }

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; dept?: string; page?: string }>
}) {
  const sp = await searchParams
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const page = Number(sp.page ?? 1)
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const where = {
    tenantId,
    ...(sp.q
      ? {
          OR: [
            { firstName: { contains: sp.q, mode: 'insensitive' as const } },
            { lastName: { contains: sp.q, mode: 'insensitive' as const } },
            { email: { contains: sp.q, mode: 'insensitive' as const } },
            { employeeCode: { contains: sp.q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(sp.status ? { status: sp.status as any } : {}),
    ...(sp.dept ? { departmentId: sp.dept } : {}),
  }

  const [employees, total, departments] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: { department: true, designation: true, location: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.employee.count({ where }),
    prisma.department.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} employees total</p>
        </div>
        <Link
          href="/employees/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus size={16} />
          Add Employee
        </Link>
      </div>

      <EmployeeTable
        employees={employees}
        departments={departments}
        total={total}
        page={page}
        pageSize={pageSize}
      />
    </div>
  )
}
