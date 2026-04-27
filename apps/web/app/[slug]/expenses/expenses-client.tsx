'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Receipt, CheckCircle2, XCircle, Plus } from 'lucide-react'

function formatCurrency(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    paise / 100
  )
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SUBMITTED: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
  PAID: 'bg-green-100 text-green-700',
}

interface MyClaim {
  id: string
  categoryName: string
  amount: number
  date: string
  description: string
  status: string
  createdAt: string
}

interface PendingClaim {
  id: string
  categoryName: string
  amount: number
  date: string
  description: string
  employeeName: string
  employeeCode: string
  department: string
}

interface Props {
  data: {
    employee: { id: string; name: string } | null
    categories: { id: string; name: string }[]
    canApprove: boolean
    myClaims: MyClaim[]
    pendingClaims: PendingClaim[]
  }
}

export default function ExpensesClient({ data }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'my' | 'submit' | 'approve'>('my')
  const [, startTransition] = useTransition()

  const [form, setForm] = useState({
    categoryId: data.categories[0]?.id ?? '',
    amount: '',
    date: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.categoryId || !form.amount || !form.date || !form.description) {
      return toast.error('All fields are required')
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/expenses/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      toast.success('Expense claim submitted')
      setForm({ ...form, amount: '', date: '', description: '' })
      startTransition(() => router.refresh())
      setTab('my')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReview(id: string, status: 'APPROVED' | 'REJECTED') {
    try {
      const res = await fetch(`/api/expenses/claims/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Action failed')
      toast.success(status === 'APPROVED' ? 'Claim approved' : 'Claim rejected')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Action failed')
    }
  }

  const tabs = [
    { key: 'my', label: 'My Claims' },
    { key: 'submit', label: 'Submit Claim' },
    ...(data.canApprove ? [{ key: 'approve', label: `Pending Approvals${data.pendingClaims.length > 0 ? ` (${data.pendingClaims.length})` : ''}` }] : []),
  ] as { key: 'my' | 'submit' | 'approve'; label: string }[]

  const totalApproved = data.myClaims
    .filter((c) => ['APPROVED', 'PAID'].includes(c.status))
    .reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Expense Management</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {data.employee ? `Logged in as ${data.employee.name}` : 'Submit and manage expense claims'}
        </p>
      </div>

      {data.myClaims.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Claims', value: data.myClaims.length, color: 'text-slate-900' },
            { label: 'Pending', value: data.myClaims.filter((c) => c.status === 'SUBMITTED').length, color: 'text-amber-600' },
            { label: 'Approved', value: data.myClaims.filter((c) => c.status === 'APPROVED').length, color: 'text-blue-600' },
            { label: 'Reimbursed', value: formatCurrency(totalApproved), color: 'text-green-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-border rounded-xl p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

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

      {tab === 'my' && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {data.myClaims.length === 0 ? (
            <div className="p-10 text-center">
              <Receipt size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 text-sm">No expense claims yet.</p>
              <button
                onClick={() => setTab('submit')}
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
              >
                <Plus size={14} /> Submit a claim
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.myClaims.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900 font-medium">{c.description}</td>
                    <td className="px-4 py-3 text-slate-600">{c.categoryName}</td>
                    <td className="px-4 py-3 text-slate-600">{c.date}</td>
                    <td className="px-4 py-3 text-slate-900 text-right font-medium">{formatCurrency(c.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[c.status] ?? ''}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'submit' && (
        <div className="bg-white rounded-xl border border-border p-6 max-w-lg">
          {!data.employee ? (
            <p className="text-slate-500 text-sm">Your account is not linked to an employee profile.</p>
          ) : data.categories.length === 0 ? (
            <p className="text-slate-500 text-sm">No expense categories configured. Contact HR Admin.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {data.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Describe the expense…"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit Claim'}
              </button>
            </form>
          )}
        </div>
      )}

      {tab === 'approve' && (
        <div className="space-y-3">
          {data.pendingClaims.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-10 text-center">
              <CheckCircle2 size={36} className="mx-auto mb-3 text-green-300" />
              <p className="text-slate-500 text-sm">No pending expense claims.</p>
            </div>
          ) : (
            data.pendingClaims.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-semibold text-xs">
                          {c.employeeName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-900 text-sm">{c.employeeName}</span>
                        <span className="text-slate-400 text-xs ml-1.5">#{c.employeeCode}</span>
                        {c.department !== '—' && (
                          <span className="text-slate-400 text-xs ml-1.5">· {c.department}</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">{formatCurrency(c.amount)}</span>
                      <span>·</span>
                      <span>{c.categoryName}</span>
                      <span>·</span>
                      <span>{c.date}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{c.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleReview(c.id, 'APPROVED')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 border border-green-200"
                    >
                      <CheckCircle2 size={13} /> Approve
                    </button>
                    <button
                      onClick={() => handleReview(c.id, 'REJECTED')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 border border-red-200"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
