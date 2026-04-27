import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'

export default async function OnboardingPage() {
  const session = await auth()

  // Already has a tenant → go to dashboard
  if (session?.user.tenantId && (session.user as any).tenantSlug) {
    redirect(`/${(session.user as any).tenantSlug}/`)
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Almost there!</h1>
      <p className="text-slate-500 mb-6">
        Your account doesn&apos;t have a company workspace yet.
      </p>
      <Link
        href="/signup"
        className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
      >
        Set up your company
      </Link>
    </div>
  )
}
