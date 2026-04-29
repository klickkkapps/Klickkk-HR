'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Megaphone, Pencil, Trash2, Eye, EyeOff, Loader2, X, Check } from 'lucide-react'
import type { Announcement } from '@klickkk/db'
import { formatDate } from '@/lib/utils'

export function AnnouncementsClient({ announcements: initial }: { announcements: Announcement[] }) {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  function openNew() {
    setEditing(null)
    setTitle('')
    setBody('')
    setShowForm(true)
  }

  function openEdit(ann: Announcement) {
    setEditing(ann)
    setTitle(ann.title)
    setBody(ann.body)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setTitle('')
    setBody('')
  }

  async function save() {
    if (!title.trim() || !body.trim()) { toast.error('Title and body are required'); return }
    setSaving(true)

    if (editing) {
      const res = await fetch(`/api/announcements/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      })
      setSaving(false)
      if (res.ok) {
        setAnnouncements((prev) => prev.map((a) => a.id === editing.id ? { ...a, title, body } : a))
        toast.success('Announcement updated')
        closeForm()
      } else {
        toast.error('Failed to update')
      }
    } else {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      })
      setSaving(false)
      if (res.ok) {
        const ann = await res.json()
        setAnnouncements((prev) => [ann, ...prev])
        toast.success('Announcement posted')
        closeForm()
      } else {
        toast.error('Failed to post')
      }
    }
  }

  async function toggleActive(ann: Announcement) {
    const res = await fetch(`/api/announcements/${ann.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !ann.isActive }),
    })
    if (res.ok) {
      setAnnouncements((prev) => prev.map((a) => a.id === ann.id ? { ...a, isActive: !ann.isActive } : a))
    }
  }

  async function deleteAnn(id: string) {
    if (!confirm('Delete this announcement?')) return
    const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
      toast.success('Deleted')
    } else {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-600/20"
        >
          <Plus size={15} />
          New Announcement
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">{editing ? 'Edit Announcement' : 'New Announcement'}</h3>
              <button onClick={closeForm} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Office closed on 15th August"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder="Write the announcement details..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-100">
              <button onClick={closeForm} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {editing ? 'Save Changes' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {announcements.length === 0 ? (
        <div className="bg-white rounded-xl border border-border py-16 text-center">
          <Megaphone size={32} className="mx-auto mb-3 text-slate-200" />
          <p className="text-sm text-slate-400">No announcements yet. Post one to notify your team.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white rounded-xl border p-5 transition-all ${
                ann.isActive ? 'border-border' : 'border-dashed border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${ann.isActive ? 'bg-blue-50' : 'bg-slate-100'}`}>
                    <Megaphone size={14} className={ann.isActive ? 'text-blue-600' : 'text-slate-400'} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 text-sm">{ann.title}</h3>
                      {!ann.isActive && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Hidden</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1 whitespace-pre-wrap leading-relaxed">{ann.body}</p>
                    <p className="text-xs text-slate-400 mt-2">{formatDate(ann.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(ann)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    title={ann.isActive ? 'Hide' : 'Show'}
                  >
                    {ann.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => openEdit(ann)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => deleteAnn(ann.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
