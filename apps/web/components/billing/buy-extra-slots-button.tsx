'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Loader2, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const EXTRA_SLOT_PRICE_PAISE = 4900

declare global {
  interface Window {
    Razorpay: any
  }
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

export function BuyExtraSlotsButton({
  subscriptionId,
  cycleEnd,
  cycleStart,
}: {
  subscriptionId: string
  cycleEnd: string
  cycleStart?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [slots, setSlots] = useState(5)
  const [loading, setLoading] = useState(false)

  const totalPaise = slots * EXTRA_SLOT_PRICE_PAISE
  const taxableValue = Math.round(totalPaise / 1.18)
  const gst = totalPaise - taxableValue

  async function handlePurchase() {
    setLoading(true)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast.error('Failed to load payment SDK. Check your connection.')
        return
      }

      // Create Razorpay order on server
      const res = await fetch('/api/billing/extra-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots, subscriptionId }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to initiate payment')
        return
      }

      const { orderId, amount, keyId } = data

      // Open Razorpay checkout modal
      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency: 'INR',
        order_id: orderId,
        name: 'Klickkk HR',
        description: `Prepaid Extra Employee Slots × ${slots}`,
        theme: { color: '#2563eb' },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          // Verify on server & record slots + invoice
          const verifyRes = await fetch('/api/billing/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'extra_slots',
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              slots,
              subscriptionId,
              billingCycleStart: cycleStart ?? new Date().toISOString(),
              billingCycleEnd: cycleEnd,
            }),
          })

          if (verifyRes.ok) {
            toast.success(`${slots} extra slot${slots > 1 ? 's' : ''} added successfully!`)
            setOpen(false)
            router.refresh()
          } else {
            toast.error('Payment recorded but verification failed. Contact support.')
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      })

      rzp.open()
    } catch (err) {
      toast.error('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex-shrink-0"
      >
        <Plus size={15} />
        Buy Extra Slots
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-slate-900 text-lg">Buy Extra Employee Slots</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-sm text-amber-800">
              <strong>Prepaid subscription.</strong> Slots are valid for the current billing cycle only and will not carry forward.
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Number of slots</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSlots(Math.max(1, slots - 1))}
                  className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 text-slate-700 font-bold text-lg"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={slots}
                  onChange={(e) => setSlots(Math.max(1, Math.min(500, Number(e.target.value))))}
                  className="w-20 text-center px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
                <button
                  onClick={() => setSlots(Math.min(500, slots + 1))}
                  className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 text-slate-700 font-bold text-lg"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{slots} slot{slots > 1 ? 's' : ''} × ₹49/slot</span>
                <span>{formatCurrency(totalPaise)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-xs border-t border-slate-200 pt-2">
                <span>Taxable value</span>
                <span>{formatCurrency(taxableValue)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-xs">
                <span>GST @ 18%</span>
                <span>{formatCurrency(gst)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total (GST incl.)</span>
                <span>{formatCurrency(totalPaise)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Cycle ends: {new Date(cycleEnd).toLocaleDateString('en-IN')} ·
              Prepaid Extra Employee Slots (₹49/slot/month, GST included)
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                Pay {formatCurrency(totalPaise)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
