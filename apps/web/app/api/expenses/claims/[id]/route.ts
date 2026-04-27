import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { hasPermission } from '@/lib/utils'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const { id } = await params

  const claim = await prisma.expenseClaim.findFirst({ where: { id, tenantId } })
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const canApprove = hasPermission(session.user.permissions, 'expenses', 'approve')

  if (body.status === 'APPROVED' || body.status === 'REJECTED' || body.status === 'PAID') {
    if (!canApprove) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const reviewer = await prisma.employee.findFirst({
      where: { userId: session.user.id, tenantId },
      select: { id: true },
    })

    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: {
        status: body.status,
        reviewedBy: reviewer?.id ?? null,
        reviewedAt: new Date(),
        reviewNote: body.reviewNote ?? null,
        paidAt: body.status === 'PAID' ? new Date() : undefined,
      },
    })
    return NextResponse.json(updated)
  }

  if (body.status === 'DRAFT') {
    const employee = await prisma.employee.findFirst({
      where: { userId: session.user.id, tenantId },
      select: { id: true },
    })
    if (claim.employeeId !== employee?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: { status: 'DRAFT' },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const { id } = await params

  const claim = await prisma.expenseClaim.findFirst({ where: { id, tenantId } })
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true },
  })

  if (claim.employeeId !== employee?.id || !['DRAFT', 'SUBMITTED'].includes(claim.status)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.expenseClaim.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
