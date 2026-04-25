'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  DollarSign,
  TrendingUp,
  BookOpen,
  Receipt,
  FileText,
  BarChart3,
  Settings,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Briefcase,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href?: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  children?: { label: string; href: string }[]
  permission?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Employees', href: '/employees', icon: Users },
  { label: 'Org Chart', href: '/org-chart', icon: GitBranch },
  { label: 'Attendance', href: '/attendance', icon: Clock },
  { label: 'Leave', href: '/leave', icon: CalendarDays },
  { label: 'Payroll', href: '/payroll', icon: DollarSign },
  { label: 'Recruitment', href: '/recruitment', icon: Briefcase },
  { label: 'Performance', href: '/performance', icon: TrendingUp },
  { label: 'Learning', href: '/learning', icon: BookOpen },
  { label: 'Expenses', href: '/expenses', icon: Receipt },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  {
    label: 'Settings',
    icon: Settings,
    children: [
      { label: 'Company', href: '/settings/company' },
      { label: 'Roles & Permissions', href: '/settings/roles' },
      { label: 'Departments', href: '/settings/departments' },
      { label: 'Designations', href: '/settings/designations' },
      { label: 'Locations', href: '/settings/locations' },
    ],
  },
]

export function Sidebar({ tenantName }: { tenantName: string }) {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar flex flex-col z-30">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <div className="min-w-0">
            <div className="text-sidebar-foreground font-semibold text-sm truncate">{tenantName}</div>
            <div className="text-sidebar-foreground/40 text-xs">HRMS</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          if (item.children) {
            const isOpen = openGroups.includes(item.label)
            const hasActiveChild = item.children.some((c) => isActive(c.href))

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    hasActiveChild
                      ? 'text-sidebar-foreground bg-sidebar-accent'
                      : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <item.icon size={16} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {isOpen && (
                  <div className="ml-7 mt-0.5 space-y-0.5">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'block px-3 py-1.5 rounded-lg text-xs transition-colors',
                          isActive(child.href)
                            ? 'text-sidebar-foreground bg-sidebar-primary/20 font-medium'
                            : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive(item.href!)
                  ? 'text-sidebar-foreground bg-sidebar-primary font-medium'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom billing link */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <Link
          href="/billing"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            isActive('/billing')
              ? 'text-sidebar-foreground bg-sidebar-primary'
              : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
          )}
        >
          <Receipt size={16} />
          Billing & Slots
        </Link>
      </div>
    </aside>
  )
}
