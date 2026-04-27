import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const { id } = await params

  const job = await prisma.jobPosting.findFirst({ where: { id, tenantId } })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  const updated = await prisma.jobPosting.update({
    where: { id },
    data: {
      status: body.status ?? undefined,
      title: body.title ?? undefined,
      description: body.description ?? undefined,
      requirements: body.requirements ?? undefined,
      openings: body.openings ? Number(body.openings) : undefined,
    },
  })

  return NextResponse.json(updated)
}
