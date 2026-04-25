'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function TenantStatusActions({
  tenantId,
  currentStatus,
}: {
  tenantId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: string) {
    setLoading(true)
    const res = await fetch(`/api/superadmin/tenants/${tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(false)
    if (res.ok) {
      toast.success('Tenant status updated')
      router.refresh()
    } else {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="flex gap-2">
      {currentStatus !== 'ACTIVE' && (
        <button
          onClick={() => updateStatus('ACTIVE')}
          disabled={loading}
          className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
        >
          {loading && <Loader2 size={12} className="animate-spin" />}
          Activate
        </button>
      )}
      {currentStatus === 'ACTIVE' && (
        <button
          onClick={() => updateStatus('SUSPENDED')}
          disabled={loading}
          className="px-3 py-1.5 bg-orange-700 hover:bg-orange-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
        >
          {loading && <Loader2 size={12} className="animate-spin" />}
          Suspend
        </button>
      )}
    </div>
  )
}
