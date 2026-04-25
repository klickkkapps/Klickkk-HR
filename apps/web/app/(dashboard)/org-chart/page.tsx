import { requireAuth } from '@/lib/session'
import { OrgChartClient } from '@/components/org-chart/org-chart-client'

export const metadata = { title: 'Org Chart' }

export default async function OrgChartPage() {
  await requireAuth()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Org Chart</h1>
        <p className="text-slate-500 text-sm mt-0.5">Visual hierarchy of your organization</p>
      </div>
      <OrgChartClient />
    </div>
  )
}
