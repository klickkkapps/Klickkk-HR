'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, ArrowUpRight } from 'lucide-react'

declare global {
  interface Window { Razorpay: any }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) return resolve(true)
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function UpgradePlanButton({ currentPlan }: { currentPlan: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (currentPlan === 'GROWTH' || currentPlan === 'ENTERPRISE') return null

  async function handleUpgrade() {
    setLoading(true)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast.error('Failed to load payment SDK. Check your connection.')
        return
      }

      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'GROWTH' }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to initiate upgrade')
        return
      }

      const { subscriptionId, amount, keyId } = data

      const rzp = new window.Razorpay({
        key: keyId,
        subscription_id: subscriptionId,
        name: 'Klickkk HR',
        description: 'Growth Plan — up to 75 active employees',
        theme: { color: '#2563eb' },
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_subscription_id: string
          razorpay_signature: string
        }) => {
          const verifyRes = await fetch('/api/billing/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'subscription',
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              plan: 'GROWTH',
            }),
          })

          if (verifyRes.ok) {
            toast.success('Upgraded to Growth plan!')
            router.refresh()
          } else {
            toast.error('Verification failed. Contact support.')
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      })

      rzp.open()
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium flex-shrink-0"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpRight size={14} />}
      Upgrade to Growth
    </button>
  )
}
