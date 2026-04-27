import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { hasPermission } from '@/lib/utils'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const { id } = await params

  const doc = await prisma.employeeDocument.findUnique({
    where: { id },
    include: { employee: { select: { tenantId: true, userId: true } } },
  })

  if (!doc || doc.employee.tenantId !== tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const canManageAll = hasPermission(session.user.permissions, 'documents', 'manage')
  const isOwner = doc.employee.userId === session.user.id

  if (!canManageAll && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.employeeDocument.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
