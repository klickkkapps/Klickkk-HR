'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Users } from 'lucide-react'

interface OrgNode {
  id: string
  name: string
  title: string
  department: string
  code: string
  parentId: string | null
  children: OrgNode[]
}

export function OrgChartClient() {
  const [tree, setTree] = useState<OrgNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/org-chart')
      .then((r) => r.json())
      .then((data) => {
        setTree(data.tree)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border p-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading org chart...</span>
        </div>
      </div>
    )
  }

  if (tree.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-12 text-center text-slate-400">
        <Users size={40} className="mx-auto mb-3 opacity-50" />
        <p className="font-medium">No employees with reporting relationships yet</p>
        <p className="text-sm mt-1">Assign reporting managers to employees to see the org chart.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border p-6 overflow-auto">
      <div className="min-w-max">
        {tree.map((node) => (
          <OrgNode key={node.id} node={node} depth={0} />
        ))}
      </div>
    </div>
  )
}

function OrgNode({ node, depth }: { node: OrgNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children.length > 0

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-3 border-l-2 border-slate-200 pl-4' : ''}`}>
      <div className="flex items-center gap-2">
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}

        <Link
          href={`/employees/${node.id}`}
          className="group flex items-center gap-3 bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm rounded-xl px-4 py-3 transition-all"
        >
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 font-semibold text-sm">
              {node.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div>
            <div className="font-medium text-slate-900 text-sm group-hover:text-blue-700">{node.name}</div>
            <div className="text-xs text-slate-500">{node.title || '—'}</div>
            {node.department && (
              <div className="text-xs text-slate-400 mt-0.5">{node.department}</div>
            )}
          </div>
          {hasChildren && (
            <div className="ml-4 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {node.children.length} direct
            </div>
          )}
        </Link>
      </div>

      {expanded && hasChildren && (
        <div className="mt-1">
          {node.children.map((child) => (
            <OrgNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
