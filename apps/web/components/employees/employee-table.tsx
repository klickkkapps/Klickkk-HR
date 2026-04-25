'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, Eye, MoreHorizontal } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Employee, Department, Designation, Location } from '@klickkk/db'

type EmployeeWithRelations = Employee & {
  department: Department | null
  designation: Designation | null
  location: Location | null
}

const STATUS_STYLES = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-slate-100 text-slate-600',
  SUSPENDED: 'bg-orange-100 text-orange-700',
  ON_NOTICE: 'bg-amber-100 text-amber-700',
  EXITED: 'bg-red-100 text-red-700',
}

export function EmployeeTable({
  employees,
  departments,
  total,
  page,
  pageSize,
}: {
  employees: EmployeeWithRelations[]
  departments: Department[]
  total: number
  page: number
  pageSize: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const totalPages = Math.ceil(total / pageSize)

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const sp = new URLSearchParams(params.toString())
      Object.entries(updates).forEach(([k, v]) => {
        if (v) sp.set(k, v)
        else sp.delete(k)
      })
      router.push(`${pathname}?${sp.toString()}`)
    },
    [params, pathname, router]
  )

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-border flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            defaultValue={params.get('q') ?? ''}
            onChange={(e) => updateParams({ q: e.target.value, page: '1' })}
            placeholder="Search by name, email, code..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          defaultValue={params.get('status') ?? ''}
          onChange={(e) => updateParams({ status: e.target.value, page: '1' })}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ON_NOTICE">On Notice</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="EXITED">Exited</option>
        </select>

        <select
          defaultValue={params.get('dept') ?? ''}
          onChange={(e) => updateParams({ dept: e.target.value, page: '1' })}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Employee</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">ID</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Department</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Designation</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Joined</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No employees found. Try adjusting your filters.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-semibold text-xs">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{emp.firstName} {emp.lastName}</div>
                        <div className="text-xs text-slate-500">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{emp.employeeCode}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.department?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.designation?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(emp.joiningDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[emp.status]}`}>
                      {emp.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 inline-flex"
                    >
                      <Eye size={15} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border flex justify-between items-center">
          <span className="text-sm text-slate-500">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
