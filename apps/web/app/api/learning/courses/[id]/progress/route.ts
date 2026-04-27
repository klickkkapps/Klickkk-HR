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
  if (!employee) return NextResponse.json({ error: 'No employee profile' }, { status: 400 })

  const body = await req.json()
  const progress = Math.min(100, Math.max(0, Number(body.progress ?? 0)))

  const updated = await prisma.courseEnrollment.update({
    where: { courseId_employeeId: { courseId: id, employeeId: employee.id } },
    data: {
      progress,
      completedAt: progress === 100 ? new Date() : null,
    },
  })

  return NextResponse.json(updated)
}
