import { auth } from './auth'
import { redirect } from 'next/navigation'
import { hasPermission } from './utils'

/** Server-side: get session or redirect to login */
export async function requireAuth() {
  const session = await auth()
  if (!session) redirect('/login')
  return session
}

/** Server-side: get session + assert permission */
export async function requirePermission(resource: string, action: string) {
  const session = await requireAuth()
  if (!hasPermission(session.user.permissions, resource, action)) {
    redirect('/')
  }
  return session
}

/** Server-side: require super admin */
export async function requireSuperAdmin() {
  const session = await requireAuth()
  if (!session.user.isSuperAdmin) redirect('/login')
  return session
}
