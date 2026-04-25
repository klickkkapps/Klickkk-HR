'use client'

import { useSession } from 'next-auth/react'
import { hasPermission } from '@/lib/utils'

export function useCurrentUser() {
  const { data: session, status } = useSession()
  return {
    user: session?.user ?? null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  }
}

export function usePermission(resource: string, action: string): boolean {
  const { user } = useCurrentUser()
  if (!user) return false
  return hasPermission(user.permissions, resource, action)
}

export function useTenant() {
  const { user } = useCurrentUser()
  return {
    tenantId: user?.tenantId ?? null,
    tenantSlug: user?.tenantSlug ?? null,
    tenantName: user?.tenantName ?? null,
  }
}
