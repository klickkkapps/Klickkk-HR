import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { CompanySettingsForm } from '@/components/settings/company-settings-form'

export const metadata = { title: 'Company Settings' }

export default async function CompanySettingsPage() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } })
  const [departments, designations, locations] = await Promise.all([
    prisma.department.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
    prisma.designation.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
    prisma.location.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Company Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your organization details and structure</p>
      </div>
      <CompanySettingsForm
        tenant={tenant}
        departments={departments}
        designations={designations}
        locations={locations}
      />
    </div>
  )
}
