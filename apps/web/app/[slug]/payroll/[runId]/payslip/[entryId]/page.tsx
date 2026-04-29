import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { notFound } from 'next/navigation'
import { PrintButton } from './print-button'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function fmt(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100)
}

export default async function PayslipPage({
  params,
}: {
  params: Promise<{ slug: string; runId: string; entryId: string }>
}) {
  const { slug, runId, entryId } = await params
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const entry = await prisma.payrollEntry.findFirst({
    where: { id: entryId, tenantId, payrollRunId: runId },
    include: {
      employee: {
        include: {
          department: true,
          designation: true,
          salaryStructure: true,
        },
      },
      payrollRun: true,
    },
  })

  if (!entry) notFound()

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, address: true, state: true, pincode: true, gstin: true },
  })

  const { employee, payrollRun } = entry
  const monthName = MONTH_NAMES[payrollRun.month - 1]

  const earnings = [
    { label: 'Basic Salary',       amount: entry.basic },
    { label: 'House Rent Allowance (HRA)', amount: entry.hra },
    { label: 'Special Allowance',  amount: entry.specialAllowance },
    ...(entry.otherEarnings > 0 ? [{ label: 'Other Earnings', amount: entry.otherEarnings }] : []),
  ]

  const deductions = [
    { label: 'Provident Fund (PF)', amount: entry.pf },
    { label: 'ESIC',                amount: entry.esic },
    { label: 'TDS',                 amount: entry.tds },
    ...(entry.otherDeductions > 0 ? [{ label: 'Other Deductions', amount: entry.otherDeductions }] : []),
    ...(entry.lopDays > 0 ? [{ label: `LOP (${entry.lopDays} days)`, amount: 0, note: 'already reflected in basic' }] : []),
  ]

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="max-w-3xl mx-auto py-6 px-4 print:py-0 print:px-0">

        {/* Controls — hidden on print */}
        <div className="flex items-center justify-between mb-5 print:hidden">
          <a href={`/${slug}/payroll`} className="text-sm text-blue-600 hover:underline">← Back to Payroll</a>
          <PrintButton />
        </div>

        {/* Payslip */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:rounded-none print:shadow-none print:border-0">

          {/* Header */}
          <div className="bg-blue-600 text-white px-8 py-6 print:py-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xl font-bold">{tenant?.name}</div>
                {tenant?.address && <div className="text-blue-100 text-sm mt-0.5">{tenant.address}</div>}
                {(tenant?.state || tenant?.pincode) && (
                  <div className="text-blue-100 text-sm">{[tenant.state, tenant.pincode].filter(Boolean).join(' - ')}</div>
                )}
                {tenant?.gstin && <div className="text-blue-200 text-xs mt-1">GSTIN: {tenant.gstin}</div>}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">PAYSLIP</div>
                <div className="text-blue-100 text-sm">{monthName} {payrollRun.year}</div>
              </div>
            </div>
          </div>

          {/* Employee info */}
          <div className="px-8 py-5 border-b border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoField label="Employee Name"  value={`${employee.firstName} ${employee.lastName}`} />
              <InfoField label="Employee ID"    value={employee.employeeCode} />
              <InfoField label="Department"     value={employee.department?.name ?? '—'} />
              <InfoField label="Designation"    value={employee.designation?.name ?? '—'} />
              <InfoField label="Pay Period"     value={`${monthName} ${payrollRun.year}`} />
              <InfoField label="Working Days"   value={`${entry.paidDays} / ${entry.workingDays}`} />
              {employee.panNumber && <InfoField label="PAN" value={employee.panNumber} />}
              {employee.uanNumber && <InfoField label="UAN" value={employee.uanNumber} />}
              {employee.bankName  && <InfoField label="Bank" value={`${employee.bankName} — ****${employee.bankAccountNumber?.slice(-4) ?? '****'}`} />}
            </div>
          </div>

          {/* Earnings & Deductions */}
          <div className="px-8 py-5 grid grid-cols-2 gap-6 border-b border-slate-100">
            {/* Earnings */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Earnings</h3>
              <div className="space-y-2">
                {earnings.map((e) => (
                  <div key={e.label} className="flex justify-between text-sm">
                    <span className="text-slate-600">{e.label}</span>
                    <span className="font-medium text-slate-900">{fmt(e.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-100">
                  <span className="text-slate-800">Gross Earnings</span>
                  <span className="text-slate-900">{fmt(entry.grossEarnings)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Deductions</h3>
              <div className="space-y-2">
                {deductions.map((d) => (
                  <div key={d.label} className="flex justify-between text-sm">
                    <span className="text-slate-600">{d.label}</span>
                    <span className="font-medium text-slate-900">{d.note ? <span className="text-slate-400 text-xs">{d.note}</span> : fmt(d.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-100">
                  <span className="text-slate-800">Total Deductions</span>
                  <span className="text-red-600">{fmt(entry.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="px-8 py-5 bg-slate-50 print:bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-slate-500">Net Pay (Take Home)</div>
                {entry.lopDays > 0 && (
                  <div className="text-xs text-amber-600 mt-0.5">{entry.lopDays} LOP days deducted</div>
                )}
              </div>
              <div className="text-3xl font-extrabold text-blue-600">{fmt(entry.netPay)}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              This is a computer-generated payslip and does not require a signature.
              Generated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400 font-medium">{label}</div>
      <div className="text-sm text-slate-900 font-medium mt-0.5">{value}</div>
    </div>
  )
}
