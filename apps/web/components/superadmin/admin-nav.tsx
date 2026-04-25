'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function AdminNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  if (pathname === '/superadmin') return null

  return (
    <nav className="h-14 border-b border-slate-800 flex items-center px-6 gap-6">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">K</span>
        </div>
        <span className="font-bold text-sm text-slate-100">Klickkk HR — Super Admin</span>
      </div>

      <div className="flex gap-4 text-sm flex-1">
        <Link
          href="/superadmin/dashboard"
          className={pathname === '/superadmin/dashboard' ? 'text-slate-100' : 'text-slate-400 hover:text-slate-100'}
        >
          Dashboard
        </Link>
        <Link
          href="/superadmin/tenants"
          className={pathname.startsWith('/superadmin/tenants') ? 'text-slate-100' : 'text-slate-400 hover:text-slate-100'}
        >
          Tenants
        </Link>
      </div>

      {session && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{session.user?.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/superadmin' })}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 px-2 py-1.5 hover:bg-slate-800 rounded-lg"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}
