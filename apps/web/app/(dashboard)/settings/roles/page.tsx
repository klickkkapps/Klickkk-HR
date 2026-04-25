import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { Shield, Check } from 'lucide-react'

export const metadata = { title: 'Roles & Permissions' }

export default async function RolesPage() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const [systemRoles, tenantRoles, permissions, userRoleCounts] = await Promise.all([
    prisma.role.findMany({
      where: { isSystem: true },
      include: { rolePermissions: { include: { permission: true } }, _count: { select: { userRoles: true } } },
    }),
    prisma.role.findMany({
      where: { tenantId },
      include: { rolePermissions: { include: { permission: true } }, _count: { select: { userRoles: true } } },
    }),
    prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] }),
    prisma.userRole.groupBy({ by: ['roleId'], _count: true }),
  ])

  const allRoles = [...systemRoles, ...tenantRoles]
  const resources = [...new Set(permissions.map((p) => p.resource))].sort()

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Roles & Permissions</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage what each role can access</p>
        </div>
      </div>

      {/* Roles overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {allRoles.map((role) => {
          const permCount = role.rolePermissions.length
          const userCount = role._count.userRoles

          return (
            <div key={role.id} className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield size={15} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{role.name}</div>
                    {role.isSystem && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">System</span>
                    )}
                  </div>
                </div>
              </div>
              {role.description && (
                <p className="text-xs text-slate-500 mb-3">{role.description}</p>
              )}
              <div className="flex gap-3 text-xs text-slate-500">
                <span>{permCount} permissions</span>
                <span>·</span>
                <span>{userCount} users</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Permission matrix */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-slate-900">Permission Matrix</h3>
          <p className="text-sm text-slate-500 mt-0.5">Overview of what each role can do</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase w-40">Resource · Action</th>
                {allRoles.map((role) => (
                  <th key={role.id} className="px-4 py-3 text-xs font-medium text-slate-500 uppercase text-center">
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {resources.map((resource) => {
                const resourcePerms = permissions.filter((p) => p.resource === resource)
                return resourcePerms.map((perm, i) => (
                  <tr key={perm.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-700">
                      {i === 0 && (
                        <span className="font-medium text-slate-900 capitalize mr-1">{resource}</span>
                      )}
                      <span className="text-slate-500 text-xs">{perm.action}</span>
                    </td>
                    {allRoles.map((role) => {
                      const hasIt = role.rolePermissions.some((rp) => rp.permissionId === perm.id)
                      return (
                        <td key={role.id} className="px-4 py-2.5 text-center">
                          {hasIt ? (
                            <Check size={14} className="text-green-500 inline-block" />
                          ) : (
                            <span className="text-slate-200">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
