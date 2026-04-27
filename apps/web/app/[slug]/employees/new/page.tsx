import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { NewEmployeeForm } from '@/components/employees/new-employee-form'
import { getTenantCapacity } from '@/lib/capacity'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export const metadata = { title: 'Add Employee' }

export default async function NewEmployeePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const [departments, designations, locations, managers, capacity] = await Promise.all([
    prisma.department.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
    prisma.designation.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
    prisma.location.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
    prisma.employee.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, employeeCode: true },
      orderBy: { firstName: 'asc' },
    }),
    getTenantCapacity(tenantId),
  ])

  // Count existing employees for code generation
  const empCount = await prisma.employee.count({ where: { tenantId } })

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add Employee</h1>
        <p className="text-slate-500 text-sm mt-0.5">Fill in the details to onboard a new employee</p>
      </div>

      {!capacity.canActivate && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-900 text-sm">No available slots</div>
            <p className="text-red-700 text-sm mt-0.5">
              This is a prepaid subscription. Please{' '}
              <Link href={`/${slug}/billing`} className="underline font-medium">purchase additional employee slots</Link>{' '}
              before activating more employees.
            </p>
          </div>
        </div>
      )}

      <NewEmployeeForm
        departments={departments}
        designations={designations}
        locations={locations}
        managers={managers}
        nextCode={`EMP-${String(empCount + 1).padStart(4, '0')}`}
        canActivate={capacity.canActivate}
      />
    </div>
  )
}
