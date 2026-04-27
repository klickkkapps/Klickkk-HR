import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { getTenantCapacity } from '@/lib/capacity'
import { PLAN_PRICES } from '@/lib/razorpay'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BuyExtraSlotsButton } from '@/components/billing/buy-extra-slots-button'
import { UpgradePlanButton } from '@/components/billing/upgrade-plan-button'
import { Users, CheckCircle, Clock, AlertTriangle, Receipt } from 'lucide-react'

export const metadata = { title: 'Billing & Slots' }

export default async function BillingPage() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const now = new Date()

  const [tenant, subscription, capacity, invoices] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    prisma.subscription.findFirst({
      where: { tenantId, billingCycleStart: { lte: now }, billingCycleEnd: { gte: now } },
      include: { extraSlots: true },
    }),
    getTenantCapacity(tenantId),
    prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { issuedAt: 'desc' },
      take: 10,
    }),
  ])

  const planConfig = PLAN_PRICES[tenant.plan as keyof typeof PLAN_PRICES]
  const capacityPct = capacity.totalCapacity > 0
    ? Math.round((capacity.usedSlots / capacity.totalCapacity) * 100)
    : 0

  const isTrialing = subscription?.status === 'TRIALING'
  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing & Slots</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your subscription and employee capacity</p>
      </div>

      {isTrialing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Clock size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-blue-900 text-sm">
              Free trial — {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
            </div>
            <div className="text-blue-700 text-sm">
              Add a payment method before your trial ends to continue without interruption.
            </div>
          </div>
        </div>
      )}

      {/* Current plan */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Current Plan</div>
            <div className="text-2xl font-bold text-slate-900">{tenant.plan}</div>
            <div className="text-slate-500 text-sm mt-1">
              {formatCurrency(planConfig.amount)}/month · Up to {planConfig.employeeLimit} active employees
            </div>
            {subscription && (
              <div className="text-xs text-slate-400 mt-2">
                Billing cycle: {formatDate(subscription.billingCycleStart)} → {formatDate(subscription.billingCycleEnd)}
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-2">
              <CheckCircle size={14} className="text-green-500" />
              <span className="text-xs text-green-700 font-medium">All prices inclusive of 18% GST</span>
            </div>
          </div>
          {tenant.plan !== 'ENTERPRISE' && (
            <UpgradePlanButton currentPlan={tenant.plan} />
          )}
        </div>
      </div>

      {/* Capacity */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Employee Capacity</h2>

        <div className="grid grid-cols-4 gap-4 mb-5">
          <CapacityCard label="Included Active Employees" value={capacity.planLimit} />
          <CapacityCard label="Prepaid Extra Employee Slots" value={capacity.extraSlotsPurchased} accent />
          <CapacityCard label="Used Slots" value={capacity.usedSlots} />
          <CapacityCard
            label="Available Slots"
            value={capacity.availableSlots}
            highlight={capacity.availableSlots === 0 ? 'red' : capacity.availableSlots <= 3 ? 'amber' : 'green'}
          />
        </div>

        {/* Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>{capacity.usedSlots} used</span>
            <span>{capacity.totalCapacity} total</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                capacityPct >= 90 ? 'bg-red-500' : capacityPct >= 70 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(capacityPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Buy extra slots CTA */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="font-medium text-slate-900 text-sm">Need more capacity?</div>
            <div className="text-slate-500 text-xs mt-0.5">
              Add Prepaid Extra Employee Slots at ₹49/slot/month (GST incl.)
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Slots are pooled for the billing cycle. Freed when an employee exits.
            </div>
          </div>
          <BuyExtraSlotsButton
            subscriptionId={subscription?.id ?? ''}
            cycleEnd={subscription?.billingCycleEnd?.toISOString() ?? ''}
            cycleStart={subscription?.billingCycleStart?.toISOString()}
          />
        </div>
      </div>

      {/* Invoice history */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Receipt size={18} className="text-slate-500" />
          <h2 className="font-semibold text-slate-900">Invoice History</h2>
        </div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No invoices yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Invoice #</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Taxable Value</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">GST</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Total (GST incl.)</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => {
                const gst = inv.cgst + inv.sgst + inv.igst
                return (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-700">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3.5 text-slate-600">{formatDate(inv.issuedAt)}</td>
                    <td className="px-5 py-3.5 text-slate-600">{formatCurrency(inv.taxableValue)}</td>
                    <td className="px-5 py-3.5 text-slate-600">{formatCurrency(gst)}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{formatCurrency(inv.total)}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {inv.pdfUrl && (
                        <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function CapacityCard({
  label,
  value,
  accent,
  highlight,
}: {
  label: string
  value: number
  accent?: boolean
  highlight?: 'green' | 'amber' | 'red'
}) {
  const highlightClass = highlight
    ? { green: 'text-green-600', amber: 'text-amber-600', red: 'text-red-600' }[highlight]
    : accent
    ? 'text-blue-600'
    : 'text-slate-900'

  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <div className={`text-2xl font-bold ${highlightClass}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1 leading-snug">{label}</div>
    </div>
  )
}
