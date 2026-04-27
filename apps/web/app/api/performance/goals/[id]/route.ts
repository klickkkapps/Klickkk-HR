import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const { id } = await params

  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true },
  })

  const goal = await prisma.goal.findFirst({ where: { id, tenantId } })
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (goal.employeeId !== employee?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const updated = await prisma.goal.update({
    where: { id },
    data: {
      progress: body.progress !== undefined ? Math.min(100, Math.max(0, Number(body.progress))) : undefined,
      status: body.status ?? undefined,
      title: body.title ?? undefined,
      description: body.description ?? undefined,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const { id } = await params

  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true },
  })

  const goal = await prisma.goal.findFirst({ where: { id, tenantId } })
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (goal.employeeId !== employee?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.goal.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
