'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontal, Loader2 } from 'lucide-react'

export function EmployeeActions({
  employeeId,
  currentStatus,
}: {
  employeeId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: string, extra?: Record<string, unknown>) {
    setLoading(true)
    setOpen(false)
    const res = await fetch(`/api/employees/${employeeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    })

    if (!res.ok) {
      const err = await res.json()
      if (err.code === 'CAPACITY_EXHAUSTED') {
        toast.error('No available slots. Purchase extra slots from Billing to re-activate.')
      } else {
        toast.error(err.error ?? 'Failed to update status')
      }
    } else {
      toast.success('Employee status updated')
      router.refresh()
    }
    setLoading(false)
  }

  const actions = []

  if (currentStatus !== 'ACTIVE') {
    actions.push({ label: 'Activate', onClick: () => updateStatus('ACTIVE') })
  }
  if (currentStatus === 'ACTIVE') {
    actions.push({ label: 'Mark On Notice', onClick: () => updateStatus('ON_NOTICE') })
    actions.push({ label: 'Suspend', onClick: () => updateStatus('SUSPENDED') })
  }
  if (currentStatus !== 'EXITED') {
    actions.push({
      label: 'Mark as Exited',
      onClick: () => updateStatus('EXITED', { exitDate: new Date().toISOString() }),
      danger: true,
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 flex items-center gap-1.5 text-sm"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <MoreHorizontal size={15} />}
        Actions
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                  action.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
