import { prisma } from '@klickkk/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'
import { TenantStatusActions } from '@/components/tenant-status-actions'
import { ArrowLeft } from 'lucide-react'

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      users: { select: { id: true, email: true, name: true, createdAt: true, isSuperAdmin: true }, take: 20 },
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        include: { extraSlots: true },
      },
      invoices: { orderBy: { issuedAt: 'desc' }, take: 10 },
      _count: { select: { employees: true } },
    },
  })

  if (!tenant) notFound()

  const activeSub = tenant.subscriptions.find((s) =>
    ['ACTIVE', 'TRIALING'].includes(s.status)
  )

  const activeEmployees = await prisma.employee.count({
    where: { tenantId: tenant.id, status: 'ACTIVE' },
  })

  const totalExtraSlots = activeSub?.extraSlots.reduce((s, e) => s + e.slotsPurchased, 0) ?? 0
  const totalRevenue = tenant.invoices.reduce((s, i) => s + i.total, 0)

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/tenants" className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{tenant.name}</h1>
          <p className="text-slate-400 text-sm font-mono">{tenant.slug}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className={`text-sm px-3 py-1.5 rounded-lg font-medium ${
            tenant.status === 'ACTIVE' ? 'bg-green-900 text-green-300' :
            tenant.status === 'SUSPENDED' ? 'bg-orange-900 text-orange-300' :
            'bg-red-900 text-red-300'
          }`}>
            {tenant.status}
          </span>
          <TenantStatusActions tenantId={tenant.id} currentStatus={tenant.status} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Plan', value: tenant.plan },
          { label: 'Active Employees', value: activeEmployees },
          { label: 'Plan Limit', value: tenant.planEmployeeLimit },
          { label: 'Extra Slots (cycle)', value: totalExtraSlots },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide">{s.label}</div>
            <div className="text-xl font-bold text-slate-100 mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Company info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Company Details</h2>
          <Row label="GSTIN" value={tenant.gstin ?? '—'} />
          <Row label="Address" value={[tenant.address, tenant.city, tenant.state, tenant.pincode].filter(Boolean).join(', ') || '—'} />
          <Row label="GST Supply Type" value={tenant.supplyType.replace('_', '-')} />
          <Row label="Onboarding" value={tenant.onboardingStatus} />
          <Row label="Created" value={formatDate(tenant.createdAt)} />
        </div>

        {/* Subscription */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Active Subscription</h2>
          {activeSub ? (
            <>
              <Row label="Plan" value={activeSub.plan} />
              <Row label="Status" value={activeSub.status} />
              <Row label="Amount" value={formatCurrency(activeSub.amount)} />
              <Row label="Cycle" value={`${formatDate(activeSub.billingCycleStart)} → ${formatDate(activeSub.billingCycleEnd)}`} />
              {activeSub.trialEndsAt && (
                <Row label="Trial ends" value={formatDate(activeSub.trialEndsAt)} />
              )}
              <Row label="Extra Slots" value={`${totalExtraSlots} slots`} />
            </>
          ) : (
            <p className="text-slate-500 text-sm">No active subscription</p>
          )}
        </div>
      </div>

      {/* Users */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h2 className="font-semibold">Users ({tenant.users.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950">
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Email</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {tenant.users.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-3 text-slate-300">{u.email}</td>
                <td className="px-5 py-3 text-slate-400">{u.name ?? '—'}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoices */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h2 className="font-semibold">Invoices</h2>
        </div>
        {tenant.invoices.length === 0 ? (
          <div className="p-6 text-slate-500 text-sm">No invoices yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Invoice #</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Taxable</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">GST</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tenant.invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-5 py-3 font-mono text-xs text-slate-400">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{formatDate(inv.issuedAt)}</td>
                  <td className="px-5 py-3 text-slate-300">{formatCurrency(inv.taxableValue)}</td>
                  <td className="px-5 py-3 text-slate-300">{formatCurrency(inv.cgst + inv.sgst + inv.igst)}</td>
                  <td className="px-5 py-3 font-semibold text-slate-100">{formatCurrency(inv.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-slate-500 w-36 flex-shrink-0">{label}</span>
      <span className="text-slate-200">{value}</span>
    </div>
  )
}
