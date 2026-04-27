import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { getTenantCapacity } from '@/lib/capacity'
import { Users, UserCheck, UserX, TrendingUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const [capacity, stats, recentEmployees] = await Promise.all([
    getTenantCapacity(tenantId),
    prisma.employee.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
    }),
    prisma.employee.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { department: true, designation: true },
    }),
  ])

  const totalEmployees = stats.reduce((sum, s) => sum + s._count, 0)
  const activeCount = stats.find((s) => s.status === 'ACTIVE')?._count ?? 0
  const exitedCount = stats.find((s) => s.status === 'EXITED')?._count ?? 0
  const onNoticeCount = stats.find((s) => s.status === 'ON_NOTICE')?._count ?? 0

  const capacityPct = capacity.totalCapacity > 0
    ? Math.round((capacity.usedSlots / capacity.totalCapacity) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Welcome back, {session.user.name}</p>
      </div>

      {capacity.availableSlots <= 3 && capacity.availableSlots > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-amber-900 text-sm">Almost at capacity</div>
            <div className="text-amber-700 text-sm">
              Only {capacity.availableSlots} slot{capacity.availableSlots !== 1 ? 's' : ''} remaining.{' '}
              <Link href={`/${slug}/billing`} className="underline font-medium">Buy extra slots</Link>
            </div>
          </div>
        </div>
      )}
      {capacity.availableSlots === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-red-900 text-sm">Capacity exhausted</div>
            <div className="text-red-700 text-sm">
              You cannot activate new employees.{' '}
              <Link href={`/${slug}/billing`} className="underline font-medium">Purchase additional slots</Link> to continue.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Employees" value={totalEmployees} color="blue" />
        <StatCard icon={UserCheck} label="Active" value={activeCount} color="green" />
        <StatCard icon={TrendingUp} label="On Notice" value={onNoticeCount} color="amber" />
        <StatCard icon={UserX} label="Exited (this year)" value={exitedCount} color="red" />
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">Employee Capacity</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {capacity.usedSlots} used of {capacity.totalCapacity} total slots
            </p>
          </div>
          <Link
            href={`/${slug}/billing`}
            className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium"
          >
            Manage slots
          </Link>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${
              capacityPct >= 90 ? 'bg-red-500' : capacityPct >= 70 ? 'bg-amber-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(capacityPct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>{capacity.planLimit} included in plan</span>
          {capacity.extraSlotsPurchased > 0 && (
            <span>+{capacity.extraSlotsPurchased} extra slots</span>
          )}
          <span>{capacity.availableSlots} available</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border">
        <div className="p-5 flex justify-between items-center border-b border-border">
          <h3 className="font-semibold text-slate-900">Recent Employees</h3>
          <Link href={`/${slug}/employees`} className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-border">
          {recentEmployees.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                No employees yet.{' '}
                <Link href={`/${slug}/employees/new`} className="text-blue-600 hover:underline">
                  Add your first employee
                </Link>
              </p>
            </div>
          ) : (
            recentEmployees.map((emp) => (
              <Link
                key={emp.id}
                href={`/${slug}/employees/${emp.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 font-semibold text-sm">
                    {emp.firstName[0]}{emp.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 text-sm">{emp.firstName} {emp.lastName}</div>
                  <div className="text-xs text-slate-500">
                    {emp.designation?.name ?? '—'} · {emp.department?.name ?? '—'}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  emp.status === 'ON_NOTICE' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {emp.status.replace('_', ' ')}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: number
  color: 'blue' | 'green' | 'amber' | 'red'
}) {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}
