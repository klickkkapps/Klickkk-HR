'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Briefcase, Users, ChevronDown, ChevronUp, Plus, X } from 'lucide-react'

const JOB_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700',
  ON_HOLD: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-slate-100 text-slate-600',
}

const APP_STATUS_COLORS: Record<string, string> = {
  APPLIED: 'bg-slate-100 text-slate-600',
  SCREENING: 'bg-blue-100 text-blue-700',
  INTERVIEW: 'bg-purple-100 text-purple-700',
  OFFER: 'bg-amber-100 text-amber-700',
  HIRED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}

const APP_STAGES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'] as const

interface Application {
  id: string
  candidateName: string
  email: string
  phone: string | null
  status: string
  appliedAt: string
  notes: string | null
}

interface Job {
  id: string
  title: string
  department: string | null
  location: string | null
  employmentType: string
  openings: number
  status: string
  closingDate: string | null
  createdAt: string
  applications: Application[]
}

interface Props {
  data: {
    jobs: Job[]
    departments: { id: string; name: string }[]
    locations: { id: string; name: string }[]
  }
}

export default function RecruitmentClient({ data }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [showNewJobForm, setShowNewJobForm] = useState(false)
  const [addingApplicantTo, setAddingApplicantTo] = useState<string | null>(null)

  const [jobForm, setJobForm] = useState({
    title: '',
    departmentId: '',
    locationId: '',
    employmentType: 'FULL_TIME',
    description: '',
    requirements: '',
    openings: '1',
    closingDate: '',
  })
  const [appForm, setAppForm] = useState({ candidateName: '', email: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)

  async function handleCreateJob(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/recruitment/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      toast.success('Job posting created')
      setJobForm({ title: '', departmentId: '', locationId: '', employmentType: 'FULL_TIME', description: '', requirements: '', openings: '1', closingDate: '' })
      setShowNewJobForm(false)
      startTransition(() => router.refresh())
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddApplicant(e: React.FormEvent) {
    e.preventDefault()
    if (!addingApplicantTo) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/recruitment/jobs/${addingApplicantTo}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      toast.success('Applicant added')
      setAppForm({ candidateName: '', email: '', phone: '' })
      setAddingApplicantTo(null)
      startTransition(() => router.refresh())
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateAppStatus(appId: string, status: string) {
    try {
      const res = await fetch(`/api/recruitment/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Status updated')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function toggleJobStatus(job: Job) {
    const newStatus = job.status === 'OPEN' ? 'CLOSED' : 'OPEN'
    try {
      const res = await fetch(`/api/recruitment/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(`Job ${newStatus === 'OPEN' ? 'reopened' : 'closed'}`)
      startTransition(() => router.refresh())
    } catch {
      toast.error('Failed to update job')
    }
  }

  const openJobs = data.jobs.filter((j) => j.status === 'OPEN')
  const closedJobs = data.jobs.filter((j) => j.status !== 'OPEN')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recruitment</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage job postings and track candidates</p>
        </div>
        <button
          onClick={() => setShowNewJobForm(!showNewJobForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} />
          New Job Posting
        </button>
      </div>

      {showNewJobForm && (
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">New Job Posting</h2>
            <button onClick={() => setShowNewJobForm(false)}><X size={16} className="text-slate-400" /></button>
          </div>
          <form onSubmit={handleCreateJob} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
              <input
                type="text"
                value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Senior Software Engineer"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <select
                value={jobForm.departmentId}
                onChange={(e) => setJobForm({ ...jobForm, departmentId: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select department</option>
                {data.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
              <select
                value={jobForm.employmentType}
                onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN'].map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">No. of Openings</label>
              <input
                type="number"
                min="1"
                value={jobForm.openings}
                onChange={(e) => setJobForm({ ...jobForm, openings: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Closing Date <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                type="date"
                value={jobForm.closingDate}
                onChange={(e) => setJobForm({ ...jobForm, closingDate: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Description</label>
              <textarea
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                rows={3}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe the role and responsibilities…"
              />
            </div>

            <div className="col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowNewJobForm(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-border rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Creating…' : 'Create Posting'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-slate-900">{openJobs.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Open Positions</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-600">
            {data.jobs.reduce((s, j) => s + j.applications.filter((a) => !['HIRED', 'REJECTED'].includes(a.status)).length, 0)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Active Candidates</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-green-600">
            {data.jobs.reduce((s, j) => s + j.applications.filter((a) => a.status === 'HIRED').length, 0)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Hired</p>
        </div>
      </div>

      {data.jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <Briefcase size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 text-sm">No job postings yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...openJobs, ...closedJobs].map((job) => (
            <div key={job.id} className="bg-white rounded-xl border border-border overflow-hidden">
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50"
                onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-900">{job.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${JOB_STATUS_COLORS[job.status]}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    {job.department && <span>{job.department}</span>}
                    {job.department && job.location && <span>·</span>}
                    {job.location && <span>{job.location}</span>}
                    <span>·</span>
                    <span>{job.employmentType.replace('_', ' ')}</span>
                    <span>·</span>
                    <span>{job.openings} opening{job.openings !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Users size={14} />
                    {job.applications.length}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleJobStatus(job) }}
                    className="text-xs px-2.5 py-1 border border-border rounded-lg text-slate-600 hover:bg-slate-50"
                  >
                    {job.status === 'OPEN' ? 'Close' : 'Reopen'}
                  </button>
                  {expandedJob === job.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
              </div>

              {expandedJob === job.id && (
                <div className="border-t border-border p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900 text-sm">Candidates ({job.applications.length})</h4>
                    <button
                      onClick={() => setAddingApplicantTo(addingApplicantTo === job.id ? null : job.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                    >
                      <Plus size={13} /> Add Candidate
                    </button>
                  </div>

                  {addingApplicantTo === job.id && (
                    <form onSubmit={handleAddApplicant} className="bg-slate-50 rounded-lg p-4 grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={appForm.candidateName}
                          onChange={(e) => setAppForm({ ...appForm, candidateName: e.target.value })}
                          className="w-full border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={appForm.email}
                          onChange={(e) => setAppForm({ ...appForm, email: e.target.value })}
                          className="w-full border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                        <input
                          type="text"
                          value={appForm.phone}
                          onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })}
                          className="w-full border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-3 flex justify-end gap-2">
                        <button type="button" onClick={() => setAddingApplicantTo(null)} className="text-xs text-slate-500 hover:underline">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
                          {submitting ? 'Adding…' : 'Add'}
                        </button>
                      </div>
                    </form>
                  )}

                  {job.applications.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No candidates yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 font-medium text-slate-500 text-xs">Candidate</th>
                          <th className="text-left py-2 font-medium text-slate-500 text-xs">Contact</th>
                          <th className="text-left py-2 font-medium text-slate-500 text-xs">Applied</th>
                          <th className="text-left py-2 font-medium text-slate-500 text-xs">Stage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {job.applications.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50">
                            <td className="py-2.5 font-medium text-slate-900">{app.candidateName}</td>
                            <td className="py-2.5 text-slate-500 text-xs">{app.email}{app.phone && ` · ${app.phone}`}</td>
                            <td className="py-2.5 text-slate-500 text-xs">{app.appliedAt}</td>
                            <td className="py-2.5">
                              <select
                                value={app.status}
                                onChange={(e) => updateAppStatus(app.id, e.target.value)}
                                className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 ${APP_STATUS_COLORS[app.status] ?? ''}`}
                              >
                                {APP_STAGES.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
