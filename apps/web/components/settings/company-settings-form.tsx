'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import type { Tenant, Department, Designation, Location } from '@klickkk/db'

export function CompanySettingsForm({
  tenant,
  departments,
  designations,
  locations,
}: {
  tenant: Tenant
  departments: Department[]
  designations: Designation[]
  locations: Location[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(tenant.name)
  const [gstin, setGstin] = useState(tenant.gstin ?? '')
  const [address, setAddress] = useState(tenant.address ?? '')
  const [state, setState] = useState(tenant.state ?? '')
  const [pincode, setPincode] = useState(tenant.pincode ?? '')
  const [supplyType, setSupplyType] = useState(tenant.supplyType)

  // Quick-add states
  const [newDept, setNewDept] = useState('')
  const [newDesig, setNewDesig] = useState('')
  const [newLocation, setNewLocation] = useState('')

  async function saveCompany() {
    setSaving(true)
    const res = await fetch('/api/settings/company', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, gstin, address, state, pincode, supplyType }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Company settings saved')
      router.refresh()
    } else {
      toast.error('Failed to save settings')
    }
  }

  async function addDepartment() {
    if (!newDept.trim()) return
    const res = await fetch('/api/settings/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newDept }),
    })
    if (res.ok) {
      toast.success('Department added')
      setNewDept('')
      router.refresh()
    } else {
      toast.error('Failed to add department')
    }
  }

  async function addDesignation() {
    if (!newDesig.trim()) return
    const res = await fetch('/api/settings/designations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newDesig }),
    })
    if (res.ok) {
      toast.success('Designation added')
      setNewDesig('')
      router.refresh()
    } else {
      toast.error('Failed to add designation')
    }
  }

  async function addLocation() {
    if (!newLocation.trim()) return
    const res = await fetch('/api/settings/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newLocation }),
    })
    if (res.ok) {
      toast.success('Location added')
      setNewLocation('')
      router.refresh()
    } else {
      toast.error('Failed to add location')
    }
  }

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="space-y-5">
      {/* Company Info */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Company Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">GSTIN</label>
            <input value={gstin} onChange={(e) => setGstin(e.target.value)} className={inputClass} placeholder="22AAAAA0000A1Z5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Supply Type (for GST)</label>
            <select value={supplyType} onChange={(e) => setSupplyType(e.target.value as any)} className={inputClass}>
              <option value="INTRA_STATE">Intra-State (CGST + SGST)</option>
              <option value="INTER_STATE">Inter-State (IGST)</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
            <input value={state} onChange={(e) => setState(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
            <input value={pincode} onChange={(e) => setPincode(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={saveCompany}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Departments */}
      <QuickListCard
        title="Departments"
        items={departments}
        newValue={newDept}
        onNewValueChange={setNewDept}
        onAdd={addDepartment}
        placeholder="e.g. Engineering"
      />

      {/* Designations */}
      <QuickListCard
        title="Designations"
        items={designations}
        newValue={newDesig}
        onNewValueChange={setNewDesig}
        onAdd={addDesignation}
        placeholder="e.g. Senior Software Engineer"
      />

      {/* Locations */}
      <QuickListCard
        title="Office Locations"
        items={locations}
        newValue={newLocation}
        onNewValueChange={setNewLocation}
        onAdd={addLocation}
        placeholder="e.g. Bangalore HQ"
      />
    </div>
  )
}

function QuickListCard({
  title,
  items,
  newValue,
  onNewValueChange,
  onAdd,
  placeholder,
}: {
  title: string
  items: { id: string; name: string }[]
  newValue: string
  onNewValueChange: (v: string) => void
  onAdd: () => void
  placeholder: string
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h2 className="font-semibold text-slate-900 mb-4">{title}</h2>
      <div className="flex gap-2 mb-4">
        <input
          value={newValue}
          onChange={(e) => onNewValueChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={onAdd}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1.5"
        >
          <Plus size={14} />
          Add
        </button>
      </div>
      <div className="space-y-1">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">No {title.toLowerCase()} added yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-slate-50">
              <span className="text-sm text-slate-800">{item.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
