import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import ReportsClient from './reports-client'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export default async function ReportsPage() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const now = new Date()

  const [
    totalEmployees,
    activeEmployees,
    employeesByDept,
    employeesByType,
    newHires,
    attrition,
    leaveStats,
    attendanceStats,
    payrollStats,
    expenseStats,
    openJobs,
    totalApplications,
    hiredCount,
  ] = await Promise.all([
    prisma.employee.count({ where: { tenantId } }),
    prisma.employee.count({ where: { tenantId, status: 'ACTIVE' } }),

    prisma.employee.groupBy({
      by: ['departmentId'],
      where: { tenantId, status: 'ACTIVE' },
      _count: true,
    }).then(async (rows) => {
      const depts = await prisma.department.findMany({ where: { tenantId }, select: { id: true, name: true } })
      return rows.map((r) => ({
        name: depts.find((d) => d.id === r.departmentId)?.name ?? 'No Department',
        count: r._count,
      })).sort((a, b) => b.count - a.count).slice(0, 8)
    }),

    prisma.employee.groupBy({
      by: ['employmentType'],
      where: { tenantId, status: 'ACTIVE' },
      _count: true,
    }),

    prisma.employee.count({
      where: {
        tenantId,
        joiningDate: { gte: startOfMonth(now), lte: endOfMonth(now) },
      },
    }),

    prisma.employee.count({
      where: {
        tenantId,
        status: { in: ['EXITED', 'ON_NOTICE'] },
        exitDate: { gte: startOfMonth(now), lte: endOfMonth(now) },
      },
    }),

    prisma.leaveRequest.groupBy({
      by: ['status'],
      where: {
        tenantId,
        startDate: { gte: new Date(`${now.getFullYear()}-01-01`) },
      },
      _count: true,
    }),

    prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: {
        tenantId,
        date: { gte: startOfMonth(subMonths(now, 1)), lte: endOfMonth(subMonths(now, 1)) },
      },
      _count: true,
    }),

    prisma.payrollRun.findFirst({
      where: { tenantId, status: 'COMPLETED' },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { _count: { select: { entries: true } } },
    }).then(async (run) => {
      if (!run) return null
      const entries = await prisma.payrollEntry.aggregate({
        where: { payrollRunId: run.id },
        _sum: { netPay: true, grossEarnings: true, totalDeductions: true },
      })
      return {
        month: run.month,
        year: run.year,
        employeeCount: run._count.entries,
        totalNetPay: entries._sum.netPay ?? 0,
        totalGross: entries._sum.grossEarnings ?? 0,
        totalDeductions: entries._sum.totalDeductions ?? 0,
      }
    }),

    prisma.expenseClaim.aggregate({
      where: { tenantId, status: { in: ['APPROVED', 'PAID'] } },
      _sum: { amount: true },
      _count: true,
    }),

    prisma.jobPosting.count({ where: { tenantId, status: 'OPEN' } }),
    prisma.jobApplication.count({ where: { tenantId } }),
    prisma.jobApplication.count({ where: { tenantId, status: 'HIRED' } }),
  ])

  const monthlyHeadcount = await Promise.all(
    Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i)).map(async (month) => {
      const count = await prisma.employee.count({
        where: {
          tenantId,
          joiningDate: { lte: endOfMonth(month) },
          OR: [{ exitDate: null }, { exitDate: { gte: startOfMonth(month) } }],
        },
      })
      return { month: format(month, 'MMM'), count }
    })
  )

  function formatCurrencyValue(paise: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
      paise / 100
    )
  }

  return (
    <ReportsClient
      data={{
        headcount: {
          total: totalEmployees,
          active: activeEmployees,
          newHiresThisMonth: newHires,
          attritionThisMonth: attrition,
          monthly: monthlyHeadcount,
          byDepartment: employeesByDept,
          byType: employeesByType.map((r) => ({ type: r.employmentType, count: r._count })),
        },
        leave: {
          totalRequests: leaveStats.reduce((s, r) => s + r._count, 0),
          approved: leaveStats.find((r) => r.status === 'APPROVED')?._count ?? 0,
          pending: leaveStats.find((r) => r.status === 'PENDING')?._count ?? 0,
          rejected: leaveStats.find((r) => r.status === 'REJECTED')?._count ?? 0,
        },
        attendance: {
          present: attendanceStats.find((r) => r.status === 'PRESENT')?._count ?? 0,
          absent: attendanceStats.find((r) => r.status === 'ABSENT')?._count ?? 0,
          late: attendanceStats.find((r) => r.status === 'LATE')?._count ?? 0,
          wfh: attendanceStats.find((r) => r.status === 'WORK_FROM_HOME')?._count ?? 0,
          month: format(subMonths(now, 1), 'MMM yyyy'),
        },
        payroll: payrollStats
          ? {
              month: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][payrollStats.month - 1]} ${payrollStats.year}`,
              employeeCount: payrollStats.employeeCount,
              totalNetPay: formatCurrencyValue(payrollStats.totalNetPay),
              totalGross: formatCurrencyValue(payrollStats.totalGross),
              totalDeductions: formatCurrencyValue(payrollStats.totalDeductions),
            }
          : null,
        expenses: {
          totalClaims: expenseStats._count,
          totalReimbursed: formatCurrencyValue(expenseStats._sum.amount ?? 0),
        },
        recruitment: {
          openJobs,
          totalApplications,
          hired: hiredCount,
          conversionRate: totalApplications > 0 ? ((hiredCount / totalApplications) * 100).toFixed(1) : '0',
        },
      }}
    />
  )
}
