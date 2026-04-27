import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth(async (req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const user = session?.user

  // ── Super admin section ──────────────────────────────────────────────────
  if (pathname.startsWith('/superadmin')) {
    if (pathname === '/superadmin') {
      if (user?.isSuperAdmin) {
        return NextResponse.redirect(new URL('/superadmin/dashboard', req.url))
      }
      return NextResponse.next()
    }
    if (!user?.isSuperAdmin) {
      return NextResponse.redirect(new URL('/superadmin', req.url))
    }
    return NextResponse.next()
  }

  // ── Always-public paths ───────────────────────────────────────────────────
  if (
    pathname === '/' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/billing/webhook') ||
    pathname === '/onboarding'
  ) {
    return NextResponse.next()
  }

  // ── Auth pages: redirect signed-in tenants to their dashboard ─────────────
  if (pathname === '/login' || pathname === '/signup') {
    if (user && !user.isSuperAdmin && user.tenantSlug) {
      return NextResponse.redirect(new URL(`/${user.tenantSlug}/`, req.url))
    }
    return NextResponse.next()
  }

  // ── Tenant dashboard routes /<slug>/... ───────────────────────────────────
  if (!user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user.isSuperAdmin) {
    return NextResponse.redirect(new URL('/superadmin/dashboard', req.url))
  }

  if (!user.tenantId) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
