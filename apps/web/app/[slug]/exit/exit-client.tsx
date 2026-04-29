'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plus, LogOut, X, Check, Loader2, ChevronDown, ChevronUp,
  Clock, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Employee  = { id: string; firstName: string; lastName: string; employeeCode: string }
type Clearance = { id: string; department: string; cleared: boolean; clearedAt: string | null; remarks: string | null }
type ExitReq   = {
  id: string; status: string; reason: string | null; hrNotes: string | null
  resignationDate: string; lastWorkingDay: string; createdAt: string
  employee: { id: string; firstName: string; lastName: string; employeeCode: string; department: { name: string } | null; designation: { name: string } | null }
  clearanceItems: Clearance[]
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:     'bg-amber-100 text-amber-700',
  APPROVED:    'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-violet-100 text-violet-700',
  COMPLETED:   'bg-green-100 text-green-700',
  REJECTED:    'bg-red-100 text-red-700',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:     <Clock size={13} />,
  APPROVED:    <AlertCircle size={13} />,
  IN_PROGRESS: <AlertCircle size={13} />,
  COMPLETED:   <CheckCircle2 size={13} />,
  REJECTED:    <XCircle size={13} />,
}

export function ExitClient({ exitRequests: initial, employees, defaultDepts }: {
  exitRequests: ExitReq[]
  employees: Employee[]
  defaultDepts: string[]
}) {
  const router = useRouter()
  const [requests, setRequests] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ employeeId: '', resignationDate: '', lastWorkingDay: '', reason: '' })

  async function submitExit() {
    if (!form.employeeId || !form.resignationDate || !form.lastWorkingDay) {
      toast.error('Employee, resignation date and last working day are required')
      return
    }
    setSaving(true)
    const res = await fetch('/api/exit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Exit request created')
      setShowForm(false)
      setForm({ employeeId: '', resignationDate: '', lastWorkingDay: '', reason: '' })
      router.refresh()
    } else {
      const err = await res.json()
      toast.error(err.error ?? 'Failed to create exit request')
    }
  }

  async function updateStatus(req: ExitReq, status: string) {
    const res = await fetch(`/api/exit/${req.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status } : r))
      toast.success('Status updated')
    } else {
      toast.error('Failed to update')
    }
  }

  async function toggleClearance(req: ExitReq, item: Clearance) {
    const res = await fetch(`/api/exit/${req.id}/clearance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id, cleared: !item.cleared }),
    })
    if (res.ok) {
      setRequests((prev) => prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              clearanceItems: r.clearanceItems.map((c) =>
                c.id === item.id ? { ...c, cleared: !item.cleared, clearedAt: !item.cleared ? new Date().toISOString() : null } : c
              ),
              status: r.clearanceItems.every((c) => c.id === item.id ? !item.cleared : c.cleared) ? 'IN_PROGRESS' : r.status,
            }
          : r
      ))
    }
  }

  const stats = {
    total:     requests.length,
    pending:   requests.filter((r) => r.status === 'PENDING').length,
    active:    requests.filter((r) => ['APPROVED', 'IN_PROGRESS'].includes(r.status)).length,
    completed: requests.filter((r) => r.status === 'COMPLETED').length,
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Exits',  value: stats.total,     color: 'text-slate-700' },
          { label: 'Pending',      value: stats.pending,   color: 'text-amber-700' },
          { label: 'In Progress',  value: stats.active,    color: 'text-blue-700'  },
          { label: 'Completed',    value: stats.completed, color: 'text-green-700' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-600/20"
        >
          <Plus size={15} />
          New Exit Request
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">New Exit Request</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Employee *</label>
                <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
                  <option value="">Select employee...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Resignation Date *</label>
                  <input type="date" value={form.resignationDate} onChange={(e) => setForm({ ...form, resignationDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Working Day *</label>
                  <input type="date" value={form.lastWorkingDay} onChange={(e) => setForm({ ...form, lastWorkingDay: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason (optional)</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3}
                  placeholder="Resignation reason..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none" />
              </div>
              <p className="text-xs text-slate-400">Clearance checklist ({defaultDepts.join(', ')}) will be auto-created.</p>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-100">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={submitExit} disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Create Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit requests list */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-border py-16 text-center">
          <LogOut size={32} className="mx-auto mb-3 text-slate-200" />
          <p className="text-sm text-slate-400">No exit requests. When an employee resigns, create a request here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const clearedCount = req.clearanceItems.filter((c) => c.cleared).length
            const isExpanded = expanded === req.id

            return (
              <div key={req.id} className="bg-white rounded-xl border border-border overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : req.id)}
                >
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-700 font-semibold text-xs">
                      {req.employee.firstName[0]}{req.employee.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm">
                      {req.employee.firstName} {req.employee.lastName}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {req.employee.designation?.name ?? '—'} · {req.employee.department?.name ?? '—'} · LWD: {formatDate(new Date(req.lastWorkingDay))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-500 hidden sm:block">
                      {clearedCount}/{req.clearanceItems.length} cleared
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[req.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_ICON[req.status]}
                      {req.status.replace('_', ' ')}
                    </span>
                    {isExpanded ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 space-y-4">
                    {req.reason && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Reason</p>
                        <p className="text-sm text-slate-700">{req.reason}</p>
                      </div>
                    )}

                    {/* Clearance checklist */}
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-2">Clearance Checklist</p>
                      <div className="space-y-2">
                        {req.clearanceItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <button
                              onClick={() => toggleClearance(req, item)}
                              className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all ${
                                item.cleared ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-green-400'
                              }`}
                            >
                              {item.cleared && <Check size={11} className="text-white" />}
                            </button>
                            <span className={`text-sm flex-1 ${item.cleared ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                              {item.department} clearance
                            </span>
                            {item.clearedAt && (
                              <span className="text-xs text-slate-400">{formatDate(new Date(item.clearedAt))}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap pt-1">
                      {req.status === 'PENDING' && (
                        <button onClick={() => updateStatus(req, 'APPROVED')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-medium transition-colors">
                          Approve
                        </button>
                      )}
                      {['APPROVED', 'IN_PROGRESS'].includes(req.status) && (
                        <button onClick={() => updateStatus(req, 'COMPLETED')}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium transition-colors">
                          Mark Complete & Exit Employee
                        </button>
                      )}
                      {req.status === 'PENDING' && (
                        <button onClick={() => updateStatus(req, 'REJECTED')}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs rounded-lg font-medium border border-red-200 transition-colors">
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
