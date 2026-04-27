'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { TrendingUp, Target, Plus, Star, X } from 'lucide-react'

const GOAL_STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const GOAL_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const

interface Goal {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  progress: number
  status: string
}

interface Review {
  id: string
  period: string
  rating: number | null
  feedback: string | null
  reviewerName: string
  reviewDate: string | null
}

interface Props {
  data: {
    employee: { id: string; name: string } | null
    canReview: boolean
    goals: Goal[]
    myReviews: Review[]
    reviewableEmployees: { id: string; name: string; code: string; department: string | null }[]
  }
}

export default function PerformanceClient({ data }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [tab, setTab] = useState<'goals' | 'reviews' | 'give-review'>('goals')
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [goalForm, setGoalForm] = useState({ title: '', description: '', dueDate: '' })
  const [reviewForm, setReviewForm] = useState({
    employeeId: data.reviewableEmployees[0]?.id ?? '',
    period: '',
    rating: '4',
    feedback: '',
  })

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/performance/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      toast.success('Goal created')
      setGoalForm({ title: '', description: '', dueDate: '' })
      setShowGoalForm(false)
      startTransition(() => router.refresh())
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdateGoal(id: string, updates: { progress?: number; status?: string }) {
    try {
      const res = await fetch(`/api/performance/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Failed to update goal')
    }
  }

  async function handleDeleteGoal(id: string) {
    try {
      const res = await fetch(`/api/performance/goals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Goal deleted')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Failed to delete goal')
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/performance/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      toast.success('Review submitted')
      setReviewForm({ ...reviewForm, period: '', rating: '4', feedback: '' })
      startTransition(() => router.refresh())
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  const tabs = [
    { key: 'goals', label: 'My Goals' },
    { key: 'reviews', label: 'My Reviews' },
    ...(data.canReview ? [{ key: 'give-review', label: 'Give Review' }] : []),
  ] as { key: 'goals' | 'reviews' | 'give-review'; label: string }[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Performance</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {data.employee ? `Logged in as ${data.employee.name}` : 'Track goals and performance reviews'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-slate-900">{data.goals.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Goals</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-600">
            {data.goals.filter((g) => g.status === 'IN_PROGRESS').length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">In Progress</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-green-600">
            {data.goals.filter((g) => g.status === 'COMPLETED').length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Completed</p>
        </div>
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

      {tab === 'goals' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowGoalForm(!showGoalForm)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus size={14} /> Add Goal
            </button>
          </div>

          {showGoalForm && (
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-900 text-sm">New Goal</h3>
                <button onClick={() => setShowGoalForm(false)}><X size={14} className="text-slate-400" /></button>
              </div>
              <form onSubmit={handleCreateGoal} className="space-y-3">
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Goal title"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <textarea
                    value={goalForm.description}
                    onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                    rows={2}
                    className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Description (optional)"
                  />
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Due Date (optional)</label>
                    <input
                      type="date"
                      value={goalForm.dueDate}
                      onChange={(e) => setGoalForm({ ...goalForm, dueDate: e.target.value })}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowGoalForm(false)} className="text-sm text-slate-500 px-3 py-1.5 border border-border rounded-lg hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {data.goals.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-10 text-center">
              <Target size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 text-sm">No goals set yet. Add your first goal above.</p>
            </div>
          ) : (
            data.goals.map((goal) => (
              <div key={goal.id} className="bg-white rounded-xl border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900 text-sm">{goal.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GOAL_STATUS_COLORS[goal.status]}`}>
                        {goal.status.replace('_', ' ')}
                      </span>
                    </div>
                    {goal.description && <p className="mt-0.5 text-xs text-slate-500">{goal.description}</p>}
                    {goal.dueDate && <p className="mt-0.5 text-xs text-slate-400">Due: {goal.dueDate}</p>}

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">{goal.progress}%</span>
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={goal.progress}
                        onChange={(e) => handleUpdateGoal(goal.id, { progress: Number(e.target.value) })}
                        className="flex-1 h-1 accent-blue-600"
                      />
                      <select
                        value={goal.status}
                        onChange={(e) => handleUpdateGoal(goal.id, { status: e.target.value })}
                        className="text-xs border border-border rounded-lg px-2 py-1 focus:outline-none"
                      >
                        {GOAL_STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-slate-300 hover:text-red-500 flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-y-3">
          {data.myReviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-10 text-center">
              <TrendingUp size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 text-sm">No performance reviews yet.</p>
            </div>
          ) : (
            data.myReviews.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-border p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{r.period}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Reviewed by {r.reviewerName}{r.reviewDate ? ` · ${r.reviewDate}` : ''}</p>
                  </div>
                  {r.rating && (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < r.rating! ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {r.feedback && <p className="mt-3 text-sm text-slate-600 border-t border-border pt-3">{r.feedback}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'give-review' && data.canReview && (
        <div className="bg-white rounded-xl border border-border p-6 max-w-lg">
          {data.reviewableEmployees.length === 0 ? (
            <p className="text-slate-500 text-sm">No employees to review.</p>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee</label>
                <select
                  value={reviewForm.employeeId}
                  onChange={(e) => setReviewForm({ ...reviewForm, employeeId: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {data.reviewableEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} #{e.code}{e.department ? ` · ${e.department}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Review Period</label>
                <input
                  type="text"
                  value={reviewForm.period}
                  onChange={(e) => setReviewForm({ ...reviewForm, period: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Q1 2026, Annual 2025"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: String(n) })}
                    >
                      <Star
                        size={24}
                        className={Number(reviewForm.rating) >= n ? 'fill-amber-400 text-amber-400' : 'text-slate-200 hover:text-amber-300'}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-slate-500 ml-1">{reviewForm.rating}/5</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Feedback</label>
                <textarea
                  value={reviewForm.feedback}
                  onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                  rows={4}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Share your feedback on the employee's performance…"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
