import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const { id } = await params

  const course = await prisma.course.findFirst({ where: { id, tenantId, status: 'PUBLISHED' } })
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true },
  })

  if (!employee) {
    return NextResponse.json({ error: 'No employee profile linked' }, { status: 400 })
  }

  const enrollment = await prisma.courseEnrollment.upsert({
    where: { courseId_employeeId: { courseId: id, employeeId: employee.id } },
    create: { tenantId, courseId: id, employeeId: employee.id },
    update: {},
  })

  return NextResponse.json(enrollment, { status: 201 })
}
