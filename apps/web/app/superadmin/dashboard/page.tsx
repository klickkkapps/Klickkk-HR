import { prisma } from '@klickkk/db'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Building2, Users, TrendingUp } from 'lucide-react'

export const metadata = { title: 'Super Admin — Klickkk HR' }

export default async function SuperAdminDashboard() {
  const [tenantCount, activeCount, totalEmployees, recentTenants, planBreakdown] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          _count: { select: { employees: true } },
          subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      prisma.tenant.groupBy({ by: ['plan'], _count: true }),
    ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform Overview</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Tenants" value={tenantCount} />
        <StatCard icon={Building2} label="Active Tenants" value={activeCount} />
        <StatCard icon={Users} label="Active Employees" value={totalEmployees} />
        <StatCard icon={TrendingUp} label="Plans Active" value={planBreakdown.length} />
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <h2 className="font-semibold mb-4">Plan Distribution</h2>
        <div className="flex gap-6">
          {planBreakdown.map((p) => (
            <div key={p.plan} className="text-center">
              <div className="text-3xl font-bold text-blue-400">{p._count}</div>
              <div className="text-sm text-slate-400 mt-1">{p.plan}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-5 flex justify-between items-center border-b border-slate-800">
          <h2 className="font-semibold">Recent Tenants</h2>
          <Link href="/superadmin/tenants" className="text-sm text-blue-400 hover:underline">
            View all
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950">
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Company</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Slug</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Plan</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Employees</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {recentTenants.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/50">
                <td className="px-5 py-3.5">
                  <Link
                    href={`/superadmin/tenants/${t.id}`}
                    className="font-medium text-slate-100 hover:text-blue-400"
                  >
                    {t.name}
                  </Link>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{t.slug}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs px-2 py-1 rounded bg-blue-900 text-blue-300">{t.plan}</span>
                </td>
                <td className="px-5 py-3.5 text-slate-400">{t._count.employees}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      t.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-400">{formatDate(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: number
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-slate-100 mt-1">{value}</p>
        </div>
        <Icon size={22} className="text-slate-500" />
      </div>
    </div>
  )
}
