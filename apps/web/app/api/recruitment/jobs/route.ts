import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'

export async function GET() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const jobs = await prisma.jobPosting.findMany({
    where: { tenantId },
    include: {
      department: { select: { name: true } },
      location: { select: { name: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(jobs)
}

export async function POST(req: Request) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const body = await req.json()
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const job = await prisma.jobPosting.create({
    data: {
      tenantId,
      title: body.title.trim(),
      departmentId: body.departmentId ?? null,
      locationId: body.locationId ?? null,
      employmentType: body.employmentType ?? 'FULL_TIME',
      description: body.description ?? null,
      requirements: body.requirements ?? null,
      openings: Number(body.openings ?? 1),
      closingDate: body.closingDate ? new Date(body.closingDate) : null,
      createdBy: session.user.id,
    },
  })

  return NextResponse.json(job, { status: 201 })
}
