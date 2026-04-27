import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { hasPermission } from '@/lib/utils'

export async function GET(req: Request) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employeeId')
  const canViewAll = hasPermission(session.user.permissions, 'documents', 'read')

  const myEmployee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true },
  })

  const targetId = canViewAll && employeeId ? employeeId : (myEmployee?.id ?? '__none__')

  const docs = await prisma.employeeDocument.findMany({
    where: { employeeId: targetId },
    orderBy: { uploadedAt: 'desc' },
  })

  return NextResponse.json(docs)
}

export async function POST(req: Request) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const body = await req.json()

  const canManageAll = hasPermission(session.user.permissions, 'documents', 'manage')

  let targetEmployeeId = body.employeeId
  if (!canManageAll) {
    const myEmployee = await prisma.employee.findFirst({
      where: { userId: session.user.id, tenantId },
      select: { id: true },
    })
    if (!myEmployee) return NextResponse.json({ error: 'No employee profile linked' }, { status: 400 })
    targetEmployeeId = myEmployee.id
  }

  if (!targetEmployeeId || !body.name || !body.type || !body.url) {
    return NextResponse.json({ error: 'employeeId, name, type and url are required' }, { status: 400 })
  }

  // Verify employee belongs to tenant
  const employee = await prisma.employee.findFirst({ where: { id: targetEmployeeId, tenantId } })
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  const doc = await prisma.employeeDocument.create({
    data: {
      employeeId: targetEmployeeId,
      name: body.name,
      type: body.type,
      url: body.url,
      size: body.size ? Number(body.size) : null,
    },
  })

  return NextResponse.json(doc, { status: 201 })
}
