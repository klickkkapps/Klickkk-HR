'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BookOpen, Clock, Users, CheckCircle2, Plus, X, ExternalLink } from 'lucide-react'

interface Enrollment {
  progress: number
  completedAt: string | null
}

interface Course {
  id: string
  title: string
  description: string | null
  category: string | null
  durationHrs: number | null
  contentUrl: string | null
  enrollmentCount: number
  enrollment: Enrollment | null
}

interface Props {
  data: {
    employee: { id: string; name: string } | null
    canManage: boolean
    courses: Course[]
  }
}

export default function LearningClient({ data }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [tab, setTab] = useState<'all' | 'my' | 'add'>('all')
  const [submitting, setSubmitting] = useState(false)
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    durationHrs: '',
    contentUrl: '',
  })

  const enrolledCourses = data.courses.filter((c) => c.enrollment !== null)
  const completedCourses = enrolledCourses.filter((c) => c.enrollment?.completedAt)

  async function handleEnroll(courseId: string) {
    try {
      const res = await fetch(`/api/learning/courses/${courseId}/enroll`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Enrolled successfully')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Failed to enroll')
    }
  }

  async function handleProgress(courseId: string, progress: number) {
    try {
      const res = await fetch(`/api/learning/courses/${courseId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress }),
      })
      if (!res.ok) throw new Error('Failed')
      if (progress === 100) toast.success('Course completed!')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Failed to update progress')
    }
  }

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/learning/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      toast.success('Course published')
      setCourseForm({ title: '', description: '', category: '', durationHrs: '', contentUrl: '' })
      setTab('all')
      startTransition(() => router.refresh())
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  const tabs = [
    { key: 'all', label: 'All Courses' },
    { key: 'my', label: `My Learning${enrolledCourses.length > 0 ? ` (${enrolledCourses.length})` : ''}` },
    ...(data.canManage ? [{ key: 'add', label: 'Add Course' }] : []),
  ] as { key: 'all' | 'my' | 'add'; label: string }[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Learning & Development</h1>
        <p className="text-slate-500 text-sm mt-0.5">Explore courses and track your learning progress</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-slate-900">{data.courses.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Available Courses</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-600">{enrolledCourses.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Enrolled</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-green-600">{completedCourses.length}</p>
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

      {tab === 'all' && (
        <div>
          {data.courses.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-10 text-center">
              <BookOpen size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 text-sm">No courses published yet.</p>
              {data.canManage && (
                <button onClick={() => setTab('add')} className="mt-2 text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
                  <Plus size={14} /> Add a course
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  hasEmployee={!!data.employee}
                  onEnroll={handleEnroll}
                  onProgress={handleProgress}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'my' && (
        <div>
          {enrolledCourses.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-10 text-center">
              <BookOpen size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 text-sm">You haven&apos;t enrolled in any courses yet.</p>
              <button onClick={() => setTab('all')} className="mt-2 text-sm text-blue-600 hover:underline">Browse courses</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  hasEmployee={!!data.employee}
                  onEnroll={handleEnroll}
                  onProgress={handleProgress}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'add' && data.canManage && (
        <div className="bg-white rounded-xl border border-border p-6 max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Add Course</h2>
            <button onClick={() => setTab('all')}><X size={16} className="text-slate-400" /></button>
          </div>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                type="text"
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Leadership Essentials"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={courseForm.category}
                  onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Leadership, Technical"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Duration (hours)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={courseForm.durationHrs}
                  onChange={(e) => setCourseForm({ ...courseForm, durationHrs: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2.5"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Content URL <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                type="url"
                value={courseForm.contentUrl}
                onChange={(e) => setCourseForm({ ...courseForm, contentUrl: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://…"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                rows={3}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="What will learners gain from this course?"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Publishing…' : 'Publish Course'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function CourseCard({
  course,
  hasEmployee,
  onEnroll,
  onProgress,
}: {
  course: Course
  hasEmployee: boolean
  onEnroll: (id: string) => void
  onProgress: (id: string, progress: number) => void
}) {
  const enrolled = course.enrollment !== null
  const completed = !!course.enrollment?.completedAt
  const progress = course.enrollment?.progress ?? 0

  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3">
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 text-sm leading-tight">{course.title}</h3>
          {completed && <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />}
        </div>
        {course.category && (
          <span className="inline-block mt-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            {course.category}
          </span>
        )}
        {course.description && (
          <p className="mt-2 text-xs text-slate-500 line-clamp-2">{course.description}</p>
        )}
        <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
          {course.durationHrs && (
            <span className="flex items-center gap-1"><Clock size={12} />{course.durationHrs}h</span>
          )}
          <span className="flex items-center gap-1"><Users size={12} />{course.enrollmentCount}</span>
        </div>
      </div>

      {enrolled && (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="bg-slate-100 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          {!completed && (
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={progress}
              onChange={(e) => onProgress(course.id, Number(e.target.value))}
              className="w-full mt-1 h-1 accent-blue-600"
            />
          )}
          {completed && <p className="text-xs text-green-600 mt-1 font-medium">Completed!</p>}
        </div>
      )}

      <div className="flex items-center gap-2">
        {!enrolled && hasEmployee && (
          <button
            onClick={() => onEnroll(course.id)}
            className="flex-1 text-center py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 font-medium"
          >
            Enroll
          </button>
        )}
        {course.contentUrl && (
          <a
            href={course.contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <ExternalLink size={12} /> Open
          </a>
        )}
      </div>
    </div>
  )
}
