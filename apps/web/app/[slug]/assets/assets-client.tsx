'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Package, Laptop, Smartphone, Monitor, Loader2, X, Check, UserCheck, Undo2, Wrench, Archive } from 'lucide-react'

type Employee = { id: string; firstName: string; lastName: string; employeeCode: string }
type AssetRow = {
  id: string; name: string; category: string; serialNumber: string | null
  brand: string | null; model: string | null; status: string
  notes: string | null; createdAt: string; currentHolder: Employee | null; assignmentId: string | null
}

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE:    'bg-green-100 text-green-700',
  ASSIGNED:     'bg-blue-100 text-blue-700',
  UNDER_REPAIR: 'bg-amber-100 text-amber-700',
  RETIRED:      'bg-slate-100 text-slate-500',
}

const CATEGORIES = ['Laptop', 'Desktop', 'Monitor', 'Phone', 'Tablet', 'Keyboard', 'Mouse', 'Headset', 'Other']

function CategoryIcon({ category }: { category: string }) {
  if (category === 'Laptop' || category === 'Desktop') return <Laptop size={16} />
  if (category === 'Phone' || category === 'Tablet') return <Smartphone size={16} />
  if (category === 'Monitor') return <Monitor size={16} />
  return <Package size={16} />
}

export function AssetsClient({ assets: initial, employees }: { assets: AssetRow[]; employees: Employee[] }) {
  const router = useRouter()
  const [assets, setAssets] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [showAssign, setShowAssign] = useState<AssetRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [assignEmpId, setAssignEmpId] = useState('')
  const [form, setForm] = useState({ name: '', category: 'Laptop', serialNumber: '', brand: '', model: '', notes: '' })

  function resetForm() { setForm({ name: '', category: 'Laptop', serialNumber: '', brand: '', model: '', notes: '' }) }

  async function createAsset() {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      const asset = await res.json()
      setAssets((prev) => [{ ...asset, currentHolder: null, assignmentId: null }, ...prev])
      toast.success('Asset added')
      setShowForm(false)
      resetForm()
    } else {
      toast.error('Failed to add asset')
    }
  }

  async function assignAsset() {
    if (!assignEmpId || !showAssign) return
    setSaving(true)
    const res = await fetch(`/api/assets/${showAssign.id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: assignEmpId }),
    })
    setSaving(false)
    if (res.ok) {
      const emp = employees.find((e) => e.id === assignEmpId)!
      setAssets((prev) => prev.map((a) => a.id === showAssign.id ? { ...a, status: 'ASSIGNED', currentHolder: emp } : a))
      toast.success('Asset assigned')
      setShowAssign(null)
      setAssignEmpId('')
    } else {
      toast.error('Failed to assign')
    }
  }

  async function returnAsset(asset: AssetRow) {
    if (!confirm(`Mark "${asset.name}" as returned?`)) return
    const res = await fetch(`/api/assets/${asset.id}/return`, { method: 'POST' })
    if (res.ok) {
      setAssets((prev) => prev.map((a) => a.id === asset.id ? { ...a, status: 'AVAILABLE', currentHolder: null, assignmentId: null } : a))
      toast.success('Asset returned')
    } else {
      toast.error('Failed to return asset')
    }
  }

  async function updateStatus(asset: AssetRow, status: string) {
    const res = await fetch(`/api/assets/${asset.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setAssets((prev) => prev.map((a) => a.id === asset.id ? { ...a, status } : a))
    }
  }

  const stats = {
    total:    assets.length,
    available: assets.filter((a) => a.status === 'AVAILABLE').length,
    assigned:  assets.filter((a) => a.status === 'ASSIGNED').length,
    repair:    assets.filter((a) => a.status === 'UNDER_REPAIR').length,
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Assets',  value: stats.total,     color: 'text-slate-700' },
          { label: 'Available',     value: stats.available, color: 'text-green-700' },
          { label: 'Assigned',      value: stats.assigned,  color: 'text-blue-700'  },
          { label: 'Under Repair',  value: stats.repair,    color: 'text-amber-700' },
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
          Add Asset
        </button>
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Add New Asset</h3>
              <button onClick={() => { setShowForm(false); resetForm() }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Asset Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. MacBook Pro 14"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Serial Number</label>
                  <input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} placeholder="S/N"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Brand</label>
                  <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Apple"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Model</label>
                  <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="MBP14,3"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any notes..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-100">
              <button onClick={() => { setShowForm(false); resetForm() }} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={createAsset} disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Add Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Assign {showAssign.name}</h3>
              <button onClick={() => { setShowAssign(null); setAssignEmpId('') }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign to employee</label>
              <select value={assignEmpId} onChange={(e) => setAssignEmpId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
                <option value="">Select employee...</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-100">
              <button onClick={() => { setShowAssign(null); setAssignEmpId('') }} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={assignAsset} disabled={saving || !assignEmpId}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-semibold transition-all">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {assets.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={32} className="mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-slate-400">No assets yet. Add your first asset above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Asset</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Serial</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Holder</th>
                  <th className="w-32 px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 flex-shrink-0">
                          <CategoryIcon category={asset.category} />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{asset.name}</div>
                          {(asset.brand || asset.model) && (
                            <div className="text-xs text-slate-400">{[asset.brand, asset.model].filter(Boolean).join(' · ')}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{asset.category}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{asset.serialNumber ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[asset.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {asset.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm">
                      {asset.currentHolder
                        ? `${asset.currentHolder.firstName} ${asset.currentHolder.lastName}`
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {asset.status === 'AVAILABLE' && (
                          <button onClick={() => setShowAssign(asset)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Assign">
                            <UserCheck size={14} />
                          </button>
                        )}
                        {asset.status === 'ASSIGNED' && (
                          <button onClick={() => returnAsset(asset)} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors" title="Mark returned">
                            <Undo2 size={14} />
                          </button>
                        )}
                        {asset.status !== 'UNDER_REPAIR' && asset.status !== 'ASSIGNED' && (
                          <button onClick={() => updateStatus(asset, 'UNDER_REPAIR')} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors" title="Send for repair">
                            <Wrench size={14} />
                          </button>
                        )}
                        {asset.status === 'UNDER_REPAIR' && (
                          <button onClick={() => updateStatus(asset, 'AVAILABLE')} className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors" title="Mark available">
                            <Check size={14} />
                          </button>
                        )}
                        {asset.status !== 'RETIRED' && (
                          <button onClick={() => updateStatus(asset, 'RETIRED')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Retire">
                            <Archive size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
