import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { hasPermission } from '@/lib/utils'

export async function GET() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true },
  })

  const courses = await prisma.course.findMany({
    where: { tenantId, status: 'PUBLISHED' },
    include: {
      enrollments: employee
        ? { where: { employeeId: employee.id }, select: { progress: true, completedAt: true, enrolledAt: true } }
        : false,
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ courses, employeeId: employee?.id ?? null })
}

export async function POST(req: Request) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  if (!hasPermission(session.user.permissions, 'learning', 'manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const course = await prisma.course.create({
    data: {
      tenantId,
      title: body.title.trim(),
      description: body.description ?? null,
      category: body.category ?? null,
      durationHrs: body.durationHrs ? Number(body.durationHrs) : null,
      contentUrl: body.contentUrl ?? null,
      status: 'PUBLISHED',
      createdBy: session.user.id,
    },
  })

  return NextResponse.json(course, { status: 201 })
}
