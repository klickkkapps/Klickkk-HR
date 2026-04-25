import { Construction } from 'lucide-react'

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Construction size={48} className="text-slate-300 mb-4" />
      <h1 className="text-2xl font-bold text-slate-900">Coming in Phase 2</h1>
      <p className="text-slate-500 mt-2 max-w-sm">
        This module is under development. Core HR, Billing, Org Chart, and RBAC are fully operational.
      </p>
    </div>
  )
}
