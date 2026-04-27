import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { hasPermission } from '@/lib/utils'

export async function GET() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const canReview = hasPermission(session.user.permissions, 'performance', 'review')

  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true },
  })

  const myReviews = employee
    ? await prisma.performanceReview.findMany({
        where: { tenantId, employeeId: employee.id },
        include: { reviewer: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const conductedReviews = canReview && employee
    ? await prisma.performanceReview.findMany({
        where: { tenantId, reviewerId: employee.id },
        include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : []

  return NextResponse.json({ myReviews, conductedReviews })
}

export async function POST(req: Request) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  if (!hasPermission(session.user.permissions, 'performance', 'review')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const reviewer = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true },
  })

  if (!reviewer) {
    return NextResponse.json({ error: 'No employee profile linked' }, { status: 400 })
  }

  const body = await req.json()
  if (!body.employeeId || !body.period) {
    return NextResponse.json({ error: 'employeeId and period are required' }, { status: 400 })
  }

  const review = await prisma.performanceReview.create({
    data: {
      tenantId,
      employeeId: body.employeeId,
      reviewerId: reviewer.id,
      period: body.period,
      rating: body.rating ? Number(body.rating) : null,
      feedback: body.feedback ?? null,
      status: 'SUBMITTED',
      reviewDate: new Date(),
    },
  })

  return NextResponse.json(review, { status: 201 })
}
