import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const employees = await prisma.employee.findMany({
    where: { tenantId: session.user.tenantId, status: { in: ['ACTIVE', 'ON_NOTICE'] } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeCode: true,
      reportingTo: true,
      profilePhotoUrl: true,
      designation: { select: { name: true } },
      department: { select: { name: true } },
    },
  })

  // Build tree structure
  const nodeMap = new Map(employees.map((e) => [
    e.id,
    {
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      title: e.designation?.name ?? '',
      department: e.department?.name ?? '',
      code: e.employeeCode,
      parentId: e.reportingTo,
      children: [] as any[],
    },
  ]))

  const roots: any[] = []

  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return NextResponse.json({ tree: roots, flat: employees })
}
