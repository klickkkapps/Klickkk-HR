'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check, Loader2 } from 'lucide-react'

const schema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  name: z.string().min(2, 'Your name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  plan: z.enum(['STARTER', 'GROWTH']),
})

type FormData = z.infer<typeof schema>

const PLANS = [
  {
    id: 'STARTER' as const,
    name: 'Starter',
    price: '₹999',
    limit: '25 employees',
    features: ['Core HR', 'Attendance', 'Leave', 'Payroll'],
  },
  {
    id: 'GROWTH' as const,
    name: 'Growth',
    price: '₹1,999',
    limit: '75 employees',
    features: ['Everything in Starter', 'ATS', 'Performance', 'Expenses'],
  },
]

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { plan: 'STARTER' },
  })

  const selectedPlan = watch('plan')

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error ?? 'Failed to create account')
      return
    }

    toast.success('Account created! Starting your 7-day free trial...')
    router.push('/login')
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      <div className="flex items-center gap-2 mb-6">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
        <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
              <p className="text-slate-500 text-sm mb-4">7-day free trial. No credit card required.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company name</label>
              <input
                {...register('companyName')}
                placeholder="Acme Technologies"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your name</label>
              <input
                {...register('name')}
                placeholder="Ravi Sharma"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Work email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="ravi@acme.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                {...register('password')}
                type="password"
                placeholder="Min. 8 chars, 1 uppercase, 1 number"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Choose your plan</h2>
              <p className="text-slate-500 text-sm mb-4">All prices inclusive of GST. Free for 14 days.</p>
            </div>

            <div className="space-y-3">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setValue('plan', plan.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                    selectedPlan === plan.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-slate-900">{plan.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{plan.limit}</div>
                      <ul className="mt-2 space-y-1">
                        {plan.features.map((f) => (
                          <li key={f} className="text-xs text-slate-600 flex items-center gap-1.5">
                            <Check size={12} className="text-green-500 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{plan.price}</div>
                      <div className="text-xs text-slate-500">/month</div>
                      <div className="text-xs text-slate-400 mt-0.5">GST incl.</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-500 text-center">
              Extra employee slots available at ₹49/slot/month (GST incl.)
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Start free trial
              </button>
            </div>
          </div>
        )}
      </form>

      <p className="text-center text-sm text-slate-500 mt-4">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
