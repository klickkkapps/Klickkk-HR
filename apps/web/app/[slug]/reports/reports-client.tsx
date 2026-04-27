'use client'

import { useState } from 'react'
import { Users, CalendarDays, Clock, DollarSign, Receipt, Briefcase, TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  data: {
    headcount: {
      total: number
      active: number
      newHiresThisMonth: number
      attritionThisMonth: number
      monthly: { month: string; count: number }[]
      byDepartment: { name: string; count: number }[]
      byType: { type: string; count: number }[]
    }
    leave: {
      totalRequests: number
      approved: number
      pending: number
      rejected: number
    }
    attendance: {
      present: number
      absent: number
      late: number
      wfh: number
      month: string
    }
    payroll: {
      month: string
      employeeCount: number
      totalNetPay: string
      totalGross: string
      totalDeductions: string
    } | null
    expenses: {
      totalClaims: number
      totalReimbursed: string
    }
    recruitment: {
      openJobs: number
      totalApplications: number
      hired: number
      conversionRate: string
    }
  }
}

type ReportTab = 'overview' | 'headcount' | 'leave' | 'payroll' | 'recruitment'

export default function ReportsClient({ data }: Props) {
  const [tab, setTab] = useState<ReportTab>('overview')

  const tabs: { key: ReportTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'headcount', label: 'Headcount' },
    { key: 'leave', label: 'Leave' },
    { key: 'payroll', label: 'Payroll' },
    { key: 'recruitment', label: 'Recruitment' },
  ]

  const maxDeptCount = Math.max(...data.headcount.byDepartment.map((d) => d.count), 1)
  const maxMonthlyCount = Math.max(...data.headcount.monthly.map((m) => m.count), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="text-slate-500 text-sm mt-0.5">Organisation-wide HR metrics and insights</p>
      </div>

      <div className="border-b border-border flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Users size={20} />}
              label="Active Employees"
              value={data.headcount.active}
              sub={`${data.headcount.total} total`}
              color="blue"
            />
            <StatCard
              icon={<TrendingUp size={20} />}
              label="New Hires (Month)"
              value={data.headcount.newHiresThisMonth}
              sub="this month"
              color="green"
            />
            <StatCard
              icon={<TrendingDown size={20} />}
              label="Attrition (Month)"
              value={data.headcount.attritionThisMonth}
              sub="exits + notices"
              color="red"
            />
            <StatCard
              icon={<CalendarDays size={20} />}
              label="Leave Requests (YTD)"
              value={data.leave.totalRequests}
              sub={`${data.leave.pending} pending`}
              color="amber"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Clock size={20} />}
              label="Present Days"
              value={data.attendance.present}
              sub={data.attendance.month}
              color="green"
            />
            <StatCard
              icon={<DollarSign size={20} />}
              label="Last Payroll Net"
              value={data.payroll?.totalNetPay ?? '—'}
              sub={data.payroll?.month ?? 'No payroll run'}
              color="blue"
            />
            <StatCard
              icon={<Receipt size={20} />}
              label="Expenses Reimbursed"
              value={data.expenses.totalReimbursed}
              sub={`${data.expenses.totalClaims} claims`}
              color="purple"
            />
            <StatCard
              icon={<Briefcase size={20} />}
              label="Open Jobs"
              value={data.recruitment.openJobs}
              sub={`${data.recruitment.hired} hired overall`}
              color="amber"
            />
          </div>
        </div>
      )}

      {tab === 'headcount' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-slate-900">{data.headcount.total}</p>
              <p className="text-xs text-slate-500">Total Employees</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-green-600">{data.headcount.active}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-blue-600">{data.headcount.newHiresThisMonth}</p>
              <p className="text-xs text-slate-500">New Hires (Month)</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-red-500">{data.headcount.attritionThisMonth}</p>
              <p className="text-xs text-slate-500">Attrition (Month)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-border rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-4">Headcount Trend (6 months)</h3>
              <div className="flex items-end gap-2 h-32">
                {data.headcount.monthly.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-400">{m.count}</span>
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${(m.count / maxMonthlyCount) * 96}px`, minHeight: '4px' }}
                    />
                    <span className="text-xs text-slate-500">{m.month}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-border rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-4">By Department</h3>
              <div className="space-y-2">
                {data.headcount.byDepartment.map((dept) => (
                  <div key={dept.name} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-28 truncate flex-shrink-0">{dept.name}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(dept.count / maxDeptCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700 w-6 text-right">{dept.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4">Employment Type Breakdown</h3>
            <div className="flex items-center gap-6">
              {data.headcount.byType.map((t) => (
                <div key={t.type} className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{t.count}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.type.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'leave' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Requests (YTD)', value: data.leave.totalRequests, color: 'text-slate-900' },
              { label: 'Approved', value: data.leave.approved, color: 'text-green-600' },
              { label: 'Pending', value: data.leave.pending, color: 'text-amber-600' },
              { label: 'Rejected', value: data.leave.rejected, color: 'text-red-500' },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-border rounded-xl p-4">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4">Leave Request Status Distribution</h3>
            {data.leave.totalRequests > 0 ? (
              <div className="space-y-3">
                {[
                  { label: 'Approved', value: data.leave.approved, color: 'bg-green-500' },
                  { label: 'Pending', value: data.leave.pending, color: 'bg-amber-500' },
                  { label: 'Rejected', value: data.leave.rejected, color: 'bg-red-500' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-16">{s.label}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-3">
                      <div
                        className={`${s.color} h-3 rounded-full`}
                        style={{ width: `${(s.value / data.leave.totalRequests) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700 w-8 text-right">{s.value}</span>
                    <span className="text-xs text-slate-400 w-8">
                      {((s.value / data.leave.totalRequests) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No leave requests this year.</p>
            )}
          </div>

          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4">Attendance Summary — {data.attendance.month}</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Present', value: data.attendance.present, color: 'text-green-600' },
                { label: 'Absent', value: data.attendance.absent, color: 'text-red-500' },
                { label: 'Late', value: data.attendance.late, color: 'text-amber-600' },
                { label: 'WFH', value: data.attendance.wfh, color: 'text-blue-600' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'payroll' && (
        <div className="space-y-4">
          {!data.payroll ? (
            <div className="bg-white border border-border rounded-xl p-10 text-center">
              <DollarSign size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 text-sm">No completed payroll runs found.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500">Last completed payroll: <span className="font-medium text-slate-900">{data.payroll.month}</span></p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Employees Paid', value: data.payroll.employeeCount },
                  { label: 'Gross Earnings', value: data.payroll.totalGross },
                  { label: 'Total Deductions', value: data.payroll.totalDeductions },
                  { label: 'Net Pay', value: data.payroll.totalNetPay },
                ].map((s) => (
                  <div key={s.label} className="bg-white border border-border rounded-xl p-4">
                    <p className="text-xl font-bold text-slate-900">{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'recruitment' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Open Positions', value: data.recruitment.openJobs, color: 'text-blue-600' },
              { label: 'Total Applications', value: data.recruitment.totalApplications, color: 'text-slate-900' },
              { label: 'Hired', value: data.recruitment.hired, color: 'text-green-600' },
              { label: 'Conversion Rate', value: `${data.recruitment.conversionRate}%`, color: 'text-purple-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-border rounded-xl p-4">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4">Hiring Funnel</h3>
            {data.recruitment.totalApplications > 0 ? (
              <div className="space-y-3">
                {[
                  { label: 'Applications', value: data.recruitment.totalApplications, color: 'bg-blue-500' },
                  { label: 'Hired', value: data.recruitment.hired, color: 'bg-green-500' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-24">{s.label}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-4">
                      <div
                        className={`${s.color} h-4 rounded-full`}
                        style={{ width: `${(s.value / data.recruitment.totalApplications) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700 w-8 text-right">{s.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No applications yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple'
}) {
  const iconColors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white border border-border rounded-xl p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg flex-shrink-0 ${iconColors[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-slate-900 truncate">{value}</p>
        <p className="text-xs font-medium text-slate-700 leading-tight">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}
