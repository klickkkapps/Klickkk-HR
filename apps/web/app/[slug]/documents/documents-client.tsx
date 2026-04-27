'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FileText, Download, Trash2, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'

const DOC_TYPE_COLORS: Record<string, string> = {
  OFFER_LETTER: 'bg-blue-50 text-blue-700',
  CONTRACT: 'bg-purple-50 text-purple-700',
  ID_PROOF: 'bg-amber-50 text-amber-700',
  ADDRESS_PROOF: 'bg-amber-50 text-amber-700',
  EDUCATIONAL: 'bg-green-50 text-green-700',
  PAYSLIP: 'bg-slate-50 text-slate-700',
  APPRAISAL: 'bg-pink-50 text-pink-700',
  OTHER: 'bg-slate-50 text-slate-600',
}

const DOC_TYPES = [
  'OFFER_LETTER', 'CONTRACT', 'ID_PROOF', 'ADDRESS_PROOF',
  'EDUCATIONAL', 'PAYSLIP', 'APPRAISAL', 'OTHER',
]

interface Doc {
  id: string
  name: string
  type: string
  url: string
  size: number | null
  uploadedAt: string
}

interface Employee {
  id: string
  name: string
  code: string
  department: string | null
  documents: Doc[]
}

interface Props {
  data: {
    employee: { id: string; name: string } | null
    canViewAll: boolean
    canManageAll: boolean
    myDocs: Doc[]
    allEmployees: Employee[]
  }
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DocRow({ doc, onDelete }: { doc: Doc; onDelete: (id: string) => void }) {
  const color = DOC_TYPE_COLORS[doc.type] ?? DOC_TYPE_COLORS.OTHER
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-slate-400 flex-shrink-0" />
          <span className="font-medium text-slate-900 text-sm">{doc.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
          {doc.type.replace(/_/g, ' ')}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">{doc.size ? formatBytes(doc.size) : '—'}</td>
      <td className="px-4 py-3 text-xs text-slate-500">{doc.uploadedAt}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-slate-400 hover:text-blue-600 rounded"
            title="Download"
          >
            <Download size={14} />
          </a>
          <button
            onClick={() => onDelete(doc.id)}
            className="p-1 text-slate-400 hover:text-red-600 rounded"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function DocTable({ docs, onDelete }: { docs: Doc[]; onDelete: (id: string) => void }) {
  if (docs.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-6">No documents uploaded.</p>
  }
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 border-b border-border">
        <tr>
          <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs">Name</th>
          <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs">Type</th>
          <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs">Size</th>
          <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs">Uploaded</th>
          <th className="px-4 py-2" />
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {docs.map((doc) => <DocRow key={doc.id} doc={doc} onDelete={onDelete} />)}
      </tbody>
    </table>
  )
}

export default function DocumentsClient({ data }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [tab, setTab] = useState<'my' | 'all'>('my')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)
  const [uploadFor, setUploadFor] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'OTHER',
    url: '',
    size: '',
  })

  async function handleUpload(e: React.FormEvent, employeeId?: string) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...uploadForm, employeeId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      toast.success('Document uploaded')
      setUploadForm({ name: '', type: 'OTHER', url: '', size: '' })
      setShowUploadForm(false)
      setUploadFor(null)
      startTransition(() => router.refresh())
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document?')) return
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Document deleted')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Failed to delete')
    }
  }

  const UploadForm = ({ onSubmit, onCancel }: { onSubmit: (e: React.FormEvent) => void; onCancel: () => void }) => (
    <form onSubmit={onSubmit} className="bg-slate-50 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Document Name</label>
          <input
            type="text"
            value={uploadForm.name}
            onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
            className="w-full border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Offer Letter 2024"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Document Type</label>
          <select
            value={uploadForm.type}
            onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
            className="w-full border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">File URL</label>
        <input
          type="url"
          value={uploadForm.url}
          onChange={(e) => setUploadForm({ ...uploadForm, url: e.target.value })}
          className="w-full border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://…"
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="text-xs text-slate-500 hover:underline">Cancel</button>
        <button type="submit" disabled={submitting} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage employee documents and records</p>
        </div>
        {tab === 'my' && data.employee && (
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus size={16} /> Upload Document
          </button>
        )}
      </div>

      {data.canViewAll && (
        <div className="border-b border-border flex gap-1">
          {[{ key: 'my', label: 'My Documents' }, { key: 'all', label: 'All Employees' }].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as 'my' | 'all')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'my' && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {showUploadForm && (
            <div className="p-4 border-b border-border">
              <UploadForm onSubmit={handleUpload} onCancel={() => setShowUploadForm(false)} />
            </div>
          )}
          {!data.employee ? (
            <div className="p-10 text-center">
              <FileText size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 text-sm">Your account is not linked to an employee profile.</p>
            </div>
          ) : (
            <DocTable docs={data.myDocs} onDelete={handleDelete} />
          )}
        </div>
      )}

      {tab === 'all' && data.canViewAll && (
        <div className="space-y-2">
          {data.allEmployees.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-10 text-center">
              <FileText size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 text-sm">No employees found.</p>
            </div>
          ) : (
            data.allEmployees.map((emp) => (
              <div key={emp.id} className="bg-white rounded-xl border border-border overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedEmployee(expandedEmployee === emp.id ? null : emp.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 font-semibold text-xs">
                        {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{emp.name}</p>
                      <p className="text-xs text-slate-400">#{emp.code}{emp.department ? ` · ${emp.department}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{emp.documents.length} doc{emp.documents.length !== 1 ? 's' : ''}</span>
                    {data.canManageAll && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setUploadFor(uploadFor === emp.id ? null : emp.id) }}
                        className="p-1 text-slate-400 hover:text-blue-600"
                        title="Upload document"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                    {expandedEmployee === emp.id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </div>
                </div>

                {expandedEmployee === emp.id && (
                  <div className="border-t border-border">
                    {uploadFor === emp.id && (
                      <div className="p-4 border-b border-border">
                        <UploadForm
                          onSubmit={(e) => handleUpload(e, emp.id)}
                          onCancel={() => setUploadFor(null)}
                        />
                      </div>
                    )}
                    <DocTable docs={emp.documents} onDelete={handleDelete} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
