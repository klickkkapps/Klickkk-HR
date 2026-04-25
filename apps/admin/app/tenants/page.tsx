import { prisma } from '@klickkk/db'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Tenants' }

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string; status?: string }>
}) {
  const sp = await searchParams
  const where = {
    ...(sp.q
      ? {
          OR: [
            { name: { contains: sp.q, mode: 'insensitive' as const } },
            { slug: { contains: sp.q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(sp.plan ? { plan: sp.plan as any } : {}),
    ...(sp.status ? { status: sp.status as any } : {}),
  }

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { employees: true, users: true } },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { plan: true, status: true, amount: true, billingCycleEnd: true, trialEndsAt: true },
        },
      },
    }),
    prisma.tenant.count({ where }),
  ])

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} companies registered</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <form className="flex gap-3 flex-1">
          <input
            name="q"
            defaultValue={sp.q}
            placeholder="Search company or slug..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            name="plan"
            defaultValue={sp.plan}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All plans</option>
            <option value="STARTER">Starter</option>
            <option value="GROWTH">Growth</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
          <select
            name="status"
            defaultValue={sp.status}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950">
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Company</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Plan</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Sub Status</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Employees</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">MRR</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Tenant Status</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Created</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {tenants.map((t) => {
              const sub = t.subscriptions[0]
              return (
                <tr key={t.id} className="hover:bg-slate-800/50">
                  <td className="px-5 py-3.5">
                    <Link href={`/tenants/${t.id}`} className="font-medium text-slate-100 hover:text-blue-400">
                      {t.name}
                    </Link>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{t.slug}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      t.plan === 'ENTERPRISE' ? 'bg-purple-900 text-purple-300' :
                      t.plan === 'GROWTH' ? 'bg-blue-900 text-blue-300' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {t.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {sub ? (
                      <span className={`text-xs px-2 py-1 rounded ${
                        sub.status === 'ACTIVE' ? 'bg-green-900 text-green-300' :
                        sub.status === 'TRIALING' ? 'bg-amber-900 text-amber-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {sub.status}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-300">{t._count.employees}</td>
                  <td className="px-5 py-3.5 text-slate-300">
                    {sub?.amount ? formatCurrency(sub.amount) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded ${
                      t.status === 'ACTIVE' ? 'bg-green-900 text-green-300' :
                      t.status === 'SUSPENDED' ? 'bg-orange-900 text-orange-300' :
                      'bg-red-900 text-red-300'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{formatDate(t.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <Link href={`/tenants/${t.id}`} className="text-xs text-blue-400 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
