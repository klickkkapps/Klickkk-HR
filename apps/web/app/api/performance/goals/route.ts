import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'

export async function GET() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true },
  })

  if (!employee) return NextResponse.json([])

  const goals = await prisma.goal.findMany({
    where: { tenantId, employeeId: employee.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(goals)
}

export async function POST(req: Request) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true },
  })

  if (!employee) {
    return NextResponse.json({ error: 'No employee profile linked' }, { status: 400 })
  }

  const body = await req.json()
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const goal = await prisma.goal.create({
    data: {
      tenantId,
      employeeId: employee.id,
      title: body.title.trim(),
      description: body.description ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  })

  return NextResponse.json(goal, { status: 201 })
}
