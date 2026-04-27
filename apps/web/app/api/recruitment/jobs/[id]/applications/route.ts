import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const { id } = await params

  const job = await prisma.jobPosting.findFirst({ where: { id, tenantId } })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const applications = await prisma.jobApplication.findMany({
    where: { jobPostingId: id },
    orderBy: { appliedAt: 'desc' },
  })

  return NextResponse.json(applications)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const { id } = await params

  const job = await prisma.jobPosting.findFirst({ where: { id, tenantId } })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  if (!body.candidateName || !body.email) {
    return NextResponse.json({ error: 'Candidate name and email are required' }, { status: 400 })
  }

  const application = await prisma.jobApplication.create({
    data: {
      tenantId,
      jobPostingId: id,
      candidateName: body.candidateName,
      email: body.email,
      phone: body.phone ?? null,
      resumeUrl: body.resumeUrl ?? null,
      coverLetter: body.coverLetter ?? null,
    },
  })

  return NextResponse.json(application, { status: 201 })
}
